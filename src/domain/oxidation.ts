// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import { getElement } from './data/elements';
import type { AtomInstance, Bond } from './types';

/**
 * Степени окисления (FR-6, v0.6; контракт SPEC.md 6.2):
 * электроны каждой связи отдаются более электроотрицательному атому;
 * ионная связь — полный переход (тот же знак по электроотрицательности);
 * связь между атомами одного элемента вклада не даёт.
 *
 * Школьная модель: ковалентная связь порядка k даёт ±k, ионная — ±1 (DR-4).
 * Результат для каталожных веществ совпадает со справочным (H₂O: H +1, O −2;
 * CO₂: C +4; NaCl: Na +1, Cl −1; Fe₂O₃: Fe +3).
 */
export function oxidationStates(
  atoms: AtomInstance[],
  bonds: Bond[],
): Map<string, number> {
  const byId = new Map(atoms.map((a) => [a.id, a]));
  const states = new Map<string, number>(atoms.map((a) => [a.id, 0]));

  for (const bond of bonds) {
    const a = byId.get(bond.atomIds[0]);
    const b = byId.get(bond.atomIds[1]);
    if (!a || !b) continue;
    const weight = bond.kind === 'ionic' ? 1 : bond.order;
    const enA = getElement(a.element).electronegativity;
    const enB = getElement(b.element).electronegativity;
    if (enA === enB) continue;
    const [winner, loser] = enA > enB ? [a.id, b.id] : [b.id, a.id];
    states.set(winner, states.get(winner)! - weight);
    states.set(loser, states.get(loser)! + weight);
  }

  return states;
}

/** Степени окисления по элементам; значения разных атомов одного элемента перечисляются. */
export function oxidationStatesByElement(
  atoms: AtomInstance[],
  bonds: Bond[],
): Map<string, number[]> {
  const states = oxidationStates(atoms, bonds);
  const byElement = new Map<string, number[]>();
  for (const atom of atoms) {
    const value = states.get(atom.id)!;
    const list = byElement.get(atom.element) ?? [];
    if (!list.includes(value)) list.push(value);
    byElement.set(atom.element, list);
  }
  return byElement;
}
