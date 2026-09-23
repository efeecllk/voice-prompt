import { useAppStore } from '../stores/appStore';
import { transcribeAudio, processWithPrompt, CustomTemplate } from '../lib/openai';
import { sendToTerminal } from '../lib/terminal';
import { useMicRecorder } from './useMicRecorder';

export function useAudioRecorder() {
  const {
    apiKey,
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
        setError('Could not transcribe audio. Please try again.');
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

      // Auto-paste to terminal if enabled
      if (autoPaste && targetTerminal) {
        try {
          await sendToTerminal(result.text, targetTerminal, autoSubmit);
        } catch (err) {
          console.error('Auto-paste to terminal failed:', err);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setProcessing(false);
    }
  };

  const mic = useMicRecorder(processAudio, setError);

  const startRecording = async () => {
    clearCurrent();
    if (await mic.start()) {
      setRecording(true);
    }
  };

  const stopRecording = () => {
    setRecording(false);
    mic.stop();
  };

  return { startRecording, stopRecording };
}
