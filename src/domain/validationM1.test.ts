// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from 'vitest';
import { LabStore, deriveMolecules } from './labStore';

/**
 * DR-2 (v0.6): минимальная покрывающая валентность с автоэскалацией.
 * DR-4 (v0.6): ионные связи — явный тип, без кратности.
 */

describe('DR-2: мультивалентность с автоэскалацией (сера 2→4→6)', () => {
  function sulfurWithOxygens(orders: (1 | 2)[]) {
    const lab = new LabStore();
    const s = lab.addAtom('S', { x: 0, y: 0 });
    const results = orders.map((order, i) => {
      const o = lab.addAtom('O', { x: 60 * (i + 1), y: 0 });
      return lab.createBond(s, o, order);
    });
    return { lab, results };
  }

  it('H₂S: сера двухвалентна', () => {
    const lab = new LabStore();
    const s = lab.addAtom('S', { x: 0, y: 0 });
    const h1 = lab.addAtom('H', { x: 50, y: 0 });
    const h2 = lab.addAtom('H', { x: -50, y: 0 });
    expect(lab.createBond(s, h1, 1).ok).toBe(true);
    expect(lab.createBond(s, h2, 1).ok).toBe(true);
    expect(deriveMolecules(lab.getSnapshot())[0].substance?.id).toBe('h2s');
  });

  it('SO₂: эскалация до валентности 4 (две двойные связи)', () => {
    const { results, lab } = sulfurWithOxygens([2, 2]);
    expect(results.every((r) => r.ok)).toBe(true);
    expect(deriveMolecules(lab.getSnapshot())[0].substance?.id).toBe('so2');
  });

  it('SO₃: эскалация до валентности 6', () => {
    const { results, lab } = sulfurWithOxygens([2, 2, 2]);
    expect(results.every((r) => r.ok)).toBe(true);
    expect(deriveMolecules(lab.getSnapshot())[0].substance?.id).toBe('so3');
  });

  it('сверх максимальной валентности 6 — отказ', () => {
    const { results } = sulfurWithOxygens([2, 2, 2, 1]);
    expect(results[3].ok).toBe(false);
    if (!results[3].ok) {
      expect(results[3].rejection.code).toBe('valence-exceeded');
      expect(results[3].rejection.element).toBe('S');
      expect(results[3].rejection.max).toBe(6);
    }
  });
});

describe('DR-4: ионные связи', () => {
  it('Na + Cl ионная связь → хлорид натрия', () => {
    const lab = new LabStore();
    const na = lab.addAtom('Na', { x: 0, y: 0 });
    const cl = lab.addAtom('Cl', { x: 60, y: 0 });
    expect(lab.createBond(na, cl, 1, 'ionic').ok).toBe(true);
    expect(deriveMolecules(lab.getSnapshot())[0].substance?.id).toBe('nacl');
  });

  it('ковалентная Na–Cl ≠ NaCl из каталога (ионность — часть структуры, DR-6)', () => {
    const lab = new LabStore();
    const na = lab.addAtom('Na', { x: 0, y: 0 });
    const cl = lab.addAtom('Cl', { x: 60, y: 0 });
    lab.createBond(na, cl, 1);
    const molecule = deriveMolecules(lab.getSnapshot())[0];
    expect(molecule.substance).toBeNull();
    expect(molecule.isHypothetical).toBe(true);
  });

  it('ионная связь не дублируется и не смешивается с ковалентной', () => {
    const lab = new LabStore();
    const na = lab.addAtom('Na', { x: 0, y: 0 });
    const cl = lab.addAtom('Cl', { x: 60, y: 0 });
    lab.createBond(na, cl, 1, 'ionic');

    const again = lab.createBond(na, cl, 1, 'ionic');
    expect(again.ok).toBe(false);
    if (!again.ok) expect(again.rejection.code).toBe('ionic-exists');

    const covalent = lab.createBond(na, cl, 1);
    expect(covalent.ok).toBe(false);
    if (!covalent.ok) expect(covalent.rejection.code).toBe('bond-kind-mismatch');
  });

  it('ионная связь расходует по 1 валентности: NaOH = Na–O ионная + O–H ковалентная', () => {
    const lab = new LabStore();
    const na = lab.addAtom('Na', { x: 0, y: 0 });
    const o = lab.addAtom('O', { x: 60, y: 0 });
    const h = lab.addAtom('H', { x: 120, y: 0 });
    lab.createBond(na, o, 1, 'ionic');
    expect(lab.createBond(o, h, 1).ok).toBe(true);
    expect(deriveMolecules(lab.getSnapshot())[0].substance?.id).toBe('naoh');
  });

  it('Fe₂O₃: два Fe(III) и три O, шесть ионных связей', () => {
    const lab = new LabStore();
    const fe1 = lab.addAtom('Fe', { x: 0, y: 0 });
    const fe2 = lab.addAtom('Fe', { x: 200, y: 0 });
    const oxygens = [0, 1, 2].map((i) => lab.addAtom('O', { x: 100, y: 60 * i }));
    for (const o of oxygens) {
      lab.createBond(fe1, o, 1, 'ionic');
      lab.createBond(fe2, o, 1, 'ionic');
    }
    const molecule = deriveMolecules(lab.getSnapshot())[0];
    expect(molecule.substance?.id).toBe('fe2o3');
    expect(molecule.formula).toBe('Fe2O3');
  });

  it('CaCO₃: карбонат-ион + ионные связи к кальцию', () => {
    const lab = new LabStore();
    const ca = lab.addAtom('Ca', { x: 0, y: 0 });
    const c = lab.addAtom('C', { x: 100, y: 0 });
    const oDouble = lab.addAtom('O', { x: 170, y: 0 });
    const o1 = lab.addAtom('O', { x: 100, y: 70 });
    const o2 = lab.addAtom('O', { x: 100, y: -70 });
    lab.createBond(c, oDouble, 2);
    lab.createBond(c, o1, 1);
    lab.createBond(c, o2, 1);
    lab.createBond(ca, o1, 1, 'ionic');
    lab.createBond(ca, o2, 1, 'ionic');
    expect(deriveMolecules(lab.getSnapshot())[0].substance?.id).toBe('caco3');
  });
});
