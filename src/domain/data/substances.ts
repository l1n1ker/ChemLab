// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import type { BondKind, BondOrder, Substance } from '../types';
import { ELEMENTS } from './elements';

/**
 * Каталог веществ M1 — 23 вещества (SPEC.md 7.2).
 * Структура — эталон для сопоставления по DR-6 (структура, не формула).
 * Справочная геометрия (FR-11) задана только для подтверждённых справочных
 * углов; остальное — эвристика с ярлыком «схематичная геометрия» (P1, R2).
 * Физические свойства — стандартные справочные значения; где значение
 * неустойчиво к условиям (CO₂ сублимирует, CaCO₃ разлагается) — поле опущено (P1).
 * Плотность газов — г/л при н.у., жидкостей и твёрдых — г/см³.
 */

type Vec3 = [number, number, number];

function atom(element: string, position?: Vec3) {
  return { element, position };
}

function bond(a: number, b: number, order: BondOrder, kind: BondKind = 'covalent') {
  return { atoms: [a, b] as [number, number], order, kind };
}

function mm(counts: [string, number][]): number {
  return counts.reduce((sum, [symbol, n]) => sum + ELEMENTS[symbol].atomicMass * n, 0);
}

// --- Геометрия ----------------------------------------------------------------

function diatomic(length: number): [Vec3, Vec3] {
  return [
    [-length / 2, 0, 0],
    [length / 2, 0, 0],
  ];
}

/** Угловая молекула AX₂: центральный атом в начале, угол задан. */
function bent(angleDeg: number, bondLength: number): [Vec3, Vec3] {
  const half = ((angleDeg / 2) * Math.PI) / 180;
  return [
    [-bondLength * Math.sin(half), -bondLength * Math.cos(half), 0],
    [bondLength * Math.sin(half), -bondLength * Math.cos(half), 0],
  ];
}

/** Тетраэдр AX₄ (угол 109,47°). */
function tetrahedral(bondLength: number): [Vec3, Vec3, Vec3, Vec3] {
  const base: Vec3[] = [
    [1, 1, 1],
    [1, -1, -1],
    [-1, 1, -1],
    [-1, -1, 1],
  ];
  return base.map(([x, y, z]) => {
    const len = Math.sqrt(3);
    return [(x / len) * bondLength, (y / len) * bondLength, (z / len) * bondLength] as Vec3;
  }) as [Vec3, Vec3, Vec3, Vec3];
}

/** Треугольная пирамида AX₃ с заданным углом A-связей (аммиак ~107,8°). */
function pyramidal(angleDeg: number, bondLength: number): [Vec3, Vec3, Vec3] {
  const alpha = (angleDeg * Math.PI) / 180;
  // cos(α) = cos²β − ½ sin²β, где β — полярный угол связи от оси симметрии
  const cos2beta = (Math.cos(alpha) + 0.5) / 1.5;
  const sinBeta = Math.sqrt(1 - cos2beta);
  const cosBeta = -Math.sqrt(cos2beta);
  return [0, 120, 240].map((phiDeg) => {
    const phi = (phiDeg * Math.PI) / 180;
    return [
      bondLength * sinBeta * Math.cos(phi),
      bondLength * sinBeta * Math.sin(phi),
      bondLength * cosBeta,
    ] as Vec3;
  }) as [Vec3, Vec3, Vec3];
}

/** Плоский треугольник AX₃ (угол 120°). */
function trigonalPlanar(bondLength: number): [Vec3, Vec3, Vec3] {
  return [0, 120, 240].map((phiDeg) => {
    const phi = (phiDeg * Math.PI) / 180;
    return [bondLength * Math.cos(phi), bondLength * Math.sin(phi), 0] as Vec3;
  }) as [Vec3, Vec3, Vec3];
}

// --- Каталог ------------------------------------------------------------------

