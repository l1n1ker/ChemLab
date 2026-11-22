// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from 'vitest';
import { buildMoleculeFromSubstance } from './builder';
import { findCatalogMatch } from './matching';
import { oxidationStatesByElement } from './oxidation';
import type { BondKind } from './types';

/**
 * Степени окисления (FR-6, v0.6) считаем на молекулах,
 * построенных из каталога buildMoleculeFromSubstance (крюк FR-25).
 */

function build(id: string) {
  return buildMoleculeFromSubstance(id, { x: 0, y: 0 }, (() => {
    let seq = 0;
    return () => `t${++seq}`;
  })());
}

function os(id: string): Map<string, number[]> {
  const { atoms, bonds } = build(id);
  return oxidationStatesByElement(atoms, bonds);
}

describe('Степени окисления (SPEC.md 6.2, v0.6)', () => {
  it('H₂O: H +1, O −2', () => {
    const states = os('h2o');
    expect(states.get('H')).toEqual([1]);
    expect(states.get('O')).toEqual([-2]);
  });

  it('CO₂: C +4, O −2', () => {
    const states = os('co2');
    expect(states.get('C')).toEqual([4]);
    expect(states.get('O')).toEqual([-2]);
  });

  it('CH₄: C −4, H +1', () => {
    const states = os('ch4');
    expect(states.get('C')).toEqual([-4]);
    expect(states.get('H')).toEqual([1]);
  });

  it('NaCl (ионная): Na +1, Cl −1', () => {
    const states = os('nacl');
    expect(states.get('Na')).toEqual([1]);
    expect(states.get('Cl')).toEqual([-1]);
  });

  it('Fe₂O₃: Fe +3, O −2', () => {
    const states = os('fe2o3');
    expect(states.get('Fe')).toEqual([3]);
    expect(states.get('O')).toEqual([-2]);
  });

  it('SO₃: S +6', () => {
    expect(os('so3').get('S')).toEqual([6]);
  });

  it('H₂: степень окисления 0 (связь между одинаковыми атомами)', () => {
    expect(os('h2').get('H')).toEqual([0]);
  });

  it('сумма степеней окисления = 0 для нейтральной молекулы (CaCO₃)', () => {
    const states = os('caco3');
    // Ca: +2, C: +4, три O по −2 → 2 + 4 − 6 = 0
    const total =
      states.get('Ca')![0] + states.get('C')![0] + 3 * states.get('O')![0];
    expect(total).toBe(0);
  });
});

describe('buildMoleculeFromSubstance — крюк FR-25 (v0.5), используется в FR-2', () => {
  it('построенная вода сразу распознаётся каталогом (структурный круговорот, DR-6)', () => {
    const { atoms, bonds } = build('h2o');
    expect(atoms).toHaveLength(3);
    expect(bonds).toHaveLength(2);
    expect(findCatalogMatch(atoms, bonds)?.substance.id).toBe('h2o');
  });

  it('идентификаторы атомов и связей уникальны', () => {
    const { atoms, bonds } = build('caco3');
    const ids = [...atoms.map((a) => a.id), ...bonds.map((b) => b.id)];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('ионный тип связи переносится из каталога', () => {
    const { bonds } = build('nacl');
    const kinds: BondKind[] = bonds.map((b) => b.kind);
    expect(kinds).toEqual(['ionic']);
  });
});
