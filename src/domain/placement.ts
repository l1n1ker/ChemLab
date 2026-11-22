// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import type { Vec2 } from '../domain/types';

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
): Vec2[] {
  const taken = [...occupied];
  const result: Vec2[] = [];
  let x = PLACEMENT_START.x;
  let y = PLACEMENT_START.y;
  const maxX = Math.max(areaWidth - 60, PLACEMENT_START.x + PLACEMENT_STEP);

  for (const item of items) {
    while (!isFree({ x, y }, taken)) {
      x += PLACEMENT_STEP;
      if (x > maxX) {
        x = PLACEMENT_START.x;
        y += PLACEMENT_STEP + 10;
      }
    }
    result.push({ x, y });
    taken.push({ x, y });
    x += Math.max(PLACEMENT_STEP, item.width);
    if (x > maxX) {
      x = PLACEMENT_START.x;
      y += PLACEMENT_STEP + 10;
    }
  }
  return result;
}
