// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import type { AtomInstance, Bond } from './types';

export interface MoleculeComponent {
  /** Стабильный id: минимальный id атома компоненты. */
  id: string;
  atomIds: string[];
  bondIds: string[];
}

/**
 * Molecule как связный компонент графа AtomInstance+Bond (SPEC.md 6.1).
 * Обход в ширину от каждого непосещённого атома.
 */
export function connectedComponents(
  atoms: Record<string, AtomInstance>,
  bonds: Record<string, Bond>,
): MoleculeComponent[] {
  const adjacency = new Map<string, { atomId: string; bondId: string }[]>();
  for (const id of Object.keys(atoms)) adjacency.set(id, []);
  for (const bond of Object.values(bonds)) {
    const [a, b] = bond.atomIds;
    adjacency.get(a)?.push({ atomId: b, bondId: bond.id });
    adjacency.get(b)?.push({ atomId: a, bondId: bond.id });
  }

  const visited = new Set<string>();
  const components: MoleculeComponent[] = [];
  for (const startId of Object.keys(atoms)) {
    if (visited.has(startId)) continue;
    const atomIds: string[] = [];
    const bondIds = new Set<string>();
    const queue = [startId];
    visited.add(startId);
    while (queue.length > 0) {
      const id = queue.shift()!;
      atomIds.push(id);
      for (const edge of adjacency.get(id) ?? []) {
        bondIds.add(edge.bondId);
        if (!visited.has(edge.atomId)) {
          visited.add(edge.atomId);
          queue.push(edge.atomId);
        }
      }
    }
    atomIds.sort();
    components.push({ id: atomIds[0], atomIds, bondIds: [...bondIds] });
  }
  return components;
}
