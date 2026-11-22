// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Библиотека реакций M2 (SPEC.md 7.3, ≥15; v0.14).
 * Реагенты/продукты — id веществ каталога (идентификация структурная, DR-6).
 * type — школьный класс реакции (п. 14.5, v0.14).
 */

export type ReactionType =
  | 'combination'
  | 'decomposition'
  | 'substitution'
  | 'exchange'
  | 'combustion';

export interface Reaction {
  id: string;
  equation: string;
  type: ReactionType;
  /** id вещества → стехиометрический коэффициент. */
  reactants: Record<string, number>;
  products: Record<string, number>;
}

function reaction(
  id: string,
  equation: string,
  type: ReactionType,
  reactants: Record<string, number>,
  products: Record<string, number>,
): Reaction {
  return { id, equation, type, reactants, products };
}

export const REACTIONS: Reaction[] = [
  reaction('h2-o2', '2H2 + O2 → 2H2O', 'combination', { h2: 2, o2: 1 }, { h2o: 2 }),
  reaction('c-o2', 'C + O2 → CO2', 'combustion', { c: 1, o2: 1 }, { co2: 1 }),
  reaction('co-o2', '2CO + O2 → 2CO2', 'combustion', { co: 2, o2: 1 }, { co2: 2 }),
  reaction('ch4-o2', 'CH4 + 2O2 → CO2 + 2H2O', 'combustion', { ch4: 1, o2: 2 }, { co2: 1, h2o: 2 }),
  reaction('n2-h2', 'N2 + 3H2 → 2NH3', 'combination', { n2: 1, h2: 3 }, { nh3: 2 }),
  reaction('na-cl2', '2Na + Cl2 → 2NaCl', 'combination', { na: 2, cl2: 1 }, { nacl: 2 }),
  reaction('hcl-naoh', 'HCl + NaOH → NaCl + H2O', 'exchange', { hcl: 1, naoh: 1 }, { nacl: 1, h2o: 1 }),
  reaction('cao-h2o', 'CaO + H2O → Ca(OH)2', 'combination', { cao: 1, h2o: 1 }, { caoh2: 1 }),
  reaction('co2-caoh2', 'CO2 + Ca(OH)2 → CaCO3 + H2O', 'exchange', { co2: 1, caoh2: 1 }, { caco3: 1, h2o: 1 }),
  reaction('s-o2', 'S + O2 → SO2', 'combustion', { s: 1, o2: 1 }, { so2: 1 }),
  reaction('so2-o2', '2SO2 + O2 → 2SO3', 'combination', { so2: 2, o2: 1 }, { so3: 2 }),
  reaction('h2o2', '2H2O2 → 2H2O + O2', 'decomposition', { h2o2: 2 }, { h2o: 2, o2: 1 }),
  reaction('h2-cl2', 'H2 + Cl2 → 2HCl', 'combination', { h2: 1, cl2: 1 }, { hcl: 2 }),
  reaction('no-o2', '2NO + O2 → 2NO2', 'combination', { no: 2, o2: 1 }, { no2: 2 }),
  reaction('n2-o2', 'N2 + O2 → 2NO', 'combination', { n2: 1, o2: 1 }, { no: 2 }),
  reaction('fe-hcl', 'Fe + 2HCl → FeCl2 + H2', 'substitution', { fe: 1, hcl: 2 }, { fecl2: 1, h2: 1 }),
  reaction('cl2-kbr', 'Cl2 + 2KBr → 2KCl + Br2', 'substitution', { cl2: 1, kbr: 2 }, { kcl: 2, br2: 1 }),
];

export function getReaction(id: string): Reaction {
  const found = REACTIONS.find((r) => r.id === id);
  if (!found) throw new Error(`Неизвестная реакция: ${id}`);
  return found;
}
