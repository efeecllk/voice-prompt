// Native microphone capture. WebKit holds getUserMedia requests while the page is
// hidden, so recording through the webview fails whenever the window is not on screen,
// which is exactly the case for the global shortcut.

use std::sync::mpsc::{self, Receiver, Sender};
use std::sync::{Arc, Mutex};
use std::thread::JoinHandle;

use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::{FromSample, SampleFormat, SizedSample};

const OUTPUT_RATE: u32 = 16_000;

type Samples = Arc<Mutex<Vec<f32>>>;
type RecordingThread = (Sender<()>, JoinHandle<Result<Vec<u8>, String>>);

// cpal streams are not Send on every platform, so each recording owns a thread that
// holds the stream until told to stop, then hands back the encoded audio.
#[derive(Default)]
pub struct Recording(Mutex<Option<RecordingThread>>);

// async so it runs off the main thread: macOS audio setup and teardown can need the main
// thread, and a synchronous command blocking it deadlocks
#[tauri::command]
pub async fn start_recording(state: tauri::State<'_, Recording>) -> Result<(), String> {
    let mut slot = state.0.lock().unwrap();
    if slot.is_some() {
        return Err("Already recording".into());
    }

    let (stop_tx, stop_rx) = mpsc::channel();
    let (ready_tx, ready_rx) = mpsc::channel();
    let handle = std::thread::spawn(move || record(stop_rx, ready_tx));

    // Wait for the stream to start so a missing device surfaces here, not on stop
    ready_rx
        .recv()
        .map_err(|_| "Recording thread exited unexpectedly".to_string())??;
    *slot = Some((stop_tx, handle));
    Ok(())
}

#[tauri::command]
pub async fn stop_recording(state: tauri::State<'_, Recording>) -> Result<tauri::ipc::Response, String> {
    let (stop_tx, handle) = state.0.lock().unwrap().take().ok_or("Not recording")?;
    let _ = stop_tx.send(());
    let wav = handle
        .join()
        .map_err(|_| "Recording thread panicked".to_string())??;
    Ok(tauri::ipc::Response::new(wav))
}

fn record(stop: Receiver<()>, ready: Sender<Result<(), String>>) -> Result<Vec<u8>, String> {
    let (stream, samples, rate) = match open_stream() {
        Ok(opened) => opened,
        Err(err) => {
            let _ = ready.send(Err(err.clone()));
            return Err(err);
        }
    };
    let _ = ready.send(Ok(()));

    // Blocks until stop_recording (or the sender is dropped)
    let _ = stop.recv();
    drop(stream);

    let samples = std::mem::take(&mut *samples.lock().unwrap());
    if samples.is_empty() {
        return Err("No audio recorded".into());
    }
    // macOS delivers pure silence instead of an error when microphone access is off
    if samples.iter().all(|s| *s == 0.0) {
        return Err("No sound was captured. Check that Voice Prompt is allowed under System Settings → Privacy & Security → Microphone.".into());
    }
    Ok(encode_wav(&resample(&samples, rate, OUTPUT_RATE), OUTPUT_RATE))
}

fn open_stream() -> Result<(cpal::Stream, Samples, u32), String> {
    let device = cpal::default_host()
        .default_input_device()
        .ok_or("No microphone found")?;
    let supported = device.default_input_config().map_err(|e| e.to_string())?;
    let config = supported.config();
    let samples: Samples = Arc::default();

    let stream = match supported.sample_format() {
        SampleFormat::F32 => build::<f32>(&device, config, samples.clone()),
        SampleFormat::I16 => build::<i16>(&device, config, samples.clone()),
        SampleFormat::I32 => build::<i32>(&device, config, samples.clone()),
        SampleFormat::U16 => build::<u16>(&device, config, samples.clone()),
        other => return Err(format!("Unsupported microphone sample format {other:?}")),
    }?;
    stream.play().map_err(|e| e.to_string())?;
    Ok((stream, samples, config.sample_rate))
}

