import { useState, useRef } from 'react';
import { open } from '@tauri-apps/plugin-shell';
import { useAppStore } from '../stores/appStore';
import { BackIcon, EyeIcon, EyeOffIcon, LockIcon, PlusIcon, ChevronIcon, TrashIcon, MicrophoneIcon, StopIcon, SpinnerIcon } from './icons';
import LanguageSelect from './LanguageSelect';
import PromptSelect from './PromptSelect';
import { transcribeAudio, generateOutputFormatFromVoice } from '../lib/openai';

interface SettingsProps {
  onBack: () => void;
}

const SAMPLE_TEMPLATE = `You are a helpful assistant. Process the following {sourceLang} input and respond accordingly.

## Instructions
- Be concise and clear
- Focus on the user's intent

## Output
Provide your response based on the input.`;

interface NewOutputFormat {
  name: string;
  description: string;
  icon: string;
  systemPrompt: string;
}

const emptyFormat: NewOutputFormat = {
  name: '',
  description: '',
  icon: '✨',
  systemPrompt: '',
};

const EMOJI_OPTIONS = ['✨', '🚀', '💡', '🎯', '📝', '🔧', '🎨', '⚡', '🌟', '💬', '📊', '🔍'];

export default function Settings({ onBack }: SettingsProps) {
  const { apiKey, sourceLanguage, outputPrompt, shortcut, theme, customOutputFormats, setApiKey, setSourceLanguage, setOutputPrompt, setShortcut, setTheme, addCustomOutputFormat, deleteCustomOutputFormat } = useAppStore();
  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [localLanguage, setLocalLanguage] = useState(sourceLanguage);
  const [localPrompt, setLocalPrompt] = useState(outputPrompt);
  const [localShortcut, setLocalShortcut] = useState(shortcut);
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showCreateFormat, setShowCreateFormat] = useState(false);
  const [newFormat, setNewFormat] = useState<NewOutputFormat>(emptyFormat);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleSave = async () => {
    setIsSaving(true);

    // If creating a new output format with valid content, save it first
    if (showCreateFormat && newFormat.name.trim() && newFormat.systemPrompt.trim()) {
      addCustomOutputFormat({
        name: newFormat.name.trim(),
        description: newFormat.description.trim(),
        icon: newFormat.icon || '✨',
        systemPrompt: newFormat.systemPrompt.trim(),
        outputFormat: 'text',
      });
      setNewFormat(emptyFormat);
      setShowCreateFormat(false);
    }

    await setApiKey(localApiKey);
    setSourceLanguage(localLanguage);
    setOutputPrompt(localPrompt);
    setShortcut(localShortcut);
    setIsSaving(false);
    onBack();
  };

  const handleDeleteFormat = (id: string) => {
    if (deleteConfirm === id) {
      deleteCustomOutputFormat(id);
      setDeleteConfirm(null);
      // If the deleted format was selected, reset to default
      if (localPrompt === id) {
        setLocalPrompt('default-translation');
      }
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const handleUseSampleTemplate = () => {
    setNewFormat({ ...newFormat, systemPrompt: SAMPLE_TEMPLATE });
  };

  // Voice recording handlers
  const startRecording = async () => {
    if (!localApiKey) {
      setVoiceError('Please add your OpenAI API key first');
      return;
    }

    try {
      setVoiceError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());

        if (chunksRef.current.length === 0) {
          setVoiceError('No audio recorded');
          return;
        }

        setIsGenerating(true);

        try {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });

          // Step 1: Transcribe audio
          const { text: voiceDescription } = await transcribeAudio(
            audioBlob,
            localApiKey,
            localLanguage
          );

          if (!voiceDescription.trim()) {
            setVoiceError('Could not transcribe audio. Please try again.');
            return;
          }

          // Step 2: Generate output format from voice description
          const generated = await generateOutputFormatFromVoice(voiceDescription, localApiKey);

          // Step 3: Fill in the form (keep current icon or default)
          setNewFormat({
            name: generated.name,
            description: generated.description,
            icon: newFormat.icon || '✨',
            systemPrompt: generated.systemPrompt,
          });

          // Auto-expand the create section if not already
          setShowCreateFormat(true);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'An error occurred';
          setVoiceError(message);
        } finally {
          setIsGenerating(false);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100);
      setIsRecording(true);
    } catch (err) {
      setIsRecording(false);
      const message = err instanceof Error ? err.message : 'Failed to access microphone';
      setVoiceError(message);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);

    try {
      if (mediaRecorderRef.current) {
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
        mediaRecorderRef.current.stream?.getTracks().forEach((track) => track.stop());
        mediaRecorderRef.current = null;
      }
    } catch (err) {
      console.error('Error stopping recording:', err);
    }
  };

  const handleVoiceRecordToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const shortcutOptions = [
    { value: 'CommandOrControl+Shift+Space', label: 'Cmd+Shift+Space' },
    { value: 'CommandOrControl+Alt+Space', label: 'Cmd+Option+Space' },
    { value: 'CommandOrControl+Shift+Period', label: 'Cmd+Shift+.' },
    { value: 'CommandOrControl+Alt+V', label: 'Cmd+Option+V' },
  ];

  return (
    <div className="flex flex-col h-full bg-surface-50 dark:bg-surface-900">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-200 dark:border-surface-800">
        <button
          onClick={onBack}
          className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
        >
          <BackIcon size={16} className="text-surface-500 dark:text-surface-400" />
        </button>
        <span className="font-medium text-surface-900 dark:text-surface-100">Settings</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* API Key */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
              OpenAI API Key
            </label>
            <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <LockIcon size={12} />
              Stored locally
            </span>
          </div>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={localApiKey}
              onChange={(e) => setLocalApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-3 py-2.5 pr-10 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-sm text-surface-800 dark:text-surface-200 placeholder:text-surface-300 dark:placeholder:text-surface-600 focus:outline-none focus:ring-2 focus:ring-accent-400/50 focus:border-accent-400"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
            >
              {showKey ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
            </button>
          </div>
          <p className="mt-1.5 text-xs text-surface-400 dark:text-surface-500">
            Get your API key from{' '}
            <button
              type="button"
              onClick={() => open('https://platform.openai.com/api-keys')}
              className="text-accent-500 hover:text-accent-600 dark:text-accent-400 dark:hover:text-accent-300 underline-offset-2 hover:underline"
            >
              platform.openai.com
            </button>
          </p>
        </div>

        {/* Source Language */}
        <div>
          <label className="block text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2">
            Source Language
          </label>
          <LanguageSelect value={localLanguage} onChange={setLocalLanguage} />
          <p className="mt-1.5 text-xs text-surface-400 dark:text-surface-500">
            {localLanguage === 'auto'
              ? 'Whisper will automatically detect the language'
              : 'The language you will speak in'}
          </p>
        </div>

        {/* Output Prompt */}
        <div>
          <label className="block text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2">
            Output Format
          </label>
          <PromptSelect value={localPrompt} onChange={setLocalPrompt} />
          <p className="mt-1.5 text-xs text-surface-400 dark:text-surface-500">
            How your voice input will be processed
          </p>
        </div>

        {/* Create Custom Output Format */}
        <div className="border-t border-surface-200 dark:border-surface-700 pt-4">
          {/* Custom Formats List */}
          {customOutputFormats.length > 0 && (
            <div className="mb-4">
              <label className="block text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2">
                Your Output Formats
              </label>
              <div className="space-y-2">
                {customOutputFormats.map((format) => (
                  <div
                    key={format.id}
                    className="flex items-center justify-between bg-surface-100 dark:bg-surface-800 rounded-lg px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-surface-700 dark:text-surface-200 truncate">
                        {format.icon || '✨'} {format.name}
                      </p>
                      {format.description && (
                        <p className="text-xs text-surface-400 dark:text-surface-500 truncate">
                          {format.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteFormat(format.id)}
                      className={`ml-2 p-1.5 rounded transition-colors ${
                        deleteConfirm === format.id
                          ? 'bg-error/20 text-error'
                          : 'hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-400 hover:text-error'
                      }`}
                      title={deleteConfirm === format.id ? 'Click again to delete' : 'Delete'}
                    >
                      <TrashIcon size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Toggle Create Section */}
          <button
            onClick={() => setShowCreateFormat(!showCreateFormat)}
            className="flex items-center gap-2 text-sm font-medium text-accent-500 hover:text-accent-600 dark:text-accent-400 dark:hover:text-accent-300 transition-colors"
          >
            <ChevronIcon
              size={12}
              className={`transform transition-transform ${showCreateFormat ? 'rotate-180' : ''}`}
            />
            <PlusIcon size={14} />
            Create your own output format
          </button>

          {/* Create Form */}
          {showCreateFormat && (
            <div className="mt-4 p-4 bg-surface-100 dark:bg-surface-800 rounded-lg space-y-4">
              {/* Voice Record Button */}
              <div className="flex items-center justify-between pb-3 border-b border-surface-200 dark:border-surface-700">
                <div className="flex-1">
                  <p className="text-xs font-medium text-surface-600 dark:text-surface-300">
                    Describe with voice
                  </p>
                  <p className="text-[10px] text-surface-400 dark:text-surface-500 mt-0.5">
                    {isGenerating ? 'Generating format...' : isRecording ? 'Recording... Click to stop' : 'Click to describe what you want'}
                  </p>
                </div>
                <button
                  onClick={handleVoiceRecordToggle}
                  disabled={isGenerating}
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200
                    ${isRecording
                      ? 'bg-error text-white animate-pulse'
                      : isGenerating
                        ? 'bg-surface-200 dark:bg-surface-700 text-surface-400 cursor-not-allowed'
                        : 'bg-accent-500 hover:bg-accent-600 text-white hover:scale-105'
                    }
                  `}
                  title={isRecording ? 'Stop recording' : 'Start recording'}
                >
                  {isGenerating ? (
                    <SpinnerIcon size={18} className="animate-spin" />
                  ) : isRecording ? (
                    <StopIcon size={18} />
                  ) : (
                    <MicrophoneIcon size={18} />
                  )}
                </button>
              </div>

              {/* Voice Error */}
              {voiceError && (
                <div className="bg-error/10 border border-error/30 rounded-lg p-2 text-xs text-error">
                  {voiceError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  value={newFormat.name}
                  onChange={(e) => setNewFormat({ ...newFormat, name: e.target.value })}
                  placeholder="My Custom Format"
                  className="w-full px-3 py-2 bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg text-sm text-surface-800 dark:text-surface-100 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-accent-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1.5">
                  Description
                </label>
                <input
                  type="text"
                  value={newFormat.description}
                  onChange={(e) => setNewFormat({ ...newFormat, description: e.target.value })}
                  placeholder="What does this format do?"
                  className="w-full px-3 py-2 bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg text-sm text-surface-800 dark:text-surface-100 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-accent-500/50"
                />
              </div>

              {/* Icon Selector */}
              <div>
                <label className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1.5">
                  Icon
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowIconPicker(!showIconPicker)}
                    className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg hover:border-accent-400 dark:hover:border-accent-500 transition-colors"
                  >
                    <span className="text-xl">{newFormat.icon}</span>
                    <span className="text-xs text-surface-400">Click to change</span>
                  </button>

                  {showIconPicker && (
                    <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg shadow-lg z-10">
                      <div className="grid grid-cols-6 gap-1">
                        {EMOJI_OPTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setNewFormat({ ...newFormat, icon: emoji });
                              setShowIconPicker(false);
                            }}
                            className={`w-8 h-8 rounded-md text-lg flex items-center justify-center transition-all hover:bg-surface-100 dark:hover:bg-surface-600 ${
                              newFormat.icon === emoji ? 'bg-accent-100 dark:bg-accent-900/30' : ''
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-surface-500 dark:text-surface-400">
                    System Prompt
                  </label>
                  <button
                    onClick={handleUseSampleTemplate}
                    className="text-xs text-accent-500 hover:text-accent-600 dark:text-accent-400"
                  >
                    Use sample template
                  </button>
                </div>
                <textarea
                  value={newFormat.systemPrompt}
                  onChange={(e) => setNewFormat({ ...newFormat, systemPrompt: e.target.value })}
                  placeholder="Enter your system prompt here...

Use {sourceLang} as a placeholder for the source language."
                  rows={6}
                  className="w-full px-3 py-2 bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg text-sm text-surface-800 dark:text-surface-100 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-accent-500/50 resize-none font-mono"
                />
                <p className="text-[10px] text-surface-400 dark:text-surface-500 mt-1">
                  Use <code className="bg-surface-200 dark:bg-surface-700 px-1 rounded">{'{sourceLang}'}</code> to insert the detected language
                </p>
              </div>

            </div>
          )}
        </div>

        {/* Shortcut */}
        <div>
          <label className="block text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2">
            Global Shortcut
          </label>
          <div className="grid grid-cols-2 gap-2">
            {shortcutOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setLocalShortcut(opt.value)}
                className={`
                  py-2.5 px-3 rounded-lg border text-sm font-medium transition-all
                  ${localShortcut === opt.value
                    ? 'bg-surface-900 dark:bg-surface-100 border-surface-900 dark:border-surface-100 text-white dark:text-surface-900'
                    : 'bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-surface-500 dark:text-surface-400 hover:border-surface-300 dark:hover:border-surface-600'
                  }
                `}
              >
                <kbd className="font-mono text-xs">{opt.label}</kbd>
              </button>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div>
          <label className="block text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2">
            Theme
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setTheme('system')}
              className={`
                flex-1 py-2.5 px-3 rounded-lg border text-sm font-medium transition-all
                ${theme === 'system'
                  ? 'bg-surface-900 dark:bg-surface-100 border-surface-900 dark:border-surface-100 text-white dark:text-surface-900'
                  : 'bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-surface-500 dark:text-surface-400 hover:border-surface-300 dark:hover:border-surface-600'
                }
              `}
            >
              System
            </button>
            <button
              onClick={() => setTheme('light')}
              className={`
                flex-1 py-2.5 px-3 rounded-lg border text-sm font-medium transition-all
                ${theme === 'light'
                  ? 'bg-surface-900 dark:bg-surface-100 border-surface-900 dark:border-surface-100 text-white dark:text-surface-900'
                  : 'bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-surface-500 dark:text-surface-400 hover:border-surface-300 dark:hover:border-surface-600'
                }
              `}
            >
              Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`
                flex-1 py-2.5 px-3 rounded-lg border text-sm font-medium transition-all
                ${theme === 'dark'
                  ? 'bg-surface-900 dark:bg-surface-100 border-surface-900 dark:border-surface-100 text-white dark:text-surface-900'
                  : 'bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-surface-500 dark:text-surface-400 hover:border-surface-300 dark:hover:border-surface-600'
                }
              `}
            >
              Dark
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-surface-200 dark:border-surface-800">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-2.5 bg-surface-900 dark:bg-surface-100 hover:bg-surface-800 dark:hover:bg-surface-200 text-white dark:text-surface-900 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
