// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import type { Element } from '../types';

/**
 * Справочник элементов, M0: H, O, C (SPEC.md 7.1 — полный набор из 18 на M1).
 * NFR-4: данные версионируются как часть спеки; изменение = ревизия спеки.
 */
export const ELEMENTS: Record<string, Element> = {
  H: {
    symbol: 'H',
    name: 'Водород',
    atomicNumber: 1,
    atomicMass: 1.008,
    valences: [1],
    cpkColor: '#FFFFFF',
  },
  O: {
    symbol: 'O',
    name: 'Кислород',
    atomicNumber: 8,
    atomicMass: 15.999,
    valences: [2],
    cpkColor: '#FF0D0D',
  },
  C: {
    symbol: 'C',
    name: 'Углерод',
    atomicNumber: 6,
    atomicMass: 12.011,
    valences: [4],
    cpkColor: '#909090',
  },
};

export function getElement(symbol: string): Element {
  const element = ELEMENTS[symbol];
  if (!element) {
    throw new Error(`Неизвестный элемент: ${symbol}`);
  }
  return element;
}
