// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import type { Element } from '../types';

/**
 * Справочник элементов M1 — 18 элементов (SPEC.md 7.1).
 * NFR-4: данные версионируются как часть спеки; изменение = ревизия спеки.
 * Валентности — школьная модель (DR-2: список допустимых).
 * Электроотрицательность по Полингу — для степеней окисления (FR-6, v0.6).
 */
export const ELEMENTS: Record<string, Element> = {
  H: { symbol: 'H', name: 'Водород', atomicNumber: 1, atomicMass: 1.008, valences: [1], cpkColor: '#FFFFFF', electronegativity: 2.2 },
  C: { symbol: 'C', name: 'Углерод', atomicNumber: 6, atomicMass: 12.011, valences: [4], cpkColor: '#909090', electronegativity: 2.55 },
  N: { symbol: 'N', name: 'Азот', atomicNumber: 7, atomicMass: 14.007, valences: [2, 3, 4], cpkColor: '#3050F8', electronegativity: 3.04 },
  O: { symbol: 'O', name: 'Кислород', atomicNumber: 8, atomicMass: 15.999, valences: [2], cpkColor: '#FF0D0D', electronegativity: 3.44 },
  F: { symbol: 'F', name: 'Фтор', atomicNumber: 9, atomicMass: 18.998, valences: [1], cpkColor: '#90E050', electronegativity: 3.98 },
  Na: { symbol: 'Na', name: 'Натрий', atomicNumber: 11, atomicMass: 22.99, valences: [1], cpkColor: '#AB5CF2', electronegativity: 0.93 },
  Mg: { symbol: 'Mg', name: 'Магний', atomicNumber: 12, atomicMass: 24.305, valences: [2], cpkColor: '#8AFF00', electronegativity: 1.31 },
  Al: { symbol: 'Al', name: 'Алюминий', atomicNumber: 13, atomicMass: 26.982, valences: [3], cpkColor: '#BFA6A6', electronegativity: 1.61 },
  Si: { symbol: 'Si', name: 'Кремний', atomicNumber: 14, atomicMass: 28.085, valences: [4], cpkColor: '#F0C8A0', electronegativity: 1.9 },
  P: { symbol: 'P', name: 'Фосфор', atomicNumber: 15, atomicMass: 30.974, valences: [3, 5], cpkColor: '#FF8000', electronegativity: 2.19 },
  S: { symbol: 'S', name: 'Сера', atomicNumber: 16, atomicMass: 32.06, valences: [2, 4, 6], cpkColor: '#FFFF30', electronegativity: 2.58 },
  Cl: { symbol: 'Cl', name: 'Хлор', atomicNumber: 17, atomicMass: 35.45, valences: [1], cpkColor: '#1FF01F', electronegativity: 3.16 },
  K: { symbol: 'K', name: 'Калий', atomicNumber: 19, atomicMass: 39.098, valences: [1], cpkColor: '#8F40D4', electronegativity: 0.82 },
  Ca: { symbol: 'Ca', name: 'Кальций', atomicNumber: 20, atomicMass: 40.078, valences: [2], cpkColor: '#3DFF00', electronegativity: 1.0 },
  Fe: { symbol: 'Fe', name: 'Железо', atomicNumber: 26, atomicMass: 55.845, valences: [2, 3], cpkColor: '#E06633', electronegativity: 1.83 },
  Cu: { symbol: 'Cu', name: 'Медь', atomicNumber: 29, atomicMass: 63.546, valences: [1, 2], cpkColor: '#C88033', electronegativity: 1.9 },
  Br: { symbol: 'Br', name: 'Бром', atomicNumber: 35, atomicMass: 79.904, valences: [1], cpkColor: '#A62929', electronegativity: 2.96 },
  I: { symbol: 'I', name: 'Иод', atomicNumber: 53, atomicMass: 126.904, valences: [1], cpkColor: '#940094', electronegativity: 2.66 },
};

export function getElement(symbol: string): Element {
  const element = ELEMENTS[symbol];
  if (!element) {
    throw new Error(`Неизвестный элемент: ${symbol}`);
  }
  return element;
}
