// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import { useEffect } from 'react';
import type { LabState } from '../domain/labStore';
import type { MoleculeView } from '../domain/types';
import { t } from '../i18n/ru';
import { Inspector3D } from '../inspector3d/Inspector3D';
import { PropertiesPanel } from './PropertiesPanel';

/**
 * FR-34: модалка «Просмотр результата» — полное описание (FR-6),
 * конвертер (FR-8) и интерактивная 3D-модель (FR-9…11) в одном окне.
 * Read-only (P3): редактирование связей — только на 2D-столе.
 */

interface ResultModalProps {
  molecule: MoleculeView | null;
  state: LabState;
  onClose: () => void;
  onDismantle: (moleculeId: string) => void;
}

export function ResultModal({ molecule, state, onClose, onDismantle }: ResultModalProps) {
  useEffect(() => {
    if (!molecule) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [molecule, onClose]);

  if (!molecule) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label={t('result.title')}
        className="flex max-h-[90vh] w-[min(900px,95vw)] flex-col rounded-xl bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-700 px-4 py-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
            {t('result.title')}
          </h2>
          <button
            type="button"
            aria-label={t('result.close')}
            className="rounded-md bg-slate-800 px-3 py-1 text-sm text-slate-300 hover:bg-slate-700"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-2 overflow-hidden">
          <div className="min-h-0 overflow-y-auto border-r border-slate-800">
            <PropertiesPanel molecule={molecule} />
          </div>
          <div className="min-h-0">
            <Inspector3D molecule={molecule} state={state} />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-700 px-4 py-2">
          {molecule.bondIds.length > 0 && (
            <button
              type="button"
              className="rounded-md bg-amber-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-600"
              onClick={() => onDismantle(molecule.id)}
            >
              {t('result.dismantle')}
            </button>
          )}
          <button
            type="button"
            className="rounded-md bg-slate-800 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-700"
            onClick={onClose}
          >
            {t('result.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
