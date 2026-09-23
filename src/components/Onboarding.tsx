import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-shell';
import { enable, disable, isEnabled } from '@tauri-apps/plugin-autostart';
import { useAppStore } from '../stores/appStore';
import { validateApiKey } from '../lib/openai';
import { AppLogoIcon, CheckIcon, SpinnerIcon } from './icons';

type Step = 'key' | 'mic' | 'accessibility' | 'done';
const STEPS: Step[] = ['key', 'mic', 'accessibility', 'done'];

const isMac = navigator.userAgent.includes('Mac');

const primaryButton =
  'w-full py-2.5 bg-surface-900 dark:bg-surface-100 hover:bg-surface-800 dark:hover:bg-surface-200 text-white dark:text-surface-900 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2';
const secondaryButton =
  'w-full py-2 text-sm text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors';
const title = 'text-lg font-medium text-surface-900 dark:text-surface-100';
const body = 'text-sm text-surface-500 dark:text-surface-400 leading-relaxed';

export default function Onboarding({ onFinish }: { onFinish: () => void }) {
  const { shortcut, setApiKey } = useAppStore();
  const [step, setStep] = useState<Step>('key');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [key, setKey] = useState('');
  const [micGranted, setMicGranted] = useState(false);
  const [axGranted, setAxGranted] = useState(false);
  const [waitingForAx, setWaitingForAx] = useState(false);
  const [autostart, setAutostart] = useState(false);

  const next = () => {
    setError(null);
    setStep(STEPS[STEPS.indexOf(step) + 1]);
  };

  const handleSaveKey = async () => {
    setBusy(true);
    setError(null);
    try {
      if (await validateApiKey(key.trim())) {
        await setApiKey(key.trim());
        next();
      } else {
        setError('OpenAI rejected this key. Check that it was copied completely.');
      }
    } catch {
      setError("Couldn't reach OpenAI. Check your internet connection.");
    } finally {
      setBusy(false);
    }
  };

  const handleAllowMic = async () => {
    setError(null);
    try {
      // Triggers the macOS microphone prompt the first time
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setMicGranted(true);
    } catch {
      setError(
        isMac
          ? 'Microphone access was denied. Turn on Voice Prompt in System Settings → Privacy & Security → Microphone, then try again.'
          : 'Microphone access was denied. Allow it in your system settings, then try again.'
      );
    }
  };

  // Skip the step where the permission is already granted or not needed (non-macOS)
  useEffect(() => {
    if (step !== 'accessibility') return;
    invoke<boolean>('check_accessibility', { prompt: false }).then((granted) => {
      if (granted) next();
    });
  }, [step]);

  // After the system dialog, poll until the user flips the switch in System Settings
  useEffect(() => {
    if (!waitingForAx) return;
    const timer = window.setInterval(async () => {
      if (await invoke<boolean>('check_accessibility', { prompt: false })) {
        setAxGranted(true);
        setWaitingForAx(false);
      }
    }, 1500);
    return () => window.clearInterval(timer);
  }, [waitingForAx]);

  const handleAllowAccessibility = async () => {
    const granted = await invoke<boolean>('check_accessibility', { prompt: true });
    if (granted) setAxGranted(true);
    else setWaitingForAx(true);
  };

  useEffect(() => {
    if (step === 'done') isEnabled().then(setAutostart).catch(console.error);
  }, [step]);

  const toggleAutostart = async () => {
    try {
      await (autostart ? disable() : enable());
      setAutostart(!autostart);
    } catch (err) {
      console.error('Failed to change launch at login:', err);
    }
  };

  const shortcutLabel = shortcut
    .replace('CommandOrControl', isMac ? 'Cmd' : 'Ctrl')
    .replace('Alt', isMac ? 'Option' : 'Alt')
    .split('+')
    .join(' + ');

  return (
    <div className="flex flex-col h-full bg-surface-50 dark:bg-surface-900">
      {/* Header with progress */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200 dark:border-surface-800">
        <div className="flex items-center gap-2.5">
          <AppLogoIcon size={22} className="text-surface-600 dark:text-surface-300" />
          <span className="text-base font-medium text-surface-800 dark:text-surface-100">Voice Prompt</span>
        </div>
        <div className="flex gap-1.5">
          {STEPS.map((s, i) => (
            <span
              key={s}
              className={`h-1.5 w-1.5 rounded-full ${
                i <= STEPS.indexOf(step) ? 'bg-surface-700 dark:bg-surface-200' : 'bg-surface-200 dark:bg-surface-700'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {step === 'key' && (
          <>
            <h1 className={title}>Connect OpenAI</h1>
            <p className={body}>
              Voice Prompt uses your OpenAI API key to transcribe and translate. It stays on this device.
            </p>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && key.trim() && !busy && handleSaveKey()}
              placeholder="sk-..."
              autoFocus
              className="w-full px-3 py-2.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-sm text-surface-800 dark:text-surface-200 placeholder:text-surface-300 dark:placeholder:text-surface-600 focus:outline-none focus:ring-2 focus:ring-accent-400/50 focus:border-accent-400"
            />
            <button
              type="button"
              onClick={() => open('https://platform.openai.com/api-keys')}
              className="text-xs text-accent-500 hover:text-accent-600 dark:text-accent-400 dark:hover:text-accent-300 hover:underline underline-offset-2"
            >
              Get an API key at platform.openai.com
            </button>
          </>
        )}

        {step === 'mic' && (
          <>
            <h1 className={title}>Allow the microphone</h1>
            <p className={body}>macOS will ask once. Audio is only recorded while you hold a recording open.</p>
            {micGranted && (
              <p className="flex items-center gap-2 text-sm text-success">
                <CheckIcon size={14} /> Microphone allowed
              </p>
            )}
          </>
        )}

        {step === 'accessibility' && (
          <>
            <h1 className={title}>Paste into your terminal</h1>
            <p className={body}>
              To paste results straight into your terminal, macOS needs Voice Prompt enabled under Accessibility.
              Without it, pasting silently does nothing. Copying still works.
            </p>
            {axGranted ? (
              <p className="flex items-center gap-2 text-sm text-success">
                <CheckIcon size={14} /> Accessibility allowed
              </p>
            ) : (
              waitingForAx && (
                <p className="flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400">
                  <SpinnerIcon size={14} /> Turn on Voice Prompt in System Settings → Privacy & Security → Accessibility
                </p>
              )
            )}
          </>
        )}

        {step === 'done' && (
          <>
            <h1 className={title}>You're set</h1>
            <p className={body}>
              Press <kbd className="px-1.5 py-0.5 bg-surface-100 dark:bg-surface-800 rounded font-mono text-xs">{shortcutLabel}</kbd>{' '}
              anywhere to start recording, and press it again to stop. The result is copied and translated
              automatically.
            </p>
            <button
              onClick={toggleAutostart}
              className="w-full flex items-center justify-between bg-surface-100 dark:bg-surface-800 rounded-lg px-3 py-2.5"
            >
              <span className="text-sm text-surface-700 dark:text-surface-200">Launch at login</span>
              <span
                className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${
                  autostart ? 'bg-accent-500' : 'bg-surface-300 dark:bg-surface-600'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                    autostart ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </span>
            </button>
          </>
        )}

        {error && (
          <div className="bg-error/10 border border-error/30 rounded-lg p-3 text-sm text-error-dark dark:text-error-light">
            {error}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-surface-200 dark:border-surface-800 space-y-1">
        {step === 'key' && (
          <button onClick={handleSaveKey} disabled={!key.trim() || busy} className={primaryButton}>
            {busy && <SpinnerIcon size={14} />} Continue
          </button>
        )}
        {step === 'mic' &&
          (micGranted ? (
            <button onClick={next} className={primaryButton}>Continue</button>
          ) : (
            <button onClick={handleAllowMic} className={primaryButton}>Allow microphone</button>
          ))}
        {step === 'accessibility' && (
          <>
            {axGranted ? (
              <button onClick={next} className={primaryButton}>Continue</button>
            ) : (
              <button onClick={handleAllowAccessibility} className={primaryButton}>Allow Accessibility</button>
            )}
            {!axGranted && (
              <button onClick={next} className={secondaryButton}>Skip, I'll only copy results</button>
            )}
          </>
        )}
        {step === 'done' && (
          <button onClick={onFinish} className={primaryButton}>Start using Voice Prompt</button>
        )}
      </div>
    </div>
  );
}
