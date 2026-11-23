// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import { SUBSTANCES } from './data/substances';
import type { Substance } from './types';

/**
 * Толерантный разбор формулы (FR-32; парсер конструктора FR-25, v0.20).
 * H2O, H₂O, OH2 — одинаково; регистр букв строгий (символы элементов).
 * Поддерживаются скобки с множителем: Ca(OH)2.
 */

const SUBSCRIPTS: Record<string, string> = {
  '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
  '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
};

/** Строка → карта «элемент → количество»; null, если не формула. */
export function parseFormulaLoose(raw: string): Map<string, number> | null {
  const normalized = raw.trim().replace(/[₀-₉]/g, (c) => SUBSCRIPTS[c]);
  if (normalized === '') return null;

  let i = 0;

  function readCount(): number {
    let digits = '';
    while (i < normalized.length && /\d/.test(normalized[i])) digits += normalized[i++];
    return digits === '' ? 1 : Number(digits);
  }

  function merge(target: Map<string, number>, source: Map<string, number>, mult: number): void {
    for (const [symbol, n] of source) {
      target.set(symbol, (target.get(symbol) ?? 0) + n * mult);
    }
  }

  function parseGroup(closing: ')' | null): Map<string, number> | null {
    const counts = new Map<string, number>();
    while (i < normalized.length) {
      const ch = normalized[i];
      if (ch === ')') {
        if (closing === null) return null;
        i++;
        return counts;
      }
      if (ch === '(') {
        i++;
        const inner = parseGroup(')');
        if (inner === null) return null;
        merge(counts, inner, readCount());
      } else if (/[A-Z]/.test(ch)) {
        let symbol = ch;
        i++;
        if (i < normalized.length && /[a-z]/.test(normalized[i])) {
          symbol += normalized[i++];
        }
        counts.set(symbol, (counts.get(symbol) ?? 0) + readCount());
      } else {
        return null;
      }
    }
    return closing === null && counts.size > 0 ? counts : null;
  }

  const result = parseGroup(null);
  return result !== null && i === normalized.length ? result : null;
}

/** Канонический ключ состава: элементы по алфавиту с количествами («H2O» → «H2O1»). */
export function canonicalFormulaKey(raw: string): string | null {
  const counts = parseFormulaLoose(raw);
  if (!counts) return null;
  return [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([symbol, n]) => `${symbol}${n}`)
    .join('');
}

/** Совпадение запроса с названием или формулой вещества (FR-32). */
export function matchesSubstanceQuery(
  query: string,
  substance: { name: string; formula: string },
): boolean {
  const q = query.trim();
  if (q === '') return true;
  if (substance.name.toLowerCase().includes(q.toLowerCase())) return true;
  const key = canonicalFormulaKey(q);
  const substanceKey = canonicalFormulaKey(substance.formula);
  return key !== null && key === substanceKey;
}

/** Результат конструктора по формуле (FR-25). */
export type LookupResult =
  | { status: 'unique'; substance: Substance }
  | { status: 'isomers'; substances: Substance[] }
  | { status: 'notFound' };

/**
 * FR-25: поиск вещества по формуле (толерантно) или точному названию.
 * Несколько совпадений = изомеры (DR-6): выбор за пользователем.
 */
export function lookupSubstances(query: string, catalog: Substance[] = SUBSTANCES): LookupResult {
  const q = query.trim();
  if (q === '') return { status: 'notFound' };
  const key = canonicalFormulaKey(q);
  const matches = catalog.filter((substance) => {
    if (substance.name.toLowerCase() === q.toLowerCase()) return true;
    const substanceKey = canonicalFormulaKey(substance.formula);
    return key !== null && substanceKey !== null && substanceKey === key;
  });
  if (matches.length === 0) return { status: 'notFound' };
  if (matches.length === 1) return { status: 'unique', substance: matches[0] };
  return { status: 'isomers', substances: matches };
}
