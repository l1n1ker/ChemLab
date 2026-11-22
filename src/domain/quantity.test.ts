// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from 'vitest';
import {
  AVOGADRO,
  massFromMoles,
  molesFromMass,
  molesFromMolecules,
  molesFromVolume,
  moleculesFromMoles,
  volumeFromMoles,
} from './quantity';

describe('FR-8: конвертер количества (SPEC.md 6.2)', () => {
  it('Given выбрана H₂O, When масса 36 г, Then 2 моль и ≈1,204·10²⁴ молекул', () => {
    const moles = molesFromMass(36, 18.015);
    expect(moles).toBeCloseTo(2, 2);
    const molecules = moleculesFromMoles(moles);
    expect(molecules / 1e24).toBeCloseTo(1.204, 2);
    expect(molecules).toBeCloseTo(moles * AVOGADRO, 0);
  });

  it('Given CO₂ (газ), When 3 моль, Then объём 67,2 л (Vm = 22,4)', () => {
    expect(volumeFromMoles(3)).toBeCloseTo(67.2, 6);
  });

  it('обратный счёт: объём → моли → граммы', () => {
    const moles = molesFromVolume(44.8);
    expect(moles).toBeCloseTo(2, 6);
    expect(massFromMoles(moles, 44.009)).toBeCloseTo(88.018, 3);
  });

  it('число молекул → моли', () => {
    expect(molesFromMolecules(AVOGADRO)).toBeCloseTo(1, 9);
  });

  it('круговой пересчёт масса → моли → масса', () => {
    const mass = 7.5;
    expect(massFromMoles(molesFromMass(mass, 18.015), 18.015)).toBeCloseTo(mass, 9);
  });
});
