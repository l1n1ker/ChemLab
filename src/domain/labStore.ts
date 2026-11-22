// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import { countElements, hillFormula, massFractions, molarMass } from './chemistry';
import { buildMoleculeFromSubstance } from './builder';
import { findCatalogMatch } from './matching';
import { connectedComponents } from './moleculeGraph';
import { oxidationStatesByElement } from './oxidation';
import { placeCart } from './placement';
import { planRun, type RunResult } from './reactionEngine';
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
  /** Исход последнего запуска реакции (FR-13…16). */
  reactionOutcome: RunResult | null;
  /** Зона реакции (FR-13, v0.15). */
  zone: ReactionZoneRect;
}

export type CommandResult = { ok: true } | { ok: false; rejection: BondRejection };

/** Зона реакции (FR-13, v0.15): геометрия хранится в состоянии стола. */
export interface ReactionZoneRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const DEFAULT_ZONE: ReactionZoneRect = { x: 16, y: 430, width: 400, height: 250 };

const ZONE_MIN_WIDTH = 200;
const ZONE_MIN_HEIGHT = 140;

/** Молекулы, чей центроид внутри зоны реакции — заморожены (FR-13, v0.15). */
export function frozenMoleculeIds(state: LabState): Set<string> {
  const zone = state.zone;
  const frozen = new Set<string>();
  for (const component of connectedComponents(state.atoms, state.bonds)) {
    const points = component.atomIds.map((id) => state.atoms[id].position);
    const cx = points.reduce((s, p) => s + p.x, 0) / points.length;
    const cy = points.reduce((s, p) => s + p.y, 0) / points.length;
    if (cx >= zone.x && cx <= zone.x + zone.width && cy >= zone.y && cy <= zone.y + zone.height) {
      frozen.add(component.id);
    }
  }
  return frozen;
}

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
    reactionOutcome: null,
    zone: { ...DEFAULT_ZONE },
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

  /** FR-13 (v0.15): перемещение зоны реакции. */
  moveZoneBy(delta: Vec2): void {
    const zone = { ...this.state.zone, x: this.state.zone.x + delta.x, y: this.state.zone.y + delta.y };
    this.setState({ ...this.state, zone });
  }

  /** FR-13 (v0.15): изменение размера зоны реакции. */
  resizeZone(width: number, height: number): void {
    const zone = {
      ...this.state.zone,
      width: Math.max(ZONE_MIN_WIDTH, width),
      height: Math.max(ZONE_MIN_HEIGHT, height),
    };
    this.setState({ ...this.state, zone });
  }

  /** Перемещение атома вместе со всей его молекулой (связная группа — единый объект, 4.2). */
  moveMoleculeOf(atomId: string, delta: Vec2): void {
    const component = connectedComponents(this.state.atoms, this.state.bonds).find((c) =>
      c.atomIds.includes(atomId),
    );
    if (!component) return;
    // FR-13 (v0.15): замороженные молекулы не перемещаются.
    if (frozenMoleculeIds(this.state).has(component.id)) return;
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
    const frozenRejection = this.frozenBondRejection(bondId);
    if (frozenRejection) return frozenRejection;
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

  /**
   * FR-13…17: запуск реакции. Израсходованные молекулы снимаются со стола,
   * продукты размещаются как реальные молекулы рядком в зоне реакции,
   * избыток остаётся. Исход доступен в state.reactionOutcome.
   */
  runReaction(moleculeIds: string[], area: { origin: Vec2; width: number }): RunResult {
    const molecules = deriveMolecules(this.state).filter((m) => moleculeIds.includes(m.id));
    const result = planRun(
      molecules.map((m) => ({ id: m.id, substanceId: m.substance?.id ?? null })),
    );

    let { atoms, bonds } = this.state;
    if (result.ok) {
      const consumed = new Set(result.consumeMoleculeIds);
      const components = connectedComponents(atoms, bonds).filter((c) => consumed.has(c.id));
      atoms = { ...atoms };
      bonds = { ...bonds };
      for (const component of components) {
        for (const atomId of component.atomIds) delete atoms[atomId];
        for (const bondId of component.bondIds) delete bonds[bondId];
      }
      // FR-17: продукты появляются на столе как реальные молекулы.
      const occupied = Object.values(atoms).map((a) => a.position);
      const positions = placeCart(
        result.productSubstanceIds.map(() => ({ width: 200 })),
        occupied,
        area.width,
        area.origin,
      );
      result.productSubstanceIds.forEach((substanceId, i) => {
        const built = buildMoleculeFromSubstance(substanceId, positions[i], newId);
        for (const atom of built.atoms) atoms[atom.id] = atom;
        for (const bond of built.bonds) bonds[bond.id] = bond;
      });
    }

    this.setState({ ...this.state, atoms, bonds, reactionOutcome: result });
    return result;
  }

  clearReactionOutcome(): void {
    if (this.state.reactionOutcome === null) return;
    this.setState({ ...this.state, reactionOutcome: null });
  }

  /** FR-34 (v0.12): копия молекулы на столе — структурный дубликат со сдвигом. */
  cloneMolecule(moleculeId: string, offset: Vec2 = { x: 70, y: 50 }): void {
    const component = connectedComponents(this.state.atoms, this.state.bonds).find(
      (c) => c.id === moleculeId,
    );
    if (!component) return;

    const idMap = new Map<string, string>();
    const atoms = { ...this.state.atoms };
    for (const atomId of component.atomIds) {
      const source = this.state.atoms[atomId];
      const id = newId();
      idMap.set(atomId, id);
      atoms[id] = {
        id,
        element: source.element,
        position: { x: source.position.x + offset.x, y: source.position.y + offset.y },
      };
    }
    const bonds = { ...this.state.bonds };
    for (const bondId of component.bondIds) {
      const source = this.state.bonds[bondId];
      const id = newId();
      bonds[id] = {
        id,
        atomIds: [idMap.get(source.atomIds[0])!, idMap.get(source.atomIds[1])!],
        order: source.order,
        kind: source.kind,
      };
    }
    this.setState({ ...this.state, atoms, bonds, lastRejection: null });
  }

  /** FR-7: разрыв связи; молекула распадается на независимые части. */
  breakBond(bondId: string): void {
    if (!this.state.bonds[bondId]) return;
    // FR-13 (v0.15): связи замороженных молекул не разрываются.
    if (this.frozenBondRejection(bondId)) return;
    const bonds = { ...this.state.bonds };
    delete bonds[bondId];
    this.setState({ ...this.state, bonds, lastRejection: null });
  }

  /** FR-13 (v0.15): связь принадлежит замороженной молекуле → отказ с объяснением. */
  private frozenBondRejection(bondId: string): CommandResult | null {
    const bond = this.state.bonds[bondId];
    if (!bond) return null;
    const frozen = frozenMoleculeIds(this.state);
    if (frozen.size === 0) return null;
    const component = connectedComponents(this.state.atoms, this.state.bonds).find((c) =>
      c.bondIds.includes(bondId),
    );
    if (!component || !frozen.has(component.id)) return null;
    const result: CommandResult = { ok: false, rejection: { code: 'frozen-molecule' } };
    this.setState({ ...this.state, lastRejection: { code: 'frozen-molecule' } });
    return result;
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
