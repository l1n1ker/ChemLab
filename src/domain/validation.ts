// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import { getElement } from './data/elements';
import type { AtomInstance, Bond, BondKind, BondOrder } from './types';

/**
 * Валидация связей DR-1…5 (SPEC.md 6.3, ревизия v0.6).
 * Возвращает типизированный результат; текст сообщения строит UI по i18n.
 */

export type BondRejectionCode =
  | 'same-atom'
  | 'order-overflow'
  | 'valence-exceeded'
  | 'monovalent'
  | 'bond-kind-mismatch'
  | 'ionic-exists';

export interface BondRejection {
  code: BondRejectionCode;
  element?: string;
  /** Занятая валентность до гипотетической связи. */
  used?: number;
  /** Допустимая валентность. */
  max?: number;
}

export type BondCheck =
  | { ok: true; existingBond: Bond | null }
  | { ok: false; rejection: BondRejection };

/** Сумма, занятая связями атома: ковалентная — кратность, ионная — 1 (DR-4). */
export function usedValence(
  atomId: string,
  bonds: Record<string, Bond>,
  excludeBondId?: string,
): number {
  let used = 0;
  for (const bond of Object.values(bonds)) {
    if (bond.id === excludeBondId) continue;
    if (bond.atomIds.includes(atomId)) {
      used += bond.kind === 'ionic' ? 1 : bond.order;
    }
  }
  return used;
}

/**
 * DR-2: текущая валентность элемента — минимальная из списка,
 * покрывающая занятое; сверх списка — максимальная.
 */
export function currentValence(elementSymbol: string, used: number): number {
  const { valences } = getElement(elementSymbol);
  for (const v of [...valences].sort((a, b) => a - b)) {
    if (v >= used) return v;
  }
  return Math.max(...valences);
}

/** Свободная валентность атома для отображения (FR-3). */
export function freeValence(atom: AtomInstance, bonds: Record<string, Bond>): number {
  const used = usedValence(atom.id, bonds);
  return currentValence(atom.element, used) - used;
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
 * — DR-3: повторная ковалентная связь той же пары повышает кратность;
 * — DR-4: ионная связь не дублируется и не смешивается с ковалентной на той же паре;
 * — DR-1/DR-2: суммарная занятость не превышает максимальную валентность
 *   (переход на старшую валентность из списка — автоматически, v0.6).
 */
export function checkBond(
  atoms: Record<string, AtomInstance>,
  bonds: Record<string, Bond>,
  aId: string,
  bId: string,
  order: BondOrder,
  kind: BondKind = 'covalent',
): BondCheck {
  if (aId === bId) {
    return { ok: false, rejection: { code: 'same-atom' } };
  }

  const existing = findBondBetween(bonds, aId, bId);
  if (existing && existing.kind !== kind) {
    return { ok: false, rejection: { code: 'bond-kind-mismatch' } };
  }

  let effectiveOrder: number;
  if (kind === 'ionic') {
    if (existing) {
      return { ok: false, rejection: { code: 'ionic-exists' } };
    }
    effectiveOrder = 1;
  } else {
    effectiveOrder = (existing?.order ?? 0) + order;
    if (effectiveOrder > 3) {
      return {
        ok: false,
        rejection: { code: 'order-overflow', used: existing?.order ?? 0, max: 3 },
      };
    }
  }

  for (const atomId of [aId, bId]) {
    const atom = atoms[atomId];
    const element = getElement(atom.element);
    const max = Math.max(...element.valences);
    const current = usedValence(atomId, bonds, existing?.id);
    if (current + effectiveOrder > max) {
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