// Keeps the first channel as f32; that's enough for speech
fn build<T>(device: &cpal::Device, config: cpal::StreamConfig, samples: Samples) -> Result<cpal::Stream, String>
where
    T: SizedSample,
    f32: FromSample<T>,
{
    let channels = config.channels as usize;
    device
        .build_input_stream(
            config,
            move |data: &[T], _| {
                let mut buf = samples.lock().unwrap();
                buf.extend(data.iter().step_by(channels).map(|s| s.to_sample::<f32>()));
            },
            |err| eprintln!("Recording stream error: {err}"),
            None,
        )
        .map_err(|e| e.to_string())
}

// Each output sample averages the input window it covers, which also low-passes enough
// to avoid aliasing when going from 44.1/48 kHz down to 16 kHz
fn resample(input: &[f32], from: u32, to: u32) -> Vec<f32> {
    if from == to {
        return input.to_vec();
    }
    let ratio = from as f64 / to as f64;
    let out_len = (input.len() as f64 / ratio) as usize;
    (0..out_len)
        .map(|i| {
            let start = (i as f64 * ratio) as usize;
            let end = (((i + 1) as f64 * ratio) as usize).clamp(start + 1, input.len());
            input[start..end].iter().sum::<f32>() / (end - start) as f32
        })
        .collect()
}

// 16-bit PCM mono WAV
fn encode_wav(samples: &[f32], rate: u32) -> Vec<u8> {
    let data_len = (samples.len() * 2) as u32;
    let mut wav = Vec::with_capacity(44 + data_len as usize);
    wav.extend_from_slice(b"RIFF");
    wav.extend_from_slice(&(36 + data_len).to_le_bytes());
    wav.extend_from_slice(b"WAVEfmt ");
    wav.extend_from_slice(&16u32.to_le_bytes()); // fmt chunk size
    wav.extend_from_slice(&1u16.to_le_bytes()); // PCM
    wav.extend_from_slice(&1u16.to_le_bytes()); // mono
    wav.extend_from_slice(&rate.to_le_bytes());
    wav.extend_from_slice(&(rate * 2).to_le_bytes()); // byte rate
    wav.extend_from_slice(&2u16.to_le_bytes()); // block align
    wav.extend_from_slice(&16u16.to_le_bytes()); // bits per sample
    wav.extend_from_slice(b"data");
    wav.extend_from_slice(&data_len.to_le_bytes());
    for s in samples {
        let v = (s.clamp(-1.0, 1.0) * i16::MAX as f32) as i16;
        wav.extend_from_slice(&v.to_le_bytes());
    }
    wav
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn resample_48k_to_16k_averages_windows() {
        let input: Vec<f32> = (0..9).map(|i| i as f32).collect();
        assert_eq!(resample(&input, 48_000, 16_000), vec![1.0, 4.0, 7.0]);
    }

    #[test]
    fn resample_44_1k_keeps_duration() {
        let one_second = vec![0.5; 44_100];
        let out = resample(&one_second, 44_100, 16_000);
        assert_eq!(out.len(), 16_000);
        assert!(out.iter().all(|s| (*s - 0.5).abs() < 1e-6));
    }

    #[test]
    fn wav_header_describes_16k_mono_pcm() {
        let wav = encode_wav(&[0.0, 1.0, -1.0], 16_000);
        assert_eq!(wav.len(), 44 + 6);
        assert_eq!(&wav[0..4], b"RIFF");
        assert_eq!(u32::from_le_bytes(wav[24..28].try_into().unwrap()), 16_000);
        assert_eq!(u16::from_le_bytes(wav[22..24].try_into().unwrap()), 1);
        assert_eq!(i16::from_le_bytes(wav[46..48].try_into().unwrap()), i16::MAX);
        assert_eq!(i16::from_le_bytes(wav[48..50].try_into().unwrap()), -i16::MAX);
    }
}
