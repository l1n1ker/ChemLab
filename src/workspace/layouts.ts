// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import { PERIODIC_TABLE } from '../domain/data/periodicTable';
import type { I18nKey } from '../i18n/ru';

/**
 * FR-30: варианты отображения периодической таблицы.
 * Раскладка — декларативный дескриптор (данные, не код): подписи колонок
 * и позиции элементов. Новые раскладки (Жане и др., v2+) добавляются
 * как новые дескрипторы без изменения контролов.
 */

export interface TableLayout {
  id: 'mendeleev' | 'iupac';
  nameKey: I18nKey;
  /** Подписи 18 колонок. */
  columnLabels: string[];
  /** Номер элемента → [колонка 1–18, строка 1–9]. Строки 8–9 — f-блок. */
  positions: Record<number, [number, number]>;
}

function buildPositions(): Record<number, [number, number]> {
  const positions: Record<number, [number, number]> = {};
  for (const entry of PERIODIC_TABLE) {
    if (entry.fRow === 'lanthanides') {
      positions[entry.number] = [3 + (entry.number - 57), 8];
    } else if (entry.fRow === 'actinides') {
      positions[entry.number] = [3 + (entry.number - 89), 9];
    } else {
      positions[entry.number] = [entry.iupacGroup!, entry.period];
    }
  }
  return positions;
}

const POSITIONS = buildPositions();

/** Школьная длиннопериодная форма: подгруппы A/B, VIII занимает колонки 8–10. */
const MENDELEEV_LABELS = [
  'I A', 'II A', 'III B', 'IV B', 'V B', 'VI B', 'VII B',
  'VIII B', 'VIII B', 'VIII B',
  'I B', 'II B', 'III A', 'IV A', 'V A', 'VI A', 'VII A', 'VIII A',
];

const IUPAC_LABELS = Array.from({ length: 18 }, (_, i) => String(i + 1));

export const LAYOUTS: TableLayout[] = [
  { id: 'mendeleev', nameKey: 'shop.layout.mendeleev', columnLabels: MENDELEEV_LABELS, positions: POSITIONS },
  { id: 'iupac', nameKey: 'shop.layout.iupac', columnLabels: IUPAC_LABELS, positions: POSITIONS },
];

export function getLayout(id: string): TableLayout {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];
}

/** Подпись группы элемента в активной раскладке (FR-33: карточка атома). */
export function groupLabel(entryNumber: number, layout: TableLayout): string {
  const entry = PERIODIC_TABLE.find((e) => e.number === entryNumber);
  if (!entry) return '';
  if (entry.fRow) {
    return layout.id === 'mendeleev' ? 'III B' : '3';
  }
  return layout.columnLabels[entry.iupacGroup! - 1];
}
