// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from 'vitest';
import { LabStore, deriveMolecules } from './labStore';
import { findReaction, planRun, suggestReactions } from './reactionEngine';

function molecules(entries: [string, number][]): { id: string; substanceId: string }[] {
  const result: { id: string; substanceId: string }[] = [];
  let seq = 0;
  for (const [substanceId, count] of entries) {
    for (let i = 0; i < count; i++) {
      seq += 1;
      result.push({ id: `m${seq}`, substanceId });
    }
  }
  return result;
}

describe('FR-14: распознавание реакции по набору реагентов независимо от коэффициентов', () => {
  it('H₂ и O₂ в любых количествах → «2H2 + O2 → 2H2O»', () => {
    expect(findReaction(['h2', 'o2'])?.id).toBe('h2-o2');
    expect(findReaction(['o2', 'h2'])?.id).toBe('h2-o2');
  });

  it('неизвестный набор → null', () => {
    expect(findReaction(['nacl', 'h2o'])).toBeNull();
  });

  it('лишнее вещество в зоне → реакция не распознаётся (строгое совпадение набора)', () => {
    expect(findReaction(['h2', 'o2', 'n2'])).toBeNull();
  });
});

describe('FR-15: стехиометрия с лимитирующим реагентом', () => {
  it('Given 3 H₂ и 1 O₂, Then получено 2 H₂O (36 г), 1 H₂ в избытке, O₂ — лимитирующий', () => {
    const result = planRun(molecules([['h2', 3], ['o2', 1]]));
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const { report } = result;
    expect(report.limitingSubstanceId).toBe('o2');

    const h2o = report.produced.find((e) => e.substanceId === 'h2o')!;
    expect(h2o.moles).toBe(2);
    expect(h2o.grams).toBeCloseTo(36, 0);

    const consumedH2 = report.consumed.find((e) => e.substanceId === 'h2')!;
    expect(consumedH2.moles).toBe(2);
    expect(report.excess).toHaveLength(1);
    expect(report.excess[0].substanceId).toBe('h2');
    expect(report.excess[0].moles).toBe(1);

    expect(result.consumeMoleculeIds).toHaveLength(3); // 2 H₂ + 1 O₂
    expect(result.productSubstanceIds).toEqual(['h2o', 'h2o']);
  });

  it('недостаточно реагентов (1 H₂ + 1 O₂): отказ с перечнем недостающих', () => {
    const result = planRun(molecules([['h2', 1], ['o2', 1]]));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.missing).toEqual([{ substanceId: 'h2', need: 2, have: 1 }]);
  });
});

describe('FR-16: подсказки при отсутствии реакции', () => {
  it('только H₂ в зоне → предлагается «2H2 + O2 → 2H2O», не хватает O₂', () => {
    const suggestions = suggestReactions(['h2']);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].reaction.id).toBe('h2-o2');
    expect(suggestions[0].missingSubstanceIds).toEqual(['o2']);
  });
});

describe('FR-13/FR-17: запуск на столе — продукты становятся реальными молекулами', () => {
  it('2 H₂ + 1 O₂ на столе → 2 молекулы H₂O, реагенты изъяты', () => {
    const lab = new LabStore();
    lab.addSubstance('h2', { x: 60, y: 470 });
    lab.addSubstance('h2', { x: 140, y: 470 });
    lab.addSubstance('o2', { x: 220, y: 470 });

    const before = deriveMolecules(lab.getSnapshot());
    expect(before).toHaveLength(3);

    const result = lab.runReaction(
      before.map((m) => m.id),
      { origin: { x: 60, y: 500 }, width: 340 },
    );

    expect(result.ok).toBe(true);
    const after = deriveMolecules(lab.getSnapshot());
    expect(after).toHaveLength(2);
    for (const m of after) {
      expect(m.substance?.id).toBe('h2o');
    }
    expect(Object.keys(lab.getSnapshot().atoms)).toHaveLength(6);
  });

  it('избыток остаётся на столе', () => {
    const lab = new LabStore();
    lab.addSubstance('h2', { x: 60, y: 470 });
    lab.addSubstance('h2', { x: 140, y: 470 });
    lab.addSubstance('h2', { x: 220, y: 470 });
    lab.addSubstance('o2', { x: 300, y: 470 });

    const before = deriveMolecules(lab.getSnapshot());
    lab.runReaction(before.map((m) => m.id), { origin: { x: 60, y: 500 }, width: 340 });

    const after = deriveMolecules(lab.getSnapshot());
    expect(after.filter((m) => m.substance?.id === 'h2o')).toHaveLength(2);
    expect(after.filter((m) => m.substance?.id === 'h2')).toHaveLength(1); // избыток
  });

  it('FR-17 (v0.17): продукты разнесены — центроиды молекул не ближе 140 px', () => {
    const lab = new LabStore();
    lab.addSubstance('h2', { x: 60, y: 470 });
    lab.addSubstance('h2', { x: 140, y: 470 });
    lab.addSubstance('o2', { x: 220, y: 470 });

    const before = deriveMolecules(lab.getSnapshot());
    lab.runReaction(before.map((m) => m.id), { origin: { x: 60, y: 500 }, width: 340 });

    const state = lab.getSnapshot();
    const centroids = deriveMolecules(state).map((m) => {
      const points = m.atomIds.map((id) => state.atoms[id].position);
      return {
        x: points.reduce((s, p) => s + p.x, 0) / points.length,
        y: points.reduce((s, p) => s + p.y, 0) / points.length,
      };
    });
    expect(centroids).toHaveLength(2);
    const dx = Math.abs(centroids[0].x - centroids[1].x);
    const dy = Math.abs(centroids[0].y - centroids[1].y);
    expect(Math.max(dx, dy)).toBeGreaterThanOrEqual(140);
  });
});
