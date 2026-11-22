// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import { REACTIONS, type Reaction } from './data/reactions';
import { getSubstance } from './data/substances';

/**
 * Движок реакций (FR-13…17, SPEC.md 5.4).
 * Распознавание — по набору реагентов независимо от коэффициентов (FR-14);
 * стехиометрия с лимитирующим реагентом (FR-15); подсказки при отсутствии
 * реакции (FR-16). Условность стола: 1 молекула = 1 условная моль (v0.14).
 */

/** Молекула-участник: известна каталогу или нет (гипотетические не реагируют). */
export interface ReactionMolecule {
  id: string;
  substanceId: string | null;
}

export interface ReactionReportEntry {
  substanceId: string;
  name: string;
  formula: string;
  /** Условные моли = число молекул (v0.14). */
  moles: number;
  grams: number;
}

export interface ReactionReport {
  reaction: Reaction;
  consumed: ReactionReportEntry[];
  produced: ReactionReportEntry[];
  excess: ReactionReportEntry[];
  limitingSubstanceId: string;
}

export interface ReactionMissing {
  substanceId: string;
  need: number;
  have: number;
}

export interface ReactionSuggestion {
  reaction: Reaction;
  missingSubstanceIds: string[];
}

export type RunResult =
  | {
      ok: true;
      report: ReactionReport;
      /** Id молекул, которые движок изымает со стола. */
      consumeMoleculeIds: string[];
      /** Продукты для размещения: id вещества повторяется count раз. */
      productSubstanceIds: string[];
    }
  | { ok: false; missing: ReactionMissing[]; suggestions: ReactionSuggestion[] };

/** FR-14: реакция по точному набору различных реагентов (любые коэффициенты на столе). */
export function findReaction(substanceIds: string[]): Reaction | null {
  const set = new Set(substanceIds);
  for (const reaction of REACTIONS) {
    const reactantIds = Object.keys(reaction.reactants);
    if (reactantIds.length !== set.size) continue;
    if (reactantIds.every((id) => set.has(id))) return reaction;
  }
  return null;
}

/** FR-16: ближайшие реакции — наибольшее пересечение реагентов, список недостающих. */
export function suggestReactions(substanceIds: string[], limit = 3): ReactionSuggestion[] {
  const set = new Set(substanceIds);
  return REACTIONS.map((reaction) => {
    const missing = Object.keys(reaction.reactants).filter((id) => !set.has(id));
    const overlap = Object.keys(reaction.reactants).length - missing.length;
    return { reaction, missingSubstanceIds: missing, overlap };
  })
    .filter((s) => s.overlap > 0 && s.missingSubstanceIds.length > 0)
    .sort((a, b) => a.missingSubstanceIds.length - b.missingSubstanceIds.length || b.overlap - a.overlap)
    .slice(0, limit)
    .map(({ reaction, missingSubstanceIds }) => ({ reaction, missingSubstanceIds }));
}

function entry(substanceId: string, moles: number): ReactionReportEntry {
  const substance = getSubstance(substanceId);
  return {
    substanceId,
    name: substance.name,
    formula: substance.formula,
    moles,
    grams: moles * substance.molarMass,
  };
}

/** FR-15: план реакции — лимитирующий реагент, расход, продукты, избыток. */
export function planRun(molecules: ReactionMolecule[]): RunResult {
  const known = molecules.filter((m): m is ReactionMolecule & { substanceId: string } =>
    m.substanceId !== null,
  );
  const distinctIds = [...new Set(known.map((m) => m.substanceId))];
  const suggestions = suggestReactions(distinctIds);

  const reaction = findReaction(distinctIds);
  if (!reaction) {
    return { ok: false, missing: [], suggestions };
  }

  // Доступные молекулы по веществам.
  const available = new Map<string, string[]>();
  for (const m of known) {
    const list = available.get(m.substanceId) ?? [];
    list.push(m.id);
    available.set(m.substanceId, list);
  }

  // Лимитирующий реагент: минимальное отношение available / ν (не floor — иначе
  // 3 H₂ + 1 O₂ неверно даст H₂: floor(3/2) = floor(1/1)).
  let minRatio = Infinity;
  let limitingSubstanceId = '';
  for (const [substanceId, nu] of Object.entries(reaction.reactants)) {
    const count = available.get(substanceId)?.length ?? 0;
    const ratio = count / nu;
    if (ratio < minRatio) {
      minRatio = ratio;
      limitingSubstanceId = substanceId;
    }
  }
  const extent = Math.floor(minRatio);

  if (!Number.isFinite(extent) || extent === 0) {
    const missing: ReactionMissing[] = Object.entries(reaction.reactants)
      .map(([substanceId, nu]) => ({
        substanceId,
        need: nu,
        have: available.get(substanceId)?.length ?? 0,
      }))
      .filter((m) => m.have < m.need);
    return { ok: false, missing, suggestions };
  }

  const consumeMoleculeIds: string[] = [];
  const consumed: ReactionReportEntry[] = [];
  const excess: ReactionReportEntry[] = [];
  for (const [substanceId, nu] of Object.entries(reaction.reactants)) {
    const ids = available.get(substanceId)!;
    const used = nu * extent;
    consumeMoleculeIds.push(...ids.slice(0, used));
    consumed.push(entry(substanceId, used));
    if (ids.length > used) excess.push(entry(substanceId, ids.length - used));
  }
  // Гипотетические молекулы не участвуют и остаются на столе.

  const produced: ReactionReportEntry[] = [];
  const productSubstanceIds: string[] = [];
  for (const [substanceId, nu] of Object.entries(reaction.products)) {
    const count = nu * extent;
    produced.push(entry(substanceId, count));
    for (let i = 0; i < count; i++) productSubstanceIds.push(substanceId);
  }

  return {
    ok: true,
    report: { reaction, consumed, produced, excess, limitingSubstanceId },
    consumeMoleculeIds,
    productSubstanceIds,
  };
}
