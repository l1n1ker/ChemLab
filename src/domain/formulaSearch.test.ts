// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from 'vitest';
import { canonicalFormulaKey, lookupSubstances, parseFormulaLoose } from './formulaSearch';
import type { Substance } from './types';

describe('parseFormulaLoose (FR-25): толерантный парсер', () => {
  it('H2O, H₂O, OH2 — одинаковый состав', () => {
    const expected = new Map([['H', 2], ['O', 1]]);
    expect(parseFormulaLoose('H2O')).toEqual(expected);
    expect(parseFormulaLoose('H₂O')).toEqual(expected);
    expect(parseFormulaLoose('OH2')).toEqual(new Map([['O', 1], ['H', 2]]));
    expect(canonicalFormulaKey('OH2')).toBe(canonicalFormulaKey('H2O'));
  });

  it('скобки с множителем: Ca(OH)2 → Ca, 2O, 2H', () => {
    expect(parseFormulaLoose('Ca(OH)2')).toEqual(new Map([['Ca', 1], ['O', 2], ['H', 2]]));
    expect(canonicalFormulaKey('Ca(OH)₂')).toBe(canonicalFormulaKey('CaO2H2'));
  });

  it('регистр строгий: «h2o» и «h2O» — не формулы', () => {
    expect(parseFormulaLoose('h2o')).toBeNull();
    expect(parseFormulaLoose('h2O')).toBeNull();
  });

  it('мусор отклоняется: пустая строка, незакрытая скобка, лишние символы', () => {
    expect(parseFormulaLoose('')).toBeNull();
    expect(parseFormulaLoose('Ca(OH')).toBeNull();
    expect(parseFormulaLoose('H2O)')).toBeNull();
    expect(parseFormulaLoose('H2 O')).toBeNull();
  });
});

describe('lookupSubstances (FR-25): поиск по каталогу', () => {
  it('уникальное совпадение по формуле — H2SO4 (US-7)', () => {
    const result = lookupSubstances('H2SO4');
    expect(result.status).toBe('unique');
    if (result.status === 'unique') expect(result.substance.id).toBe('h2so4');
  });

  it('уникальное совпадение по точному названию (регистр не важен)', () => {
    const result = lookupSubstances('серная кислота');
    expect(result.status).toBe('unique');
    if (result.status === 'unique') expect(result.substance.id).toBe('h2so4');
  });

  it('толерантный ввод OH2 → вода', () => {
    const result = lookupSubstances('OH2');
    expect(result.status).toBe('unique');
    if (result.status === 'unique') expect(result.substance.id).toBe('h2o');
  });

  it('формула со скобками: Ca(OH)2 → гидроксид кальция', () => {
    const result = lookupSubstances('Ca(OH)2');
    expect(result.status).toBe('unique');
    if (result.status === 'unique') expect(result.substance.id).toBe('caoh2');
  });

  it('неизвестная формула → честный отказ (P1)', () => {
    expect(lookupSubstances('XeF4').status).toBe('notFound');
    expect(lookupSubstances('').status).toBe('notFound');
  });

  it('несколько веществ с одним составом → изомеры (DR-6)', () => {
    const stub = (id: string): Substance => ({
      id,
      formula: 'C2H6O',
      name: id,
      molarMass: 46,
      structure: { atoms: [], bonds: [] },
    });
    const result = lookupSubstances('C2H6O', [stub('ethanol'), stub('dimethyl-ether')]);
    expect(result.status).toBe('isomers');
    if (result.status === 'isomers') {
      expect(result.substances.map((s) => s.id)).toEqual(['ethanol', 'dimethyl-ether']);
    }
  });
});
