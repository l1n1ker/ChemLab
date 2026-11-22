// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

// Доменные типы по SPEC.md, раздел 6.1.

/** Справочник элементов (read-only), NFR-4: версионируется вместе со спекой. */
export interface Element {
  symbol: string;
  name: string;
  atomicNumber: number;
  /** Атомная масса, а.е.м. */
  atomicMass: number;
  /** Допустимые валентности (список, DR-2). */
  valences: number[];
  /** Цвет по CPK. */
  cpkColor: string;
  /** Электроотрицательность по Полингу — для степеней окисления (FR-6, v0.6). */
  electronegativity: number;
}

export interface Vec2 {
  x: number;
  y: number;
}

/** Экземпляр атома на столе. */
export interface AtomInstance {
  id: string;
  element: string;
  position: Vec2;
}

export type BondOrder = 1 | 2 | 3;

/**
 * DR-4: ионные соединения представляются особым типом связи.
 * В M0 ионные связи не создаются; тип зарезервирован контрактом.
 */
export type BondKind = 'covalent' | 'ionic';

export interface Bond {
  id: string;
  atomIds: [string, string];
  order: BondOrder;
  kind: BondKind;
}

/** Эталонная структура вещества из каталога (для DR-6 и 3D-геометрии). */
export interface StructureAtom {
  element: string;
  /** Справочные 3D-координаты (ангстремы); отсутствуют — геометрия эвристическая (R2). */
  position?: [number, number, number];
}

export interface StructureBond {
  atoms: [number, number];
  order: BondOrder;
  /** DR-4: ионные связи — без кратности (order всегда 1). */
  kind: BondKind;
}

/** Класс неорганического вещества (SPEC.md 14.1, v0.6). */
export type SubstanceClass = 'simple' | 'oxide' | 'acid' | 'base' | 'salt';

/** Substance — каталог известных веществ (SPEC.md 6.1). */
export interface Substance {
  id: string;
  formula: string;
  name: string;
  molarMass: number;
  /** Класс; отсутствует, если ни один класс школьной классификации не подходит (P1). */
  class?: SubstanceClass;
  stateAtSTP?: 'solid' | 'liquid' | 'gas';
  properties?: {
    mp?: number;
    bp?: number;
    density?: number;
    /** Единица плотности: г/см³ для жидкостей и твёрдых, г/л для газов. */
    densityUnit?: 'g/cm3' | 'g/L';
  };
  structure: {
    atoms: StructureAtom[];
    bonds: StructureBond[];
  };
}

/** Массовая доля элемента в составе (SPEC.md 6.2). */
export interface ElementFraction {
  element: string;
  name: string;
  count: number;
  percent: number;
}

/**
 * Molecule — производная сущность: связный компонент графа AtomInstance+Bond.
 * catalogMatch определяется структурой, а не формулой (DR-6).
 */
export interface MoleculeView {
  id: string;
  atomIds: string[];
  bondIds: string[];
  formula: string;
  molarMass: number;
  fractions: ElementFraction[];
  substance: Substance | null;
  /** Валентно-корректно, но неизвестно каталогу (DR-5, FR-6). */
  isHypothetical: boolean;
  /** Степени окисления по элементам (FR-6, v0.6). */
  oxidationStates: Map<string, number[]>;
}
