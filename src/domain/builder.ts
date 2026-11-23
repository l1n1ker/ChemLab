// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import { getSubstance } from './data/substances';
import type { AtomInstance, Bond, Vec2 } from './types';

/**
 * Построить молекулу из записи каталога — публичная функция Domain Core
 * (крюк SPEC.md раздел 9, v0.5): используется магазином готовых веществ (FR-2)
 * и конструктором по формуле (FR-25, M2).
 *
 * 2D-раскладка — древовидная (FR-2, v0.21): корень — атом с максимумом связей,
 * поддеревья разворачиваются веером в непересекающихся секторах, поэтому
 * ациклические структуры не имеют пересечений связей. Стол схематичен (P3):
 * справочную геометрию строит 3D-инспектор.
 */

const LAYOUT_STEP = 75;

/** Радиальная раскладка дерева: сектора поддеревьев пропорциональны числу листьев. */
function layoutTree(atomCount: number, bonds: { atoms: [number, number] }[]): Vec2[] {
  const adjacency: number[][] = Array.from({ length: atomCount }, () => []);
  for (const b of bonds) {
    adjacency[b.atoms[0]].push(b.atoms[1]);
    adjacency[b.atoms[1]].push(b.atoms[0]);
  }

  const positions: Vec2[] = Array.from({ length: atomCount }, () => ({ x: 0, y: 0 }));
  const visited = new Array(atomCount).fill(false);
  let component = 0;

  for (let start = 0; start < atomCount; start++) {
    if (visited[start]) continue;
    // Корень компоненты — атом с максимумом связей (при равенстве — первый).
    // Компоненты без связей разводим по горизонтали.
    const offsetX = component * LAYOUT_STEP * 2;
    component += 1;

    let root = start;
    // BFS с выбором корня внутри компоненты.
    const queue = [start];
    visited[start] = true;
    const members: number[] = [];
    for (let qi = 0; qi < queue.length; qi++) {
      const n = queue[qi];
      members.push(n);
      for (const next of adjacency[n]) {
        if (!visited[next]) {
          visited[next] = true;
          queue.push(next);
        }
      }
    }
    for (const n of members) {
      if (adjacency[n].length > adjacency[root].length) root = n;
    }

    // Родители в дереве от корня.
    const parent = new Map<number, number | null>([[root, null]]);
    const order = [root];
    for (let i = 0; i < order.length; i++) {
      for (const next of adjacency[order[i]]) {
        if (!parent.has(next)) {
          parent.set(next, order[i]);
          order.push(next);
        }
      }
    }

    // Число листьев каждого поддерева.
    const leaves = new Map<number, number>();
    for (let i = order.length - 1; i >= 0; i--) {
      const n = order[i];
      const children = adjacency[n].filter((c) => parent.get(c) === n);
      leaves.set(
        n,
        children.length === 0 ? 1 : children.reduce((sum, c) => sum + leaves.get(c)!, 0),
      );
    }

    const place = (node: number, sectorStart: number, sectorEnd: number): void => {
      const nodeParent = parent.get(node);
      if (nodeParent != null) {
        const angle = (sectorStart + sectorEnd) / 2;
        const p = positions[nodeParent];
        positions[node] = {
          x: p.x + LAYOUT_STEP * Math.cos(angle),
          y: p.y + LAYOUT_STEP * Math.sin(angle),
        };
      } else {
        positions[node] = { x: offsetX, y: 0 };
      }
      const children = adjacency[node].filter((c) => parent.get(c) === node);
      let cursor = sectorStart;
      for (const child of children) {
        const span =
          ((sectorEnd - sectorStart) * leaves.get(child)!) / (leaves.get(node) ?? 1);
        place(child, cursor, cursor + span);
        cursor += span;
      }
    };
    place(root, 0, 2 * Math.PI);
  }

  return positions;
}

export function buildMoleculeFromSubstance(
  substanceId: string,
  origin: Vec2,
  makeId: () => string = () => crypto.randomUUID(),
): { atoms: AtomInstance[]; bonds: Bond[] } {
  const substance = getSubstance(substanceId);
  const positions = layoutTree(substance.structure.atoms.length, substance.structure.bonds);

  const atoms: AtomInstance[] = substance.structure.atoms.map((structureAtom, i) => ({
    id: makeId(),
    element: structureAtom.element,
    position: { x: origin.x + positions[i].x, y: origin.y + positions[i].y },
  }));

  const bonds: Bond[] = substance.structure.bonds.map((structureBond) => ({
    id: makeId(),
    atomIds: [atoms[structureBond.atoms[0]].id, atoms[structureBond.atoms[1]].id],
    order: structureBond.order,
    kind: structureBond.kind,
  }));

  return { atoms, bonds };
}
