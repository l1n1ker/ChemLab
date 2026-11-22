// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from 'vitest';
import { countElements, hillFormula, massFractions, molarMass } from './chemistry';

function counts(entries: [string, number][]): Map<string, number> {
  return new Map(entries);
}

describe('hillFormula — формула по системе Хилла (FR-6)', () => {
  it('вода: H₂O', () => {
    expect(hillFormula(counts([['H', 2], ['O', 1]]))).toBe('H2O');
  });

  it('метан: углерод первый, затем водород', () => {
    expect(hillFormula(counts([['H', 4], ['C', 1]]))).toBe('CH4');
  });

  it('CO₂: углерод первый, кислород по алфавиту после', () => {
    expect(hillFormula(counts([['O', 2], ['C', 1]]))).toBe('CO2');
  });

  it('без углерода — строго по алфавиту (H₂O₂ → H2O2)', () => {
    expect(hillFormula(counts([['O', 2], ['H', 2]]))).toBe('H2O2');
  });

  it('одиночный атом без индекса', () => {
    expect(hillFormula(counts([['O', 1]]))).toBe('O');
  });
});

describe('molarMass — молярная масса (SPEC.md 6.2)', () => {
  it('US-1: вода = 18,015 г/моль', () => {
    expect(molarMass(counts([['H', 2], ['O', 1]]))).toBeCloseTo(18.015, 3);
  });

  it('метан = 16,043 г/моль', () => {
    expect(molarMass(counts([['C', 1], ['H', 4]]))).toBeCloseTo(16.043, 3);
  });

  it('CO₂ = 44,009 г/моль', () => {
    expect(molarMass(counts([['C', 1], ['O', 2]]))).toBeCloseTo(44.009, 3);
  });
});

describe('massFractions — массовые доли (SPEC.md 6.2)', () => {
  it('US-1: вода — H 11,2 %, O 88,8 %', () => {
    const fractions = massFractions(counts([['H', 2], ['O', 1]]));
    const h = fractions.find((f) => f.element === 'H')!;
    const o = fractions.find((f) => f.element === 'O')!;
    expect(h.percent).toBeCloseTo(11.2, 1);
    expect(o.percent).toBeCloseTo(88.8, 1);
    expect(h.count).toBe(2);
    expect(o.count).toBe(1);
  });

  it('сумма долей = 100 %', () => {
    const fractions = massFractions(counts([['C', 1], ['H', 4]]));
    const total = fractions.reduce((sum, f) => sum + f.percent, 0);
    expect(total).toBeCloseTo(100, 6);
  });
});

describe('countElements', () => {
  it('считает атомы по символам', () => {
    expect(countElements(['H', 'O', 'H'])).toEqual(new Map([['H', 2], ['O', 1]]));
  });
});
