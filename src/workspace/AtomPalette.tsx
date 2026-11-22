// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import { ELEMENTS } from '../domain/data/elements';
import { t } from '../i18n/ru';

/**
 * FR-1: магазин атомов. Взятие атома = добавление экземпляра на стол,
 * магазин неисчерпаем. Drag-out указателем + клик/Enter для a11y (NFR-6).
 */

interface AtomPaletteProps {
  onTake: (element: string) => void;
  onDragStart: (element: string, e: React.PointerEvent) => void;
}

export function AtomPalette({ onTake, onDragStart }: AtomPaletteProps) {
  return (
    <section aria-label={t('palette.title')} className="flex flex-col gap-3 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
        {t('palette.title')}
      </h2>
      <div className="flex flex-col gap-2">
        {Object.values(ELEMENTS).map((element) => (
          <button
            key={element.symbol}
            type="button"
            className="flex items-center gap-3 rounded-lg bg-slate-800 px-3 py-2 text-left hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-sky-400"
            onPointerDown={(e) => onDragStart(element.symbol, e)}
            onClick={() => onTake(element.symbol)}
          >
            <span
              aria-hidden
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-500 font-bold text-slate-900"
              style={{ backgroundColor: element.cpkColor }}
            >
              {element.symbol}
            </span>
            <span className="text-sm text-slate-200">
              {element.name}
              <span className="block text-xs text-slate-400">
                {element.symbol} · v = {element.valences.join('/')}
              </span>
            </span>
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-500">{t('palette.hint')}</p>
    </section>
  );
}
