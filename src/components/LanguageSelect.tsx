import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { SUPPORTED_LANGUAGES } from '../stores/appStore';
import { ChevronIcon, CheckIcon } from './icons';

interface LanguageSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export default function LanguageSelect({ value, onChange }: LanguageSelectProps) {
  const selectedLang = SUPPORTED_LANGUAGES.find((l) => l.code === value) || SUPPORTED_LANGUAGES[0];

  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative">
        <ListboxButton className="w-full px-3 py-2.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-sm text-left text-surface-800 dark:text-surface-200 focus:outline-none focus:ring-2 focus:ring-accent-400/50 focus:border-accent-400 cursor-pointer flex items-center justify-between">
          <span className="flex items-center gap-2">
            {selectedLang.code === 'auto' ? (
              <>
                <span className="text-base">🔮</span>
                <span>Auto-detect</span>
              </>
            ) : (
              <>
                <span className="text-surface-500 dark:text-surface-400">{selectedLang.nativeName}</span>
                <span className="text-surface-400 dark:text-surface-500">({selectedLang.name})</span>
              </>
            )}
          </span>
          <ChevronIcon size={12} className="text-surface-400" />
        </ListboxButton>

        <ListboxOptions
          anchor="bottom"
          className="w-[var(--button-width)] mt-1 max-h-60 overflow-auto rounded-lg bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 shadow-lg focus:outline-none z-50"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <ListboxOption
              key={lang.code}
              value={lang.code}
              className="group flex items-center gap-2 px-3 py-2 cursor-pointer select-none data-[focus]:bg-surface-100 dark:data-[focus]:bg-surface-700 data-[selected]:text-accent-600 dark:data-[selected]:text-accent-400"
            >
              <CheckIcon size={14} className="invisible group-data-[selected]:visible text-accent-500" />
              {lang.code === 'auto' ? (
                <span className="flex items-center gap-2 text-sm">
                  <span>🔮</span>
                  <span className="text-surface-800 dark:text-surface-200">Auto-detect</span>
                </span>
              ) : (
                <span className="flex items-center gap-2 text-sm">
                  <span className="text-surface-800 dark:text-surface-200">{lang.nativeName}</span>
                  <span className="text-surface-400 dark:text-surface-500">({lang.name})</span>
                </span>
              )}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  );
}
