// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import { SUBSTANCES } from './data/substances';
import type { AtomInstance, Bond, Substance } from './types';

/**
 * DR-6: идентификатор вещества — структура (граф атомов и связей), не формула.
 * Сопоставление с каталогом — изоморфизм графов с метками элементов
 * и кратностями связей. Графы M0 малы (≤ 5 атомов), поэтому
 * используется точный перебор с отсечениями.
 */

export interface CatalogMatch {
  substance: Substance;
  /** Отображение: id атома молекулы → индекс атома в эталонной структуре. */
  mapping: Map<string, number>;
}

interface GraphView {
  elements: string[];
  bonds: Map<string, number>;
}

function bondKey(i: number, j: number): string {
  return i < j ? `${i}:${j}` : `${j}:${i}`;
}

function toGraph(atoms: { element: string }[], pairs: [number, number, number][]): GraphView {
  const bonds = new Map<string, number>();
  for (const [i, j, order] of pairs) bonds.set(bondKey(i, j), order);
  return { elements: atoms.map((a) => a.element), bonds };
}

function findIsomorphism(mol: GraphView, ref: GraphView): number[] | null {
  const n = mol.elements.length;
  if (n !== ref.elements.length || mol.bonds.size !== ref.bonds.size) return null;

  const assignment = new Array<number>(n).fill(-1);
  const usedRef = new Array<boolean>(n).fill(false);

  function consistent(molIdx: number, refIdx: number): boolean {
    for (let m = 0; m < n; m++) {
      if (assignment[m] === -1) continue;
      const molOrder = mol.bonds.get(bondKey(molIdx, m)) ?? 0;
      const refOrder = ref.bonds.get(bondKey(refIdx, assignment[m])) ?? 0;
      if (molOrder !== refOrder) return false;
    }
    return true;
  }

  function search(molIdx: number): number[] | null {
    if (molIdx === n) return [...assignment];
    for (let refIdx = 0; refIdx < n; refIdx++) {
      if (usedRef[refIdx]) continue;
      if (mol.elements[molIdx] !== ref.elements[refIdx]) continue;
      assignment[molIdx] = refIdx;
      usedRef[refIdx] = true;
      if (consistent(molIdx, refIdx)) {
        const result = search(molIdx + 1);
        if (result) return result;
      }
      assignment[molIdx] = -1;
      usedRef[refIdx] = false;
    }
    return null;
  }

  return search(0);
}

/**
 * Ищет вещество каталога, структурно совпадающее с молекулой.
 * null — соединение неизвестно каталогу (FR-6: ярлык «гипотетическое соединение»).
 */
export function findCatalogMatch(
  atoms: AtomInstance[],
  bonds: Bond[],
): CatalogMatch | null {
  const indexOf = new Map(atoms.map((atom, i) => [atom.id, i]));
  const molPairs: [number, number, number][] = [];
  for (const bond of bonds) {
    const i = indexOf.get(bond.atomIds[0]);
    const j = indexOf.get(bond.atomIds[1]);
    if (i === undefined || j === undefined) return null;
    molPairs.push([i, j, bond.order]);
  }
  const mol = toGraph(atoms, molPairs);

  for (const substance of SUBSTANCES) {
    const refPairs: [number, number, number][] = substance.structure.bonds.map((b) => [
      b.atoms[0],
      b.atoms[1],
      b.order,
    ]);
    const ref = toGraph(substance.structure.atoms, refPairs);
    const perm = findIsomorphism(mol, ref);
    if (perm) {
      const mapping = new Map<string, number>();
      atoms.forEach((atom, i) => mapping.set(atom.id, perm[i]));
      return { substance, mapping };
    }
  }
  return null;
}
