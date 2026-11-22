// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from 'vitest';
import { PLACEMENT_START, placeCart } from './placement';

describe('placeCart (FR-17, v0.17): раскладка без наложений', () => {
  it('две молекулы в зоне реакции не наползают друг на друга (шаг ряда по размеру)', () => {
    // Геометрия зоны по умолчанию: origin (56, 490), ширина области 340.
    const positions = placeCart([{ width: 200 }, { width: 200 }], [], 340, { x: 56, y: 490 });
    expect(positions).toHaveLength(2);
    const dx = positions[1].x - positions[0].x;
    const dy = positions[1].y - positions[0].y;
    // Молекула занимает ±70 вокруг точки — центры не ближе 140 ни по одной оси,
    // либо разнесены по вертикали на высоту ряда.
    expect(Math.max(Math.abs(dx), Math.abs(dy))).toBeGreaterThanOrEqual(140);
  });

  it('третья молекула переносится на новый ряд с полной высотой ряда', () => {
    const positions = placeCart(
      [{ width: 200 }, { width: 200 }, { width: 200 }],
      [],
      340,
      { x: 56, y: 490 },
    );
    // maxX = 56 + (340 - 60) = 336: в ряд влезают две молекулы (56 и 256), третья — новый ряд.
    expect(positions[0]).toEqual({ x: 56, y: 490 });
    expect(positions[1]).toEqual({ x: 256, y: 490 });
    expect(positions[2].x).toBe(56);
    expect(positions[2].y).toBeGreaterThanOrEqual(490 + 140);
  });

  it('правая граница — абсолютная: зона, сдвинутая вправо, не сжимает ряд до одной молекулы', () => {
    // Зона уехала вправо: start.x = 440, ширина области 340 → maxX = 720.
    const positions = placeCart([{ width: 200 }, { width: 200 }], [], 340, { x: 440, y: 490 });
    expect(positions[1].x).toBe(640);
    expect(positions[1].y).toBe(positions[0].y);
  });

  it('занятая позиция пропускается: продукт не ложится на оставшуюся молекулу', () => {
    const occupied = [{ x: 56, y: 490 }];
    const positions = placeCart([{ width: 200 }], occupied, 340, { x: 56, y: 490 });
    expect(positions[0]).not.toEqual(occupied[0]);
    expect(Math.abs(positions[0].x - 56) >= 48 || Math.abs(positions[0].y - 490) >= 48).toBe(true);
  });

  it('атомы корзины раскладываются рядком как раньше (FR-28/FR-31)', () => {
    const positions = placeCart([{ width: 60 }, { width: 60 }, { width: 60 }], [], 800);
    expect(positions[0]).toEqual(PLACEMENT_START);
    expect(positions[1].y).toBe(positions[0].y);
    expect(positions[1].x).toBe(positions[0].x + 80);
    expect(positions[2].x).toBe(positions[0].x + 160);
  });
});
