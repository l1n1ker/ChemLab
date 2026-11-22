// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import { findCatalogMatch } from '../domain/matching';
import type { AtomInstance, Bond } from '../domain/types';

/**
 * FR-11: геометрия каталожных веществ — по справочным координатам
 * (вода ~104,5°, метан ~109,5°, CO₂ линейная).
 * Для прочих — эвристика по числу связей (SPEC.md 4.3), помечается
 * как «схематичная геометрия» (риск R2, принцип P1).
 */

export interface GeometryResult {
  /** id атома → координаты (условные ангстремы). */
  positions: Map<string, [number, number, number]>;
  /** true — геометрия эвристическая, а не справочная. */
  schematic: boolean;
}

type Vec3 = [number, number, number];

/** Шаблоны направлений по валентности центрального атома (SPEC.md 4.3). */
const DIRECTION_TEMPLATES: Record<number, Vec3[]> = {
  1: [[1, 0, 0]],
  2: [
    [1, 0, 0],
    [-1, 0, 0],
  ],
  3: [
    [1, 0, 0],
    [-0.5, Math.sqrt(3) / 2, 0],
    [-0.5, -Math.sqrt(3) / 2, 0],
  ],
  4: [
    [1, 1, 1],
    [1, -1, -1],
    [-1, 1, -1],
    [-1, -1, 1],
  ],
};

/** Условные длины связей по кратности (схематичный масштаб, R2). */
const BOND_LENGTHS: Record<number, number> = { 1: 1.2, 2: 1.1, 3: 1.0 };

function normalize(v: Vec3): Vec3 {
  const len = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / len, v[1] / len, v[2] / len];
}

function directionTemplate(degree: number): Vec3[] {
  if (degree <= 4) return DIRECTION_TEMPLATES[degree].map(normalize);
  // 5+ соседей: равномерно по окружности
  return Array.from({ length: degree }, (_, i) => {
    const angle = (2 * Math.PI * i) / degree;
    return [Math.cos(angle), Math.sin(angle), 0] as Vec3;
  });
}

export function computeGeometry(atoms: AtomInstance[], bonds: Bond[]): GeometryResult {
  const match = findCatalogMatch(atoms, bonds);
  if (match && match.substance.structure.atoms.every((a) => a.position)) {
    const positions = new Map<string, Vec3>();
    for (const atom of atoms) {
      const index = match.mapping.get(atom.id)!;
      positions.set(atom.id, match.substance.structure.atoms[index].position!);
    }
    return { positions, schematic: false };
  }
  return heuristicGeometry(atoms, bonds);
}

function heuristicGeometry(atoms: AtomInstance[], bonds: Bond[]): GeometryResult {
  const adjacency = new Map<string, { to: string; order: number }[]>();
  for (const atom of atoms) adjacency.set(atom.id, []);
  for (const bond of bonds) {
    const [a, b] = bond.atomIds;
    adjacency.get(a)?.push({ to: b, order: bond.order });
    adjacency.get(b)?.push({ to: a, order: bond.order });
  }

  const positions = new Map<string, Vec3>();
  if (atoms.length === 0) return { positions, schematic: true };

  const root = atoms.reduce((best, atom) =>
    (adjacency.get(atom.id)?.length ?? 0) > (adjacency.get(best.id)?.length ?? 0) ? atom : best,
  );
  positions.set(root.id, [0, 0, 0]);

  const queue = [root.id];
  while (queue.length > 0) {
    const id = queue.shift()!;
    const origin = positions.get(id)!;
    const neighbors = adjacency.get(id) ?? [];
    const template = directionTemplate(neighbors.length);
    // Направления уже размещённых соседей заняты — выдаём следующие по шаблону.
    let placedCount = 0;
    for (const neighbor of neighbors) {
      if (positions.has(neighbor.to)) {
        placedCount += 1;
        continue;
      }
      const dir = template[Math.min(placedCount, template.length - 1)];
      placedCount += 1;
      const length = BOND_LENGTHS[neighbor.order] ?? 1.2;
      positions.set(neighbor.to, [
        origin[0] + dir[0] * length,
        origin[1] + dir[1] * length,
        origin[2] + dir[2] * length,
      ]);
      queue.push(neighbor.to);
    }
  }

  return { positions, schematic: true };
}
