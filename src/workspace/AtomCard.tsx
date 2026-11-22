// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import { ELEMENTS } from '../domain/data/elements';
import { getPeriodicEntry } from '../domain/data/periodicTable';
import { fmt } from '../graph/format';
import { t } from '../i18n/ru';
import { getLayout, groupLabel } from './layouts';

/**
 * FR-33: карточка атома (поповер). Содержимое едино для стола
 * и для иконки ℹ в магазине.
 */

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

interface AtomCardContentProps {
  symbol: string;
  /** Для атома на столе — свободные валентности (FR-3). */
  freeValence?: number;
  layoutId: string;
}

export function AtomCardContent({ symbol, freeValence, layoutId }: AtomCardContentProps) {
  const entry = getPeriodicEntry(symbol);
  const element = ELEMENTS[symbol];
  const layout = getLayout(layoutId);

  const rows: [string, string][] = [
    [t('atomcard.number'), String(entry.number)],
    [t('atomcard.mass'), element ? fmt(element.atomicMass, 3) : '—'],
    [t('atomcard.category'), entry.category ? t(`atomcard.category.${entry.category}`) : '—'],
    [t('atomcard.group'), groupLabel(entry.number, layout)],
    [t('atomcard.period'), String(entry.period)],
  ];
  if (element) {
    rows.push([
      t('atomcard.valences'),
      element.valences.map((v) => ROMAN[v - 1]).join(', '),
    ]);
  }
  if (entry.stateAtSTP) {
    rows.push([t('properties.stateAtSTP'), t(`properties.state.${entry.stateAtSTP}`)]);
  }
  if (freeValence !== undefined) {
    rows.push([t('atomcard.freeValence'), String(freeValence)]);
  }

  return (
    <div className="w-60 rounded-lg bg-white p-3 text-sm shadow-xl ring-1 ring-slate-300 dark:bg-slate-800 dark:ring-slate-600">
      <p className="mb-2 font-semibold text-slate-900 dark:text-slate-100">
        {entry.name} ({entry.symbol})
      </p>
      <dl className="space-y-1">
        {rows.map(([dt, dd]) => (
          <div key={dt} className="flex justify-between gap-2">
            <dt className="text-slate-500 dark:text-slate-400">{dt}</dt>
            <dd className="text-slate-900 dark:text-slate-100">{dd}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
