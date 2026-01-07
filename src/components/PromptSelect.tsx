import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { PROMPT_TEMPLATES } from '../prompts';

interface PromptSelectProps {
  value: string;
  onChange: (value: string) => void;
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function PromptIcon({ icon, className }: { icon?: string; className?: string }) {
  if (!icon) return null;

  // Check if icon is a URL (starts with http)
  if (icon.startsWith('http')) {
    return <img src={icon} alt="" className={`${className} object-contain rounded`} />;
  }

  // Otherwise it's an emoji
  return <span className={className}>{icon}</span>;
}

export default function PromptSelect({ value, onChange }: PromptSelectProps) {
  const selectedPrompt = PROMPT_TEMPLATES.find((p) => p.id === value) || PROMPT_TEMPLATES[0];

  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative">
        <ListboxButton className="w-full px-3 py-2.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-sm text-left text-surface-800 dark:text-surface-200 focus:outline-none focus:ring-2 focus:ring-accent-400/50 focus:border-accent-400 cursor-pointer flex items-center justify-between">
          <span className="flex items-center gap-2.5">
            <PromptIcon icon={selectedPrompt.icon} className="w-5 h-5 flex-shrink-0 text-lg" />
            <span className="flex flex-col items-start gap-0.5">
              <span className="font-medium">{selectedPrompt.name}</span>
              <span className="text-xs text-surface-400 dark:text-surface-500 line-clamp-1">
                {selectedPrompt.description}
              </span>
            </span>
          </span>
          <ChevronIcon className="text-surface-400 flex-shrink-0 ml-2" />
        </ListboxButton>

        <ListboxOptions
          anchor="bottom"
          className="w-[var(--button-width)] mt-1 max-h-72 overflow-auto rounded-lg bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 shadow-lg focus:outline-none z-50"
        >
          {PROMPT_TEMPLATES.map((prompt) => (
            <ListboxOption
              key={prompt.id}
              value={prompt.id}
              className="group flex items-start gap-2 px-3 py-2.5 cursor-pointer select-none data-[focus]:bg-surface-100 dark:data-[focus]:bg-surface-700 data-[selected]:text-accent-600 dark:data-[selected]:text-accent-400"
            >
              <CheckIcon className="invisible group-data-[selected]:visible text-accent-500 mt-0.5 flex-shrink-0" />
              <PromptIcon icon={prompt.icon} className="w-5 h-5 flex-shrink-0 text-lg mt-0.5" />
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-sm font-medium text-surface-800 dark:text-surface-200 group-data-[selected]:text-accent-600 dark:group-data-[selected]:text-accent-400">
                  {prompt.name}
                </span>
                <span className="text-xs text-surface-400 dark:text-surface-500 line-clamp-2">
                  {prompt.description}
                </span>
                {prompt.author && (
                  <span className="text-xs text-surface-300 dark:text-surface-600">
                    by {prompt.author}
                  </span>
                )}
              </div>
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  );
}
