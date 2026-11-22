// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import type { Substance } from '../types';

/**
 * Мини-каталог веществ M0 (SPEC.md 7.2 — полный каталог ≥20 на M1).
 * Структура — эталон для сопоставления по DR-6 (структура, не формула).
 * Справочная геометрия (FR-11) задана только там, где подтверждена спекой:
 * вода ~104,5°, CO₂ линейная, метан ~109,5°; двухатомные — по оси.
 * Для H₂O₂ справочных углов в спеке нет — геометрия эвристическая (P1, R2).
 */

const sinH2O = Math.sin((104.5 / 2) * (Math.PI / 180));
const cosH2O = Math.cos((104.5 / 2) * (Math.PI / 180));
const rOH = 0.96;

const tetra: [number, number, number][] = [
  [1, 1, 1],
  [1, -1, -1],
  [-1, 1, -1],
  [-1, -1, 1],
];
const rCH = 1.09;
const tetraScaled = tetra.map(([x, y, z]): [number, number, number] => {
  const len = Math.sqrt(3);
  return [(x / len) * rCH, (y / len) * rCH, (z / len) * rCH];
});

export const SUBSTANCES: Substance[] = [
  {
    id: 'h2',
    formula: 'H2',
    name: 'Водород',
    molarMass: 2.016,
    stateAtSTP: 'gas',
    structure: {
      atoms: [
        { element: 'H', position: [-0.37, 0, 0] },
        { element: 'H', position: [0.37, 0, 0] },
      ],
      bonds: [{ atoms: [0, 1], order: 1 }],
    },
  },
  {
    id: 'o2',
    formula: 'O2',
    name: 'Кислород',
    molarMass: 31.998,
    stateAtSTP: 'gas',
    structure: {
      atoms: [
        { element: 'O', position: [-0.6, 0, 0] },
        { element: 'O', position: [0.6, 0, 0] },
      ],
      bonds: [{ atoms: [0, 1], order: 2 }],
    },
  },
  {
    id: 'h2o',
    formula: 'H2O',
    name: 'Вода',
    molarMass: 18.015,
    stateAtSTP: 'liquid',
    properties: { mp: 0, bp: 100, density: 1.0 },
    structure: {
      atoms: [
        { element: 'O', position: [0, 0, 0] },
        { element: 'H', position: [-rOH * sinH2O, -rOH * cosH2O, 0] },
        { element: 'H', position: [rOH * sinH2O, -rOH * cosH2O, 0] },
      ],
      bonds: [
        { atoms: [0, 1], order: 1 },
        { atoms: [0, 2], order: 1 },
      ],
    },
  },
  {
    id: 'h2o2',
    formula: 'H2O2',
    name: 'Пероксид водорода',
    molarMass: 34.014,
    stateAtSTP: 'liquid',
    structure: {
      atoms: [{ element: 'H' }, { element: 'O' }, { element: 'O' }, { element: 'H' }],
      bonds: [
        { atoms: [0, 1], order: 1 },
        { atoms: [1, 2], order: 1 },
        { atoms: [2, 3], order: 1 },
      ],
    },
  },
  {
    id: 'co',
    formula: 'CO',
    name: 'Монооксид углерода',
    molarMass: 28.01,
    stateAtSTP: 'gas',
    structure: {
      atoms: [
        { element: 'C', position: [-0.57, 0, 0] },
        { element: 'O', position: [0.57, 0, 0] },
      ],
      bonds: [{ atoms: [0, 1], order: 3 }],
    },
  },
  {
    id: 'co2',
    formula: 'CO2',
    name: 'Диоксид углерода',
    molarMass: 44.009,
    stateAtSTP: 'gas',
    structure: {
      atoms: [
        { element: 'C', position: [0, 0, 0] },
        { element: 'O', position: [-1.16, 0, 0] },
        { element: 'O', position: [1.16, 0, 0] },
      ],
      bonds: [
        { atoms: [0, 1], order: 2 },
        { atoms: [0, 2], order: 2 },
      ],
    },
  },
  {
    id: 'ch4',
    formula: 'CH4',
    name: 'Метан',
    molarMass: 16.043,
    stateAtSTP: 'gas',
    structure: {
      atoms: [
        { element: 'C', position: [0, 0, 0] },
        { element: 'H', position: tetraScaled[0] },
        { element: 'H', position: tetraScaled[1] },
        { element: 'H', position: tetraScaled[2] },
        { element: 'H', position: tetraScaled[3] },
      ],
      bonds: [
        { atoms: [0, 1], order: 1 },
        { atoms: [0, 2], order: 1 },
        { atoms: [0, 3], order: 1 },
        { atoms: [0, 4], order: 1 },
      ],
    },
  },
];
