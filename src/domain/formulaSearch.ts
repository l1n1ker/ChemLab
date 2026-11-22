// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Толерантный разбор формулы для поиска (FR-32; основа парсера FR-25 на M2).
 * H2O, H₂O, OH2 — одинаково; регистр букв строгий (символы элементов).
 */

const SUBSCRIPTS: Record<string, string> = {
  '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
  '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
};

/** Строка → карта «элемент → количество»; null, если не формула. */
export function parseFormulaLoose(raw: string): Map<string, number> | null {
  const normalized = raw.trim().replace(/[₀-₉]/g, (c) => SUBSCRIPTS[c]);
  if (!/^[A-Z][A-Za-z0-9]*$/.test(normalized)) return null;

  const counts = new Map<string, number>();
  const re = /([A-Z][a-z]?)(\d*)/g;
  let rest = normalized;
  let match: RegExpExecArray | null;
  while ((match = re.exec(normalized)) !== null) {
    const [, symbol, digits] = match;
    counts.set(symbol, (counts.get(symbol) ?? 0) + (digits === '' ? 1 : Number(digits)));
    rest = rest.slice(match[0].length);
  }
  return rest === '' && counts.size > 0 ? counts : null;
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
