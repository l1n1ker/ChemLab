// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from 'vitest';
import { LabStore, deriveMolecules } from './labStore';
import { rejectionMessage } from '../i18n/rejectionMessage';

describe('DR-1/FR-4: создание связей и объединение в молекулу', () => {
  it('US-1: O + 2H, связи O–H и O–H → одна молекула из трёх атомов', () => {
    const lab = new LabStore();
    const o = lab.addAtom('O', { x: 100, y: 100 });
    const h1 = lab.addAtom('H', { x: 40, y: 100 });
    const h2 = lab.addAtom('H', { x: 160, y: 100 });

    expect(lab.createBond(o, h1, 1).ok).toBe(true);
    expect(lab.createBond(o, h2, 1).ok).toBe(true);

    const molecules = deriveMolecules(lab.getSnapshot());
    expect(molecules).toHaveLength(1);
    expect(molecules[0].atomIds).toHaveLength(3);
    expect(molecules[0].formula).toBe('H2O');
    expect(molecules[0].molarMass).toBeCloseTo(18.015, 3);
    expect(molecules[0].substance?.name).toBe('Вода');
    expect(molecules[0].isHypothetical).toBe(false);
  });
});

describe('DR-1/FR-5: отказ при нарушении валентности с объяснением', () => {
  it('FR-5: у H уже есть связь, вторая отклоняется — «Водород одновалентен»', () => {
    const lab = new LabStore();
    const o = lab.addAtom('O', { x: 100, y: 100 });
    const h = lab.addAtom('H', { x: 40, y: 100 });
    const c = lab.addAtom('C', { x: 200, y: 100 });

    expect(lab.createBond(o, h, 1).ok).toBe(true);
    const result = lab.createBond(h, c, 1);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.rejection.code).toBe('monovalent');
      expect(rejectionMessage(result.rejection)).toBe('Водород одновалентен');
    }
    // Связь не создана: на столе осталось две молекулы (H–O и C).
    expect(deriveMolecules(lab.getSnapshot())).toHaveLength(2);
  });

  it('US-1 (выход M0): третий H к кислороду воды отклоняется', () => {
    const lab = new LabStore();
    const o = lab.addAtom('O', { x: 100, y: 100 });
    const h1 = lab.addAtom('H', { x: 40, y: 100 });
    const h2 = lab.addAtom('H', { x: 160, y: 100 });
    const h3 = lab.addAtom('H', { x: 100, y: 40 });
    lab.createBond(o, h1, 1);
    lab.createBond(o, h2, 1);

    const result = lab.createBond(o, h3, 1);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(rejectionMessage(result.rejection)).toBe(
        'У атома O уже заняты все валентности (2 из 2)',
      );
    }
  });

  it('DR-1: двойная связь к H невозможна', () => {
    const lab = new LabStore();
    const o = lab.addAtom('O', { x: 0, y: 0 });
    const h = lab.addAtom('H', { x: 50, y: 0 });
    const result = lab.createBond(o, h, 2);
    expect(result.ok).toBe(false);
  });

  it('нельзя соединить атом с самим собой', () => {
    const lab = new LabStore();
    const o = lab.addAtom('O', { x: 0, y: 0 });
    const result = lab.createBond(o, o, 1);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.rejection.code).toBe('same-atom');
  });
});

describe('DR-3: повторная связь повышает кратность', () => {
  it('O–O, ещё раз O–O → двойная связь (O₂)', () => {
    const lab = new LabStore();
    const o1 = lab.addAtom('O', { x: 0, y: 0 });
    const o2 = lab.addAtom('O', { x: 60, y: 0 });

    lab.createBond(o1, o2, 1);
    expect(lab.createBond(o1, o2, 1).ok).toBe(true);

    const bonds = Object.values(lab.getSnapshot().bonds);
    expect(bonds).toHaveLength(1);
    expect(bonds[0].order).toBe(2);
    expect(deriveMolecules(lab.getSnapshot())[0].substance?.id).toBe('o2');
  });

  it('кратность выше тройной отклоняется', () => {
    const lab = new LabStore();
    const c1 = lab.addAtom('C', { x: 0, y: 0 });
    const c2 = lab.addAtom('C', { x: 60, y: 0 });

    lab.createBond(c1, c2, 2);
    const result = lab.createBond(c1, c2, 2);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.rejection.code).toBe('order-overflow');
  });
});

describe('DR-5: различение «некаталожное корректное» и «некорректное»', () => {
  it('валентно-корректное некаталожное соединение создаётся и помечается гипотетическим', () => {
    const lab = new LabStore();
    const c = lab.addAtom('C', { x: 0, y: 0 });
    const h1 = lab.addAtom('H', { x: 50, y: 0 });
    const h2 = lab.addAtom('H', { x: -50, y: 0 });
    const h3 = lab.addAtom('H', { x: 0, y: 50 });
    lab.createBond(c, h1, 1);
    lab.createBond(c, h2, 1);
    lab.createBond(c, h3, 1);

    const molecules = deriveMolecules(lab.getSnapshot());
    const ch3 = molecules.find((m) => m.formula === 'CH3')!;
    expect(ch3.substance).toBeNull();
    expect(ch3.isHypothetical).toBe(true);
  });

  it('валентно-некорректная связь запрещена (пятый H к углероду)', () => {
    const lab = new LabStore();
    const c = lab.addAtom('C', { x: 0, y: 0 });
    const hs = [0, 1, 2, 3, 4].map((i) => lab.addAtom('H', { x: 50 * (i + 1), y: 0 }));
    for (let i = 0; i < 4; i++) {
      expect(lab.createBond(c, hs[i], 1).ok).toBe(true);
    }
    const result = lab.createBond(c, hs[4], 1);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.rejection.element).toBe('C');
  });
});

describe('FR-7: разрыв связи', () => {
  it('молекула распадается на две независимые части, свойства пересчитываются', () => {
    const lab = new LabStore();
    const o = lab.addAtom('O', { x: 100, y: 100 });
    const h1 = lab.addAtom('H', { x: 40, y: 100 });
    const h2 = lab.addAtom('H', { x: 160, y: 100 });
    lab.createBond(o, h1, 1);
    lab.createBond(o, h2, 1);

    const water = deriveMolecules(lab.getSnapshot());
    expect(water).toHaveLength(1);

    const bondId = water[0].bondIds[0];
    lab.breakBond(bondId);

    const parts = deriveMolecules(lab.getSnapshot());
    expect(parts).toHaveLength(2);
    const formulas = parts.map((m) => m.formula).sort();
    expect(formulas).toEqual(['H', 'HO']);
  });
});

describe('FR-1: магазин неисчерпаем', () => {
  it('атомы добавляются неограниченно', () => {
    const lab = new LabStore();
    for (let i = 0; i < 10; i++) {
      lab.addAtom('O', { x: i * 10, y: 0 });
    }
    expect(Object.keys(lab.getSnapshot().atoms)).toHaveLength(10);
  });
});

describe('Выбор молекулы', () => {
  it('выбор по любому атому выделяет всю молекулу', () => {
    const lab = new LabStore();
    const o = lab.addAtom('O', { x: 100, y: 100 });
    const h1 = lab.addAtom('H', { x: 40, y: 100 });
    const h2 = lab.addAtom('H', { x: 160, y: 100 });
    lab.createBond(o, h1, 1);
    lab.createBond(o, h2, 1);

    lab.selectMoleculeOf(h2);
    const state = lab.getSnapshot();
    const molecules = deriveMolecules(state);
    expect(state.selectedMoleculeId).toBe(molecules[0].id);
  });
});
