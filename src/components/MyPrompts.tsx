import { useState } from 'react';
import { useAppStore, CustomPrompt } from '../stores/appStore';
import { BackIcon, FileTextIcon, PlusIcon, EditIcon, TrashIcon, CheckIcon } from './icons';

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
  const { customPrompts, addCustomPrompt, updateCustomPrompt, deleteCustomPrompt } = useAppStore();
  const [view, setView] = useState<View>('list');
  const [editingPrompt, setEditingPrompt] = useState<EditingPrompt>(emptyPrompt);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleCreateNew = () => {
    setEditingPrompt(emptyPrompt);
    setView('edit');
  };

  const handleEdit = (prompt: CustomPrompt) => {
    setEditingPrompt({
      id: prompt.id,
      name: prompt.name,
      description: prompt.description,
      systemPrompt: prompt.systemPrompt,
    });
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
            >
              <BackIcon size={18} className="text-surface-400" />
            </button>
            <span className="text-base font-medium text-surface-800 dark:text-surface-100">
              {editingPrompt.id ? 'Edit Prompt' : 'New Prompt'}
            </span>
          </div>
          <button
            onClick={handleSave}
            disabled={!editingPrompt.name.trim() || !editingPrompt.systemPrompt.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-500 hover:bg-accent-600 disabled:bg-surface-300 dark:disabled:bg-surface-700 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
          >
            <CheckIcon size={14} />
            Save
          </button>
        </div>

        {/* Edit Form */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1.5 uppercase tracking-wider">
              Name
            </label>
            <input
              type="text"
              value={editingPrompt.name}
              onChange={(e) => setEditingPrompt({ ...editingPrompt, name: e.target.value })}
              placeholder="My Custom Prompt"
              className="w-full px-3 py-2 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-sm text-surface-800 dark:text-surface-100 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1.5 uppercase tracking-wider">
              Description
            </label>
            <input
              type="text"
              value={editingPrompt.description}
              onChange={(e) => setEditingPrompt({ ...editingPrompt, description: e.target.value })}
              placeholder="What does this prompt do?"
              className="w-full px-3 py-2 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-sm text-surface-800 dark:text-surface-100 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500"
            />
          </div>

          <div className="flex-1">
            <label className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1.5 uppercase tracking-wider">
              System Prompt
            </label>
            <textarea
              value={editingPrompt.systemPrompt}
              onChange={(e) => setEditingPrompt({ ...editingPrompt, systemPrompt: e.target.value })}
              placeholder="Enter your system prompt here...

You can use {sourceLang} as a placeholder for the source language."
              rows={10}
              className="w-full px-3 py-2 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-sm text-surface-800 dark:text-surface-100 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500 resize-none font-mono"
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
          <div className="text-center py-12 text-surface-400 dark:text-surface-500">
            <FileTextIcon size={32} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium">No custom prompts yet</p>
            <p className="text-xs mt-1 opacity-75">
              Create your own prompt templates
            </p>
            <button
              onClick={handleCreateNew}
              className="mt-4 flex items-center gap-1.5 mx-auto px-4 py-2 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-lg text-sm text-surface-600 dark:text-surface-300 transition-colors"
            >
              <PlusIcon size={14} />
              Create your first prompt
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {customPrompts.map((prompt) => (
              <div
                key={prompt.id}
                className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg p-3 group"
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
                    <button
                      onClick={() => handleEdit(prompt)}
                      className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-md transition-colors text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
                      title="Edit"
                    >
                      <EditIcon size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(prompt.id)}
                      className={`p-1.5 rounded-md transition-colors ${
                        deleteConfirm === prompt.id
                          ? 'bg-error/10 text-error'
                          : 'hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-400 hover:text-error'
                      }`}
                      title={deleteConfirm === prompt.id ? 'Click again to confirm' : 'Delete'}
                    >
                      <TrashIcon size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-surface-300 dark:text-surface-600 mt-2 font-mono truncate">
                  {prompt.systemPrompt.substring(0, 80)}...
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
