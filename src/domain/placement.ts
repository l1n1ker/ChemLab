// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import type { Vec2 } from './types';

/**
 * FR-28/FR-31: авторазмещение содержимого корзины на столе —
 * рядком от верхнего левого угла свободной зоны вправо с равномерным шагом;
 * занятая позиция → следующая свободная вправо, далее следующий ряд ниже.
 */

export interface PlacementItem {
  /** Условная ширина единицы размещения: атом или молекула целиком (FR-31). */
  width: number;
}

export const PLACEMENT_STEP = 80;
export const PLACEMENT_START: Vec2 = { x: 60, y: 70 };
const OCCUPY_RADIUS = 48;

function isFree(slot: Vec2, occupied: Vec2[]): boolean {
  return !occupied.some(
    (p) => Math.abs(p.x - slot.x) < OCCUPY_RADIUS && Math.abs(p.y - slot.y) < OCCUPY_RADIUS,
  );
}

export function placeCart(
  items: PlacementItem[],
  occupied: Vec2[],
  areaWidth: number,
  start: Vec2 = PLACEMENT_START,
): Vec2[] {
  const taken = [...occupied];
  const result: Vec2[] = [];
  // Правая граница — абсолютная координата: start.x + ширина области (v0.17).
  const maxX = start.x + Math.max(areaWidth - 60, PLACEMENT_STEP);
  let x = start.x;
  let y = start.y;
  // Высота ряда — по самой крупной единице в ряду: молекулы не наползают друг на друга (v0.17).
  let rowHeight = 0;

  const wrap = () => {
    x = start.x;
    y += rowHeight;
    rowHeight = 0;
  };

  for (const item of items) {
    const size = Math.max(PLACEMENT_STEP, item.width) + 10;
    rowHeight = Math.max(rowHeight, size);
    while (!isFree({ x, y }, taken)) {
      x += PLACEMENT_STEP;
      if (x > maxX) wrap();
    }
    result.push({ x, y });
    taken.push({ x, y });
    x += Math.max(PLACEMENT_STEP, item.width);
    if (x > maxX) wrap();
  }
  return result;
}
