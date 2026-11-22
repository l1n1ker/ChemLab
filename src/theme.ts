// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import { useEffect, useState } from 'react';

/**
 * FR-38: тема оформления — светлая/тёмная/системная.
 * Режим хранится в localStorage (NFR-3), класс `dark` — на <html>;
 * «Системная» следует за prefers-color-scheme и слушает его изменения.
 */

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'chemlab.theme';

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function readStoredTheme(): ThemeMode {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === 'light' || value === 'dark' || value === 'system') return value;
  } catch {
    // localStorage недоступен — работаем с дефолтом.
  }
  return 'system';
}

export function applyTheme(mode: ThemeMode): void {
  const dark = mode === 'dark' || (mode === 'system' && systemPrefersDark());
  document.documentElement.classList.toggle('dark', dark);
}

export function useTheme(): { mode: ThemeMode; setMode: (mode: ThemeMode) => void } {
  const [mode, setModeState] = useState<ThemeMode>(readStoredTheme);

  useEffect(() => {
    applyTheme(mode);
    if (mode !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [mode]);

  const setMode = (next: ThemeMode) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // игнорируем — тема просто не сохранится между сессиями
    }
    setModeState(next);
  };

  return { mode, setMode };
}
