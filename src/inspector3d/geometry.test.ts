// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from 'vitest';
import type { AtomInstance, Bond, BondOrder } from '../domain/types';
import { computeGeometry } from './geometry';

let seq = 0;
function atom(element: string): AtomInstance {
  seq += 1;
  return { id: `a${seq}`, element, position: { x: 0, y: 0 } };
}

function bond(a: AtomInstance, b: AtomInstance, order: BondOrder): Bond {
  seq += 1;
  return { id: `b${seq}`, atomIds: [a.id, b.id], order, kind: 'covalent' };
}

type Vec3 = [number, number, number];

function angleDeg(p1: Vec3, center: Vec3, p2: Vec3): number {
  const v1: Vec3 = [p1[0] - center[0], p1[1] - center[1], p1[2] - center[2]];
  const v2: Vec3 = [p2[0] - center[0], p2[1] - center[1], p2[2] - center[2]];
  const dot = v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
  const l1 = Math.hypot(...v1);
  const l2 = Math.hypot(...v2);
  return (Math.acos(dot / (l1 * l2)) * 180) / Math.PI;
}

describe('FR-11: справочная геометрия каталожных веществ', () => {
  it('вода — угловая, ~104,5°', () => {
    const o = atom('O');
    const h1 = atom('H');
    const h2 = atom('H');
    const result = computeGeometry([o, h1, h2], [bond(o, h1, 1), bond(o, h2, 1)]);

    expect(result.schematic).toBe(false);
    const angle = angleDeg(
      result.positions.get(h1.id)!,
      result.positions.get(o.id)!,
      result.positions.get(h2.id)!,
    );
    expect(angle).toBeCloseTo(104.5, 1);
  });

  it('CO₂ — линейная, 180°', () => {
    const c = atom('C');
    const o1 = atom('O');
    const o2 = atom('O');
    const result = computeGeometry([c, o1, o2], [bond(c, o1, 2), bond(c, o2, 2)]);

    expect(result.schematic).toBe(false);
    const angle = angleDeg(
      result.positions.get(o1.id)!,
      result.positions.get(c.id)!,
      result.positions.get(o2.id)!,
    );
    expect(angle).toBeCloseTo(180, 1);
  });

  it('метан — тетраэдр, ~109,5°', () => {
    const c = atom('C');
    const hs = [atom('H'), atom('H'), atom('H'), atom('H')];
    const result = computeGeometry(
      [c, ...hs],
      hs.map((h) => bond(c, h, 1)),
    );

    expect(result.schematic).toBe(false);
    const angle = angleDeg(
      result.positions.get(hs[0].id)!,
      result.positions.get(c.id)!,
      result.positions.get(hs[1].id)!,
    );
    expect(angle).toBeCloseTo(109.47, 1);
  });
});

describe('FR-11/R2: эвристическая геометрия помечается как схематичная', () => {
  it('H₂O₂: справочных координат нет — schematic', () => {
    const h1 = atom('H');
    const o1 = atom('O');
    const o2 = atom('O');
    const h2 = atom('H');
    const result = computeGeometry(
      [h1, o1, o2, h2],
      [bond(h1, o1, 1), bond(o1, o2, 1), bond(o2, h2, 1)],
    );

    expect(result.schematic).toBe(true);
    expect(result.positions.size).toBe(4);
  });

  it('некаталожное соединение (CH3): эвристика, все атомы размещены', () => {
    const c = atom('C');
    const hs = [atom('H'), atom('H'), atom('H')];
    const result = computeGeometry(
      [c, ...hs],
      hs.map((h) => bond(c, h, 1)),
    );

    expect(result.schematic).toBe(true);
    expect(result.positions.size).toBe(4);
    // Три соседа — треугольник 120°.
    const angle = angleDeg(
      result.positions.get(hs[0].id)!,
      result.positions.get(c.id)!,
      result.positions.get(hs[1].id)!,
    );
    expect(angle).toBeCloseTo(120, 1);
  });
});

describe('FR-11: геометрия M1', () => {
  it('аммиак — треугольная пирамида, ~107,8°', () => {
    const n = atom('N');
    const hs = [atom('H'), atom('H'), atom('H')];
    const result = computeGeometry(
      [n, ...hs],
      hs.map((h) => bond(n, h, 1)),
    );

    expect(result.schematic).toBe(false);
    const angle = angleDeg(
      result.positions.get(hs[0].id)!,
      result.positions.get(n.id)!,
      result.positions.get(hs[1].id)!,
    );
    expect(angle).toBeCloseTo(107.8, 1);
  });

  it('SO₃ — плоский треугольник, 120°', () => {
    const s = atom('S');
    const os_ = [atom('O'), atom('O'), atom('O')];
    const result = computeGeometry(
      [s, ...os_],
      os_.map((o) => bond(s, o, 2)),
    );

    expect(result.schematic).toBe(false);
    const angle = angleDeg(
      result.positions.get(os_[0].id)!,
      result.positions.get(s.id)!,
      result.positions.get(os_[1].id)!,
    );
    expect(angle).toBeCloseTo(120, 1);
  });
});
