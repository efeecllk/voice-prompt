import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../stores/appStore';
import { transcribeAudio, processWithPrompt, CustomTemplate } from '../lib/openai';
import { sendToTerminal } from '../lib/terminal';
import { sounds } from '../lib/sounds';
import { useMicRecorder } from './useMicRecorder';
import { TOGGLE_RECORDING_EVENT } from './useGlobalShortcut';

// Mounted once in App, so the global shortcut works whichever view is open (or none)
export function useAudioRecorder() {
  const {
    apiKey,
    isRecording,
    isProcessing,
    sourceLanguage,
    outputPrompt,
    customOutputFormats,
    targetTerminal,
    autoPaste,
    autoSubmit,
    setRecording,
    setProcessing,
    setResult,
    setError,
    addToHistory,
    clearCurrent,
  } = useAppStore();

  const processAudio = async (audioBlob: Blob) => {
    setProcessing(true);

    try {
      // Step 1: Transcribe audio in selected language
      const { text: sourceText, detectedLanguage } = await transcribeAudio(
        audioBlob,
        apiKey,
        sourceLanguage
      );

      if (!sourceText.trim()) {
        fail('Could not transcribe audio. Please try again.');
        return;
      }

      // Step 2: Process with selected prompt
      // Check if it's a custom output format
      let customTemplate: CustomTemplate | undefined;
      if (outputPrompt.startsWith('output-')) {
        const customFormat = customOutputFormats.find((f) => f.id === outputPrompt);
        if (customFormat) {
          customTemplate = {
            systemPrompt: customFormat.systemPrompt,
            outputFormat: customFormat.outputFormat,
            codeBlockLang: customFormat.codeBlockLang,
          };
        }
      }

      const result = await processWithPrompt(
        sourceText,
        apiKey,
        detectedLanguage,
        outputPrompt,
        customTemplate
      );

      // Set results and add to history
      setResult(sourceText, result.text);
      addToHistory(sourceText, result.text);

      // Copy before the done cue, so Cmd+V works the moment it sounds
      await invoke('copy_text', { text: result.text });
      sounds.done();

      // Auto-paste to terminal if enabled
      if (autoPaste && targetTerminal) {
        try {
          await sendToTerminal(result.text, targetTerminal, autoSubmit);
        } catch (err) {
          console.error('Auto-paste to terminal failed:', err);
        }
      }
    } catch (err) {
      fail(err instanceof Error ? err.message : String(err));
    } finally {
      setProcessing(false);
    }
  };

  // Errors can happen while another app is in front, so they get a sound too
  const fail = (message: string) => {
    setError(message);
    sounds.error();
  };

  const mic = useMicRecorder(processAudio, fail);

  const startRecording = async () => {
    clearCurrent();
    if (await mic.start()) {
      setRecording(true);
      sounds.start();
    }
  };

  const stopRecording = () => {
    setRecording(false);
    sounds.stop();
    mic.stop();
  };

  // The record button, Space and the global shortcut all dispatch this event.
  // Re-subscribed every render so the handler sees current state.
  useEffect(() => {
    const toggle = () => {
      if (isProcessing) return;
      if (!apiKey) return fail('Add your OpenAI API key in Settings first');
      if (isRecording) stopRecording();
      else startRecording();
    };
    window.addEventListener(TOGGLE_RECORDING_EVENT, toggle);
    return () => window.removeEventListener(TOGGLE_RECORDING_EVENT, toggle);
  });
}
