import { useState, useRef } from 'react';
import { useAppStore, CustomPrompt } from '../stores/appStore';
import { BackIcon, FileTextIcon, PlusIcon, TrashIcon, CheckIcon, MicrophoneIcon, StopIcon, SpinnerIcon, CopyIcon } from './icons';
import { transcribeAudio, generatePromptFromVoice } from '../lib/openai';

interface MyPromptsProps {
  onBack: () => void;
}

type View = 'list' | 'edit';

interface EditingPrompt {
  id?: string;
  name: string;
  description: string;
  systemPrompt: string;
}

const emptyPrompt: EditingPrompt = {
  name: '',
  description: '',
  systemPrompt: '',
};

export default function MyPrompts({ onBack }: MyPromptsProps) {
  const { apiKey, sourceLanguage, customPrompts, addCustomPrompt, updateCustomPrompt, deleteCustomPrompt } = useAppStore();
  const [view, setView] = useState<View>('list');
  const [editingPrompt, setEditingPrompt] = useState<EditingPrompt>(emptyPrompt);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCreateNew = () => {
    setEditingPrompt(emptyPrompt);
    setError(null);
    setView('edit');
  };

  const handleEdit = (prompt: CustomPrompt) => {
    setEditingPrompt({
      id: prompt.id,
      name: prompt.name,
      description: prompt.description,
      systemPrompt: prompt.systemPrompt,
    });
    setError(null);
    setView('edit');
  };

  const handleSave = () => {
    if (!editingPrompt.name.trim() || !editingPrompt.systemPrompt.trim()) {
      return;
    }

    if (editingPrompt.id) {
      // Update existing
      updateCustomPrompt(editingPrompt.id, {
        name: editingPrompt.name.trim(),
        description: editingPrompt.description.trim(),
        systemPrompt: editingPrompt.systemPrompt.trim(),
      });
    } else {
      // Create new
      addCustomPrompt({
        name: editingPrompt.name.trim(),
        description: editingPrompt.description.trim(),
        systemPrompt: editingPrompt.systemPrompt.trim(),
      });
    }

    setView('list');
    setEditingPrompt(emptyPrompt);
  };

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      deleteCustomPrompt(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      // Reset confirm after 3 seconds
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const handleCancel = () => {
    setView('list');
    setEditingPrompt(emptyPrompt);
    setError(null);
  };

  // Voice recording handlers
  const startRecording = async () => {
    if (!apiKey) {
      setError('Please add your OpenAI API key in Settings');
      return;
    }

    try {
      setError(null);
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
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());

        if (chunksRef.current.length === 0) {
          setError('No audio recorded');
          return;
        }

        setIsProcessing(true);

        try {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });

          // Step 1: Transcribe audio
          const { text: voiceDescription } = await transcribeAudio(
            audioBlob,
            apiKey,
            sourceLanguage
          );

          if (!voiceDescription.trim()) {
            setError('Could not transcribe audio. Please try again.');
            return;
          }

          // Step 2: Generate prompt from voice description
          const generatedPrompt = await generatePromptFromVoice(voiceDescription, apiKey);

          // Step 3: Fill in the form with generated content
          setEditingPrompt({
            ...editingPrompt,
            name: generatedPrompt.name,
            description: generatedPrompt.description,
            systemPrompt: generatedPrompt.systemPrompt,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'An error occurred';
          setError(message);
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100);
      setIsRecording(true);
    } catch (err) {
      setIsRecording(false);
      const message = err instanceof Error ? err.message : 'Failed to access microphone';
      setError(message);
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

  const handleRecordToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  if (view === 'edit') {
    return (
      <div className="flex flex-col h-full bg-surface-50 dark:bg-surface-900">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200 dark:border-surface-800">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
              disabled={isRecording || isProcessing}
            >
              <BackIcon size={18} className="text-surface-400" />
            </button>
            <span className="text-base font-medium text-surface-800 dark:text-surface-100">
              {editingPrompt.id ? 'Edit Prompt' : 'New Prompt'}
            </span>
          </div>
          <button
            onClick={handleSave}
            disabled={!editingPrompt.name.trim() || !editingPrompt.systemPrompt.trim() || isRecording || isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-500 hover:bg-accent-600 disabled:bg-surface-300 dark:disabled:bg-surface-700 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
          >
            <CheckIcon size={14} />
            Save
          </button>
        </div>

        {/* Edit Form */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Voice Record Button */}
          {!editingPrompt.id && (
            <div className="flex flex-col items-center py-4 border-b border-surface-200 dark:border-surface-700 mb-2">
              <button
                onClick={handleRecordToggle}
                disabled={isProcessing}
                className={`
                  w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200
                  ${isRecording
                    ? 'bg-error text-white animate-pulse'
                    : isProcessing
                      ? 'bg-surface-200 dark:bg-surface-700 text-surface-400 cursor-not-allowed'
                      : 'bg-accent-500 hover:bg-accent-600 text-white hover:scale-105'
                  }
                `}
              >
                {isProcessing ? (
                  <SpinnerIcon size={28} className="animate-spin" />
                ) : isRecording ? (
                  <StopIcon size={28} />
                ) : (
                  <MicrophoneIcon size={28} />
                )}
              </button>
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-3 text-center">
                {isProcessing
                  ? 'Generating prompt...'
                  : isRecording
                    ? 'Recording... Click to stop'
                    : 'Describe your prompt with voice'
                }
              </p>
              <p className="text-[10px] text-surface-400 dark:text-surface-500 mt-1 text-center max-w-[200px]">
                {!isRecording && !isProcessing && 'Tell me what kind of prompt you want to create'}
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-error/10 border border-error/30 rounded-lg p-3 text-sm text-error-dark dark:text-error-light">
              {error}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                Name
              </label>
              {editingPrompt.name && (
                <button
                  onClick={() => copyToClipboard(editingPrompt.name, 'name')}
                  className="flex items-center gap-1 text-xs text-surface-400 hover:text-accent-500 transition-colors"
                  disabled={isRecording || isProcessing}
                >
                  <CopyIcon size={12} />
                  {copiedField === 'name' ? 'Copied!' : 'Copy'}
                </button>
              )}
            </div>
            <input
              type="text"
              value={editingPrompt.name}
              onChange={(e) => setEditingPrompt({ ...editingPrompt, name: e.target.value })}
              placeholder="My Custom Prompt"
              disabled={isRecording || isProcessing}
              className="w-full px-3 py-2 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-sm text-surface-800 dark:text-surface-100 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500 disabled:opacity-50"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                Description
              </label>
              {editingPrompt.description && (
                <button
                  onClick={() => copyToClipboard(editingPrompt.description, 'description')}
                  className="flex items-center gap-1 text-xs text-surface-400 hover:text-accent-500 transition-colors"
                  disabled={isRecording || isProcessing}
                >
                  <CopyIcon size={12} />
                  {copiedField === 'description' ? 'Copied!' : 'Copy'}
                </button>
              )}
            </div>
            <input
              type="text"
              value={editingPrompt.description}
              onChange={(e) => setEditingPrompt({ ...editingPrompt, description: e.target.value })}
              placeholder="What does this prompt do?"
              disabled={isRecording || isProcessing}
              className="w-full px-3 py-2 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-sm text-surface-800 dark:text-surface-100 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500 disabled:opacity-50"
            />
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                System Prompt
              </label>
              {editingPrompt.systemPrompt && (
                <button
                  onClick={() => copyToClipboard(editingPrompt.systemPrompt, 'systemPrompt')}
                  className="flex items-center gap-1 text-xs text-surface-400 hover:text-accent-500 transition-colors"
                  disabled={isRecording || isProcessing}
                >
                  <CopyIcon size={12} />
                  {copiedField === 'systemPrompt' ? 'Copied!' : 'Copy'}
                </button>
              )}
            </div>
            <textarea
              value={editingPrompt.systemPrompt}
              onChange={(e) => setEditingPrompt({ ...editingPrompt, systemPrompt: e.target.value })}
              placeholder="Enter your system prompt here...

You can use {sourceLang} as a placeholder for the source language."
              rows={10}
              disabled={isRecording || isProcessing}
              className="w-full px-3 py-2 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-sm text-surface-800 dark:text-surface-100 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500 resize-none font-mono disabled:opacity-50"
            />
            <p className="text-[10px] text-surface-400 dark:text-surface-500 mt-1.5">
              Use <code className="bg-surface-100 dark:bg-surface-800 px-1 rounded">{'{sourceLang}'}</code> to insert the source language
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-surface-50 dark:bg-surface-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200 dark:border-surface-800">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
          >
            <BackIcon size={18} className="text-surface-400" />
          </button>
          <FileTextIcon size={20} className="text-surface-600 dark:text-surface-300" />
          <span className="text-base font-medium text-surface-800 dark:text-surface-100">
            My Prompts
          </span>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-500 hover:bg-accent-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <PlusIcon size={14} />
          New
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {customPrompts.length === 0 ? (
          <div className="text-center py-8 text-surface-400 dark:text-surface-500">
            <FileTextIcon size={32} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium">No custom prompts yet</p>
            <p className="text-xs mt-1 opacity-75">
              Create prompts with your voice
            </p>
            <button
              onClick={handleCreateNew}
              className="mt-4 flex items-center gap-2 mx-auto px-4 py-2.5 bg-accent-500 hover:bg-accent-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <MicrophoneIcon size={16} />
              Create with voice
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {customPrompts.map((prompt) => (
              <button
                key={prompt.id}
                onClick={() => handleEdit(prompt)}
                className="w-full text-left bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg p-3 group hover:bg-surface-50 dark:hover:bg-surface-750 hover:border-surface-300 dark:hover:border-surface-600 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-surface-800 dark:text-surface-100 truncate">
                      {prompt.name}
                    </h4>
                    {prompt.description && (
                      <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5 truncate">
                        {prompt.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(prompt.systemPrompt, `prompt-${prompt.id}`);
                      }}
                      className="p-1.5 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-md transition-colors text-surface-400 hover:text-accent-500"
                      title={copiedField === `prompt-${prompt.id}` ? 'Copied!' : 'Copy prompt'}
                    >
                      <CopyIcon size={14} />
                    </span>
                    <span
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(prompt.id);
                      }}
                      className={`p-1.5 rounded-md transition-colors ${
                        deleteConfirm === prompt.id
                          ? 'bg-error/10 text-error'
                          : 'hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-400 hover:text-error'
                      }`}
                      title={deleteConfirm === prompt.id ? 'Click again to confirm' : 'Delete'}
                    >
                      <TrashIcon size={14} />
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-surface-300 dark:text-surface-600 mt-2 font-mono truncate">
                  {prompt.systemPrompt.substring(0, 80)}...
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