const [h2a, h2b] = diatomic(0.74);
const [o2a, o2b] = diatomic(1.21);
const [n2a, n2b] = diatomic(1.1);
const [cl2a, cl2b] = diatomic(1.99);
const [coA, coB] = diatomic(1.13);
const [noA, noB] = diatomic(1.15);
const [hclA, hclB] = diatomic(1.27);
const h2oH = bent(104.5, 0.96);
const h2sH = bent(92.1, 1.34);
const so2O = bent(119.5, 1.43);
const no2O = bent(134.3, 1.19);
const so3O = trigonalPlanar(1.42);
const nh3H = pyramidal(107.8, 1.015);
const ch4H = tetrahedral(1.09);

export const SUBSTANCES: Substance[] = [
  {
    id: 'h2', formula: 'H2', name: 'Водород', molarMass: mm([['H', 2]]),
    class: 'simple', stateAtSTP: 'gas',
    properties: { mp: -259, bp: -253, density: 0.09, densityUnit: 'g/L' },
    structure: { atoms: [atom('H', h2a), atom('H', h2b)], bonds: [bond(0, 1, 1)] },
  },
  {
    id: 'o2', formula: 'O2', name: 'Кислород', molarMass: mm([['O', 2]]),
    class: 'simple', stateAtSTP: 'gas',
    properties: { mp: -218, bp: -183, density: 1.43, densityUnit: 'g/L' },
    structure: { atoms: [atom('O', o2a), atom('O', o2b)], bonds: [bond(0, 1, 2)] },
  },
  {
    id: 'n2', formula: 'N2', name: 'Азот', molarMass: mm([['N', 2]]),
    class: 'simple', stateAtSTP: 'gas',
    properties: { mp: -210, bp: -196, density: 1.25, densityUnit: 'g/L' },
    structure: { atoms: [atom('N', n2a), atom('N', n2b)], bonds: [bond(0, 1, 3)] },
  },
  {
    id: 'cl2', formula: 'Cl2', name: 'Хлор', molarMass: mm([['Cl', 2]]),
    class: 'simple', stateAtSTP: 'gas',
    properties: { mp: -101, bp: -34, density: 3.21, densityUnit: 'g/L' },
    structure: { atoms: [atom('Cl', cl2a), atom('Cl', cl2b)], bonds: [bond(0, 1, 1)] },
  },
  {
    id: 'h2o', formula: 'H2O', name: 'Вода', molarMass: mm([['H', 2], ['O', 1]]),
    class: 'oxide', stateAtSTP: 'liquid',
    properties: { mp: 0, bp: 100, density: 1.0, densityUnit: 'g/cm3' },
    structure: {
      atoms: [atom('O', [0, 0, 0]), atom('H', h2oH[0]), atom('H', h2oH[1])],
      bonds: [bond(0, 1, 1), bond(0, 2, 1)],
    },
  },
  {
    id: 'h2o2', formula: 'H2O2', name: 'Пероксид водорода', molarMass: mm([['H', 2], ['O', 2]]),
    stateAtSTP: 'liquid',
    properties: { mp: -0.4, bp: 150, density: 1.45, densityUnit: 'g/cm3' },
    structure: {
      atoms: [atom('H'), atom('O'), atom('O'), atom('H')],
      bonds: [bond(0, 1, 1), bond(1, 2, 1), bond(2, 3, 1)],
    },
  },
  {
    id: 'co', formula: 'CO', name: 'Монооксид углерода', molarMass: mm([['C', 1], ['O', 1]]),
    class: 'oxide', stateAtSTP: 'gas',
    properties: { mp: -205, bp: -192, density: 1.25, densityUnit: 'g/L' },
    structure: { atoms: [atom('C', coA), atom('O', coB)], bonds: [bond(0, 1, 3)] },
  },
  {
    id: 'co2', formula: 'CO2', name: 'Диоксид углерода', molarMass: mm([['C', 1], ['O', 2]]),
    class: 'oxide', stateAtSTP: 'gas',
    properties: { density: 1.98, densityUnit: 'g/L' },
    structure: {
      atoms: [atom('C', [0, 0, 0]), atom('O', [-1.16, 0, 0]), atom('O', [1.16, 0, 0])],
      bonds: [bond(0, 1, 2), bond(0, 2, 2)],
    },
  },
  {
    id: 'ch4', formula: 'CH4', name: 'Метан', molarMass: mm([['C', 1], ['H', 4]]),
    stateAtSTP: 'gas',
    properties: { mp: -182, bp: -162, density: 0.72, densityUnit: 'g/L' },
    structure: {
      atoms: [atom('C', [0, 0, 0]), atom('H', ch4H[0]), atom('H', ch4H[1]), atom('H', ch4H[2]), atom('H', ch4H[3])],
      bonds: [bond(0, 1, 1), bond(0, 2, 1), bond(0, 3, 1), bond(0, 4, 1)],
    },
  },
  {
    id: 'nh3', formula: 'NH3', name: 'Аммиак', molarMass: mm([['N', 1], ['H', 3]]),
    stateAtSTP: 'gas',
    properties: { mp: -78, bp: -33, density: 0.77, densityUnit: 'g/L' },
    structure: {
      atoms: [atom('N', [0, 0, 0]), atom('H', nh3H[0]), atom('H', nh3H[1]), atom('H', nh3H[2])],
      bonds: [bond(0, 1, 1), bond(0, 2, 1), bond(0, 3, 1)],
    },
  },
  {
    id: 'hcl', formula: 'HCl', name: 'Хлороводород', molarMass: mm([['H', 1], ['Cl', 1]]),
    class: 'acid', stateAtSTP: 'gas',
    properties: { mp: -114, bp: -85, density: 1.63, densityUnit: 'g/L' },
    structure: { atoms: [atom('H', hclA), atom('Cl', hclB)], bonds: [bond(0, 1, 1)] },
  },
  {
    id: 'h2s', formula: 'H2S', name: 'Сероводород', molarMass: mm([['H', 2], ['S', 1]]),
    class: 'acid', stateAtSTP: 'gas',
    properties: { mp: -86, bp: -60, density: 1.54, densityUnit: 'g/L' },
    structure: {
      atoms: [atom('S', [0, 0, 0]), atom('H', h2sH[0]), atom('H', h2sH[1])],
      bonds: [bond(0, 1, 1), bond(0, 2, 1)],
    },
  },
  {
    id: 'so2', formula: 'SO2', name: 'Диоксид серы', molarMass: mm([['S', 1], ['O', 2]]),
    class: 'oxide', stateAtSTP: 'gas',
    properties: { mp: -75, bp: -10, density: 2.93, densityUnit: 'g/L' },
    structure: {
      atoms: [atom('S', [0, 0, 0]), atom('O', so2O[0]), atom('O', so2O[1])],
      bonds: [bond(0, 1, 2), bond(0, 2, 2)],
    },
  },
  {
    id: 'so3', formula: 'SO3', name: 'Триоксид серы', molarMass: mm([['S', 1], ['O', 3]]),
    class: 'oxide', stateAtSTP: 'solid',
    properties: { mp: 17, bp: 45, density: 1.92, densityUnit: 'g/cm3' },
    structure: {
      atoms: [atom('S', [0, 0, 0]), atom('O', so3O[0]), atom('O', so3O[1]), atom('O', so3O[2])],
      bonds: [bond(0, 1, 2), bond(0, 2, 2), bond(0, 3, 2)],
    },
  },
  {
    id: 'no', formula: 'NO', name: 'Монооксид азота', molarMass: mm([['N', 1], ['O', 1]]),
    class: 'oxide', stateAtSTP: 'gas',
    properties: { mp: -164, bp: -152, density: 1.34, densityUnit: 'g/L' },
    structure: { atoms: [atom('N', noA), atom('O', noB)], bonds: [bond(0, 1, 2)] },
  },
  {
    id: 'no2', formula: 'NO2', name: 'Диоксид азота', molarMass: mm([['N', 1], ['O', 2]]),
    class: 'oxide', stateAtSTP: 'gas',
    properties: { mp: -11, bp: 21, density: 2.05, densityUnit: 'g/L' },
    structure: {
      atoms: [atom('N', [0, 0, 0]), atom('O', no2O[0]), atom('O', no2O[1])],
      bonds: [bond(0, 1, 2), bond(0, 2, 2)],
    },
  },
  {
    id: 'nacl', formula: 'NaCl', name: 'Хлорид натрия', molarMass: mm([['Na', 1], ['Cl', 1]]),
    class: 'salt', stateAtSTP: 'solid',
    properties: { mp: 801, bp: 1465, density: 2.17, densityUnit: 'g/cm3' },
    structure: { atoms: [atom('Na'), atom('Cl')], bonds: [bond(0, 1, 1, 'ionic')] },
  },
  {
    id: 'naoh', formula: 'NaOH', name: 'Гидроксид натрия', molarMass: mm([['Na', 1], ['O', 1], ['H', 1]]),
    class: 'base', stateAtSTP: 'solid',
    properties: { mp: 318, bp: 1388, density: 2.13, densityUnit: 'g/cm3' },
    structure: {
      atoms: [atom('Na'), atom('O'), atom('H')],
      bonds: [bond(0, 1, 1, 'ionic'), bond(1, 2, 1)],
    },
  },
  {
    id: 'koh', formula: 'KOH', name: 'Гидроксид калия', molarMass: mm([['K', 1], ['O', 1], ['H', 1]]),
    class: 'base', stateAtSTP: 'solid',
    properties: { mp: 360, density: 2.04, densityUnit: 'g/cm3' },
    structure: {
      atoms: [atom('K'), atom('O'), atom('H')],
      bonds: [bond(0, 1, 1, 'ionic'), bond(1, 2, 1)],
    },
  },
  {
    id: 'cao', formula: 'CaO', name: 'Оксид кальция', molarMass: mm([['Ca', 1], ['O', 1]]),
    class: 'oxide', stateAtSTP: 'solid',
    properties: { mp: 2572, bp: 2850, density: 3.35, densityUnit: 'g/cm3' },
    structure: { atoms: [atom('Ca'), atom('O')], bonds: [bond(0, 1, 1, 'ionic')] },
  },
  {
    id: 'caco3', formula: 'CaCO3', name: 'Карбонат кальция', molarMass: mm([['Ca', 1], ['C', 1], ['O', 3]]),
    class: 'salt', stateAtSTP: 'solid',
    properties: { density: 2.71, densityUnit: 'g/cm3' },
    structure: {
      atoms: [atom('Ca'), atom('C'), atom('O'), atom('O'), atom('O')],
      bonds: [
        bond(1, 2, 2),
        bond(1, 3, 1),
        bond(1, 4, 1),
        bond(0, 3, 1, 'ionic'),
        bond(0, 4, 1, 'ionic'),
      ],
    },
  },
  {
    id: 'cuo', formula: 'CuO', name: 'Оксид меди(II)', molarMass: mm([['Cu', 1], ['O', 1]]),
    class: 'oxide', stateAtSTP: 'solid',
    properties: { mp: 1326, density: 6.31, densityUnit: 'g/cm3' },
    structure: { atoms: [atom('Cu'), atom('O')], bonds: [bond(0, 1, 1, 'ionic')] },
  },
  {
    id: 'fe2o3', formula: 'Fe2O3', name: 'Оксид железа(III)', molarMass: mm([['Fe', 2], ['O', 3]]),
    class: 'oxide', stateAtSTP: 'solid',
    properties: { mp: 1565, density: 5.24, densityUnit: 'g/cm3' },
    structure: {
      atoms: [atom('Fe'), atom('Fe'), atom('O'), atom('O'), atom('O')],
      bonds: [
        bond(0, 2, 1, 'ionic'), bond(0, 3, 1, 'ionic'), bond(0, 4, 1, 'ionic'),
        bond(1, 2, 1, 'ionic'), bond(1, 3, 1, 'ionic'), bond(1, 4, 1, 'ionic'),
      ],
    },
  },
];

export function getSubstance(id: string): Substance {
  const substance = SUBSTANCES.find((s) => s.id === id);
  if (!substance) throw new Error(`Неизвестное вещество: ${id}`);
  return substance;
}
