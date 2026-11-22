// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

/** Химическая формула с нижними индексами: H2O → H₂O. */
export function Formula({ formula }: { formula: string }) {
  const parts = formula.match(/[A-Z][a-z]?|\d+/g) ?? [];
  return (
    <>
      {parts.map((part, i) =>
        /^\d+$/.test(part) ? <sub key={i}>{part}</sub> : <span key={i}>{part}</span>,
      )}
    </>
  );
}

/** Школьный формат числа: десятичный разделитель — запятая. */
export function fmt(n: number, digits: number): string {
  return n.toFixed(digits).replace('.', ',');
}

/** Степень окисления со знаком: +1, −2, 0. */
export function formatOxidation(value: number): string {
  if (value > 0) return `+${value}`;
  if (value < 0) return `−${Math.abs(value)}`;
  return '0';
}
