// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import { getElement } from './data/elements';
import type { ElementFraction } from './types';

/** Вычисления по контракту SPEC.md 6.2. */

export function countElements(symbols: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const symbol of symbols) {
    counts.set(symbol, (counts.get(symbol) ?? 0) + 1);
  }
  return counts;
}

/**
 * Формула по системе Хилла (FR-6): если есть углерод — C, затем H,
 * затем остальные по алфавиту; без углерода — все элементы по алфавиту.
 * Единичные индексы опускаются.
 */
export function hillFormula(counts: Map<string, number>): string {
  const symbols = [...counts.keys()];
  const ordered: string[] = [];
  if (counts.has('C')) {
    ordered.push('C');
    if (counts.has('H')) ordered.push('H');
    ordered.push(...symbols.filter((s) => s !== 'C' && s !== 'H').sort());
  } else {
    ordered.push(...symbols.sort());
  }
  return ordered
    .map((symbol) => {
      const n = counts.get(symbol)!;
      return n === 1 ? symbol : `${symbol}${n}`;
    })
    .join('');
}

/** Молярная масса: Σ(atomicMass_i × count_i), г/моль. */
export function molarMass(counts: Map<string, number>): number {
  let total = 0;
  for (const [symbol, count] of counts) {
    total += getElement(symbol).atomicMass * count;
  }
  return total;
}

/** Массовые доли: atomicMass_i·count_i / molarMass × 100 %. */
export function massFractions(counts: Map<string, number>): ElementFraction[] {
  const total = molarMass(counts);
  const fractions: ElementFraction[] = [];
  for (const [symbol, count] of counts) {
    const element = getElement(symbol);
    fractions.push({
      element: symbol,
      name: element.name,
      count,
      percent: (element.atomicMass * count * 100) / total,
    });
  }
  return fractions.sort((a, b) => a.element.localeCompare(b.element));
}
