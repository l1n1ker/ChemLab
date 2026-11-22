// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import { countElements, hillFormula, massFractions, molarMass } from './chemistry';
import { buildMoleculeFromSubstance } from './builder';
import { findCatalogMatch } from './matching';
import { connectedComponents } from './moleculeGraph';
import { oxidationStatesByElement } from './oxidation';
import type { AtomInstance, Bond, BondKind, BondOrder, MoleculeView, Vec2 } from './types';
import { checkBond, checkBondUpdate, type BondRejection } from './validation';

/**
 * LabStore — единственная точка входа UI в Domain Core (SPEC.md, раздел 9):
 * UI отправляет команды и подписывается на состояние; химия не покидает домен.
 */

export interface LabState {
  atoms: Record<string, AtomInstance>;
  bonds: Record<string, Bond>;
  /** Id выбранной молекулы (стабильный id компоненты). */
  selectedMoleculeId: string | null;
  /** Последний отказ валидации для показа в UI (FR-5). */
  lastRejection: BondRejection | null;
}

export type CommandResult = { ok: true } | { ok: false; rejection: BondRejection };

type Listener = () => void;

function newId(): string {
  return crypto.randomUUID();
}

export class LabStore {
  private state: LabState = {
    atoms: {},
    bonds: {},
    selectedMoleculeId: null,
    lastRejection: null,
  };
  private listeners = new Set<Listener>();

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): LabState => this.state;

  private setState(next: LabState): void {
    this.state = next;
    for (const listener of this.listeners) listener();
  }

  /** FR-1: атом из магазина на стол; магазин неисчерпаем. */
  addAtom(element: string, position: Vec2): string {
    const atom: AtomInstance = { id: newId(), element, position };
    this.setState({
      ...this.state,
      atoms: { ...this.state.atoms, [atom.id]: atom },
      lastRejection: null,
    });
    return atom.id;
  }

  /** FR-2: готовое вещество из магазина на стол как целая молекула. */
  addSubstance(substanceId: string, position: Vec2): void {
    const { atoms, bonds } = buildMoleculeFromSubstance(substanceId, position, newId);
    const atomsRecord = { ...this.state.atoms };
    for (const atom of atoms) atomsRecord[atom.id] = atom;
    const bondsRecord = { ...this.state.bonds };
    for (const bond of bonds) bondsRecord[bond.id] = bond;
    this.setState({ ...this.state, atoms: atomsRecord, bonds: bondsRecord, lastRejection: null });
  }

  /** Перемещение атома вместе со всей его молекулой (связная группа — единый объект, 4.2). */
  moveMoleculeOf(atomId: string, delta: Vec2): void {
    const component = connectedComponents(this.state.atoms, this.state.bonds).find((c) =>
      c.atomIds.includes(atomId),
    );
    if (!component) return;
    const atoms = { ...this.state.atoms };
    for (const id of component.atomIds) {
      const atom = atoms[id];
      atoms[id] = { ...atom, position: { x: atom.position.x + delta.x, y: atom.position.y + delta.y } };
    }
    this.setState({ ...this.state, atoms });
  }

  /**
   * FR-4/FR-5: создание связи с выбором кратности или типа «ионная» (DR-4);
   * при нарушении валентности — отказ с типизированной причиной.
   * DR-3: повторная ковалентная связь той же пары повышает кратность существующей.
   */
  createBond(aId: string, bId: string, order: BondOrder, kind: BondKind = 'covalent'): CommandResult {
    const check = checkBond(this.state.atoms, this.state.bonds, aId, bId, order, kind);
    if (!check.ok) {
      this.setState({ ...this.state, lastRejection: check.rejection });
      return { ok: false, rejection: check.rejection };
    }

    let bonds: Record<string, Bond>;
    if (check.existingBond) {
      const existing = check.existingBond;
      bonds = {
        ...this.state.bonds,
        [existing.id]: { ...existing, order: (existing.order + order) as BondOrder },
      };
    } else {
      const bond: Bond = { id: newId(), atomIds: [aId, bId], order, kind };
      bonds = { ...this.state.bonds, [bond.id]: bond };
    }
    this.setState({ ...this.state, bonds, lastRejection: null });
    return { ok: true };
  }

  /** FR-7 (v0.11): смена кратности/типа существующей связи из контекстного меню. */
  changeBond(bondId: string, order: BondOrder, kind: BondKind): CommandResult {
    const check = checkBondUpdate(this.state.atoms, this.state.bonds, bondId, order, kind);
    if (!check.ok) {
      this.setState({ ...this.state, lastRejection: check.rejection });
      return { ok: false, rejection: check.rejection };
    }
    const bond = this.state.bonds[bondId];
    const updated: Bond = { ...bond, order: kind === 'ionic' ? 1 : order, kind };
    this.setState({
      ...this.state,
      bonds: { ...this.state.bonds, [bondId]: updated },
      lastRejection: null,
    });
    return { ok: true };
  }

  /** FR-7: разрыв связи; молекула распадается на независимые части. */
  breakBond(bondId: string): void {
    if (!this.state.bonds[bondId]) return;
    const bonds = { ...this.state.bonds };
    delete bonds[bondId];
    this.setState({ ...this.state, bonds, lastRejection: null });
  }

  /** FR-34 (приём FR-27): разобрать молекулу на атомы — удалить все её связи. */
  dismantleMolecule(moleculeId: string): void {
    const component = connectedComponents(this.state.atoms, this.state.bonds).find(
      (c) => c.id === moleculeId,
    );
    if (!component) return;
    const bonds = { ...this.state.bonds };
    for (const id of component.bondIds) delete bonds[id];
    this.setState({ ...this.state, bonds, lastRejection: null });
  }

  /** Выбор молекулы по любому её атому; null — снять выбор. */
  selectMoleculeOf(atomId: string | null): void {
    if (atomId === null) {
      this.setState({ ...this.state, selectedMoleculeId: null });
      return;
    }
    const component = connectedComponents(this.state.atoms, this.state.bonds).find((c) =>
      c.atomIds.includes(atomId),
    );
    this.setState({
      ...this.state,
      selectedMoleculeId: component?.id ?? null,
    });
  }

  clearRejection(): void {
    if (this.state.lastRejection === null) return;
    this.setState({ ...this.state, lastRejection: null });
  }
}

/** Производные молекулы с вычисленными свойствами (SPEC.md 6.1, 6.2). */
export function deriveMolecules(state: LabState): MoleculeView[] {
  return connectedComponents(state.atoms, state.bonds).map((component) => {
    const atoms = component.atomIds.map((id) => state.atoms[id]);
    const bonds = component.bondIds.map((id) => state.bonds[id]);
    const counts = countElements(atoms.map((a) => a.element));
    const match = findCatalogMatch(atoms, bonds);
    return {
      id: component.id,
      atomIds: component.atomIds,
      bondIds: component.bondIds,
      formula: hillFormula(counts),
      molarMass: molarMass(counts),
      fractions: massFractions(counts),
      substance: match?.substance ?? null,
      isHypothetical: match === null,
      oxidationStates: oxidationStatesByElement(atoms, bonds),
    };
  });
}
