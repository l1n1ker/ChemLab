// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import type { PeriodicEntry } from '../domain/data/periodicTable';

/**
 * Школьная окраска групп (FR-28, v0.12): единая для таблицы магазина
 * и атомов на столе. CPK остаётся в 3D-инспекторе.
 */
export function elementColor(entry: PeriodicEntry): string {
  if (entry.fRow) return '#fbcfe8';
  if (entry.iupacGroup === 1 && entry.number > 1) return '#fecaca';
  if (entry.iupacGroup === 2) return '#fed7aa';
  if (entry.iupacGroup === 17) return '#bbf7d0';
  if (entry.iupacGroup === 18) return '#e9d5ff';
  if (entry.category === 'metalloid') return '#fde68a';
  if (entry.category === 'nonmetal') return '#a7f3d0';
  return '#bfdbfe';
}
