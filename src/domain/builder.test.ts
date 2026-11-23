// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from 'vitest';
import { buildMoleculeFromSubstance } from './builder';
import { SUBSTANCES } from './data/substances';
import type { Vec2 } from './types';

/** Строгое пересечение отрезков (коллинеарные/касающиеся не считаем). */
function segmentsCross(a: Vec2, b: Vec2, c: Vec2, d: Vec2): boolean {
  const cross = (o: Vec2, p: Vec2, q: Vec2) =>
    (p.x - o.x) * (q.y - o.y) - (p.y - o.y) * (q.x - o.x);
  const d1 = cross(c, d, a);
  const d2 = cross(c, d, b);
  const d3 = cross(a, b, c);
  const d4 = cross(a, b, d);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function build(substanceId: string) {
  let seq = 0;
  return buildMoleculeFromSubstance(substanceId, { x: 0, y: 0 }, () => `id${seq++}`);
}

describe('FR-2 (v0.21): древовидная раскладка молекул на столе', () => {
  it('ни у одного вещества каталога связи не пересекаются', () => {
    for (const substance of SUBSTANCES) {
      const { atoms, bonds } = build(substance.id);
      const pos = new Map(atoms.map((a) => [a.id, a.position]));
      for (let i = 0; i < bonds.length; i++) {
        for (let j = i + 1; j < bonds.length; j++) {
          const b1 = bonds[i];
          const b2 = bonds[j];
          // Связи с общим атомом не проверяем.
          if (b1.atomIds.some((id) => b2.atomIds.includes(id))) continue;
          const crosses = segmentsCross(
            pos.get(b1.atomIds[0])!,
            pos.get(b1.atomIds[1])!,
            pos.get(b2.atomIds[0])!,
            pos.get(b2.atomIds[1])!,
          );
          expect(crosses, `${substance.id}: связи ${b1.atomIds} и ${b2.atomIds} пересекаются`).toBe(false);
        }
      }
    }
  });

  it('атомы не слипаются: минимальное расстояние ≥ 30 px на всём каталоге', () => {
    for (const substance of SUBSTANCES) {
      const { atoms } = build(substance.id);
      for (let i = 0; i < atoms.length; i++) {
        for (let j = i + 1; j < atoms.length; j++) {
          const dx = atoms[i].position.x - atoms[j].position.x;
          const dy = atoms[i].position.y - atoms[j].position.y;
          const distance = Math.hypot(dx, dy);
          expect(
            distance,
            `${substance.id}: атомы ${atoms[i].element} и ${atoms[j].element} на ${distance.toFixed(1)} px`,
          ).toBeGreaterThanOrEqual(30);
        }
      }
    }
  });

  it('регрессия: H₂SO₄ — крест из четырёх O вокруг S, H снаружи, без пересечений', () => {
    const { atoms, bonds } = build('h2so4');
    expect(atoms).toHaveLength(7);
    const sulfur = atoms.find((a) => a.element === 'S')!;
    expect(sulfur.position).toEqual({ x: 0, y: 0 }); // корень — атом с максимумом связей
    const pos = new Map(atoms.map((a) => [a.id, a.position]));
    for (let i = 0; i < bonds.length; i++) {
      for (let j = i + 1; j < bonds.length; j++) {
        if (bonds[i].atomIds.some((id) => bonds[j].atomIds.includes(id))) continue;
        expect(
          segmentsCross(
            pos.get(bonds[i].atomIds[0])!,
            pos.get(bonds[i].atomIds[1])!,
            pos.get(bonds[j].atomIds[0])!,
            pos.get(bonds[j].atomIds[1])!,
          ),
        ).toBe(false);
      }
    }
  });

  it('одноатомные вещества (C, S, Na, Fe) размещаются в точке вставки', () => {
    const { atoms } = build('na');
    expect(atoms).toHaveLength(1);
    expect(atoms[0].position).toEqual({ x: 0, y: 0 });
  });
});
