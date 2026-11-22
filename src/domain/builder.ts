// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import { getSubstance } from './data/substances';
import type { AtomInstance, Bond, Vec2 } from './types';

/**
 * Построить молекулу из записи каталога — публичная функция Domain Core
 * (крюк SPEC.md раздел 9, v0.5): используется магазином готовых веществ (FR-2)
 * и конструктором по формуле (FR-25, M2).
 *
 * 2D-раскладка: атомы по спирали вокруг точки размещения — стол не обязан
 * отражать геометрию, 3D-инспектор построит справочную сам (P3).
 */
export function buildMoleculeFromSubstance(
  substanceId: string,
  origin: Vec2,
  makeId: () => string = () => crypto.randomUUID(),
): { atoms: AtomInstance[]; bonds: Bond[] } {
  const substance = getSubstance(substanceId);
  const step = 70;

  const atoms: AtomInstance[] = substance.structure.atoms.map((structureAtom, i) => {
    // Спираль: первый атом в центре, остальные — по окружностям.
    const ring = Math.ceil(i / 6);
    const angle = i === 0 ? 0 : (2 * Math.PI * ((i - 1) % 6)) / 6 + ring * 0.5;
    return {
      id: makeId(),
      element: structureAtom.element,
      position: {
        x: origin.x + ring * step * Math.cos(angle),
        y: origin.y + ring * step * Math.sin(angle),
      },
    };
  });

  const bonds: Bond[] = substance.structure.bonds.map((structureBond) => ({
    id: makeId(),
    atomIds: [atoms[structureBond.atoms[0]].id, atoms[structureBond.atoms[1]].id],
    order: structureBond.order,
    kind: structureBond.kind,
  }));

  return { atoms, bonds };
}
