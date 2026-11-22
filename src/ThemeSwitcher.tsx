// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import { t } from './i18n/ru';
import { useTheme, type ThemeMode } from './theme';

/** FR-38: переключатель темы — светлая / тёмная / системная. */
export function ThemeSwitcher() {
  const { mode, setMode } = useTheme();
  const options: { id: ThemeMode; label: string }[] = [
    { id: 'light', label: t('theme.light') },
    { id: 'dark', label: t('theme.dark') },
    { id: 'system', label: t('theme.system') },
  ];

  return (
    <div
      role="group"
      aria-label={t('theme.label')}
      className="flex overflow-hidden rounded-lg border border-slate-300 text-xs dark:border-slate-700"
    >
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={mode === option.id}
          onClick={() => setMode(option.id)}
          className={
            mode === option.id
              ? 'bg-emerald-600 px-3 py-1.5 font-semibold text-white'
              : 'bg-white px-3 py-1.5 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
          }
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
