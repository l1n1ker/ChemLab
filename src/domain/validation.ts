// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import { getElement } from './data/elements';
import type { AtomInstance, Bond, BondOrder } from './types';

/**
 * Валидация связей DR-1…5 (SPEC.md 6.3).
 * Возвращает типизированный результат; текст сообщения строит UI по i18n.
 */

export type BondRejectionCode =
  | 'same-atom'
  | 'order-overflow'
  | 'valence-exceeded'
  | 'monovalent';

export interface BondRejection {
  code: BondRejectionCode;
  element?: string;
  /** Занятая валентность после гипотетической связи. */
  used?: number;
  /** Допустимая валентность. */
  max?: number;
}

export type BondCheck =
  | { ok: true; existingBond: Bond | null }
  | { ok: false; rejection: BondRejection };

/** Сумма кратностей связей атома (без учёта одной связи, если excludeBondId задан). */
export function usedValence(
  atomId: string,
  bonds: Record<string, Bond>,
  excludeBondId?: string,
): number {
  let used = 0;
  for (const bond of Object.values(bonds)) {
    if (bond.id === excludeBondId) continue;
    if (bond.atomIds.includes(atomId)) used += bond.order;
  }
  return used;
}

/** Свободная валентность атома для отображения (FR-3). */
export function freeValence(atom: AtomInstance, bonds: Record<string, Bond>): number {
  const element = getElement(atom.element);
  return Math.max(0, Math.max(...element.valences) - usedValence(atom.id, bonds));
}

export function findBondBetween(
  bonds: Record<string, Bond>,
  aId: string,
  bId: string,
): Bond | null {
  for (const bond of Object.values(bonds)) {
    const [x, y] = bond.atomIds;
    if ((x === aId && y === bId) || (x === bId && y === aId)) return bond;
  }
  return null;
}

/**
 * Проверка создания связи (FR-5):
 * — DR-3: повторная связь между той же парой не дублируется, а повышает кратность;
 *   проверяется суммарная кратность.
 * — DR-1: сумма кратностей связей атома не превышает его валентность.
 * — DR-2: текущая валентность элемента — минимальная покрывающая из списка;
 *   в M0 все элементы одновалентны по списку (H[1], O[2], C[4]), поэтому берётся max.
 */
export function checkBond(
  atoms: Record<string, AtomInstance>,
  bonds: Record<string, Bond>,
  aId: string,
  bId: string,
  order: BondOrder,
): BondCheck {
  if (aId === bId) {
    return { ok: false, rejection: { code: 'same-atom' } };
  }

  const existing = findBondBetween(bonds, aId, bId);
  const newOrder = (existing?.order ?? 0) + order;
  if (newOrder > 3) {
    return {
      ok: false,
      rejection: { code: 'order-overflow', used: newOrder, max: 3 },
    };
  }

  for (const atomId of [aId, bId]) {
    const atom = atoms[atomId];
    const element = getElement(atom.element);
    const max = Math.max(...element.valences);
    const current = usedValence(atomId, bonds, existing?.id);
    if (current + newOrder > max) {
      const singleValence = element.valences.length === 1;
      return {
        ok: false,
        rejection: {
          code: singleValence ? 'monovalent' : 'valence-exceeded',
          element: atom.element,
          used: current,
          max,
        },
      };
    }
  }

  return { ok: true, existingBond: existing };
}
