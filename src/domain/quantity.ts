// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Конвертер количества (FR-8, SPEC.md 6.2):
 * моль ↔ граммы ↔ число молекул ↔ объём газа при н.у. (Vm = 22,4 л/моль, v0.6).
 */

export const AVOGADRO = 6.022e23;

/** Молярный объём газа при н.у., л/моль. */
export const MOLAR_VOLUME = 22.4;

export function molesFromMass(massGrams: number, molarMass: number): number {
  return massGrams / molarMass;
}

export function massFromMoles(moles: number, molarMass: number): number {
  return moles * molarMass;
}

export function moleculesFromMoles(moles: number): number {
  return moles * AVOGADRO;
}

export function molesFromMolecules(molecules: number): number {
  return molecules / AVOGADRO;
}

export function volumeFromMoles(moles: number): number {
  return moles * MOLAR_VOLUME;
}

export function molesFromVolume(volumeLiters: number): number {
  return volumeLiters / MOLAR_VOLUME;
}
