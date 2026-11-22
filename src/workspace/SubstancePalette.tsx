// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import { SUBSTANCES } from '../domain/data/substances';
import { Formula } from '../graph/format';
import { t } from '../i18n/ru';

/**
 * FR-2: магазин готовых веществ — целая молекула на стол
 * для тех, кто не хочет собирать с нуля.
 */

interface SubstancePaletteProps {
  onTake: (substanceId: string) => void;
  onDragStart: (substanceId: string, e: React.PointerEvent) => void;
}

export function SubstancePalette({ onTake, onDragStart }: SubstancePaletteProps) {
  return (
    <section aria-label={t('palette.substances')} className="flex flex-col gap-3 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
        {t('palette.substances')}
      </h2>
      <div className="flex flex-col gap-1.5">
        {SUBSTANCES.map((substance) => (
          <button
            key={substance.id}
            type="button"
            className="flex items-baseline justify-between gap-2 rounded-lg bg-slate-800 px-3 py-1.5 text-left hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-sky-400"
            onPointerDown={(e) => onDragStart(substance.id, e)}
            onClick={() => onTake(substance.id)}
          >
            <span className="text-sm text-slate-200">{substance.name}</span>
            <span className="text-sm text-slate-400">
              <Formula formula={substance.formula} />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
