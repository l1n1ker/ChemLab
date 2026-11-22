// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import { useState } from 'react';
import {
  massFromMoles,
  molesFromMass,
  molesFromMolecules,
  molesFromVolume,
  moleculesFromMoles,
  volumeFromMoles,
} from '../domain/quantity';
import { t } from '../i18n/ru';

/**
 * FR-8: конвертер количества. Ввод любого поля пересчитывает остальные
 * через молярную массу, число Авогадро и молярный объём (газы, v0.6).
 * Поле объёма показывается только для газов (SPEC.md, FR-8).
 */

type Field = 'mass' | 'moles' | 'molecules' | 'volume';

interface QuantityConverterProps {
  molarMass: number;
  isGas: boolean;
}

function parseValue(raw: string): number | null {
  const normalized = raw.trim().replaceAll(' ', '').replace(',', '.');
  if (normalized === '') return null;
  const value = Number(normalized);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function formatPlain(value: number): string {
  if (value === 0) return '0';
  // Школьное округление: 3 значащие цифры (36 г воды → ровно 2 моль).
  return String(Number(value.toPrecision(3))).replace('.', ',');
}

const SUPERSCRIPT: Record<string, string> = {
  '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
};

function formatMolecules(value: number): string {
  if (value === 0) return '0';
  if (value < 1e6) return formatPlain(value);
  const exponent = Math.floor(Math.log10(value));
  const mantissa = value / 10 ** exponent;
  const sup = String(exponent).split('').map((c) => SUPERSCRIPT[c]).join('');
  return `${mantissa.toFixed(3).replace('.', ',')}·10${sup}`;
}

export function QuantityConverter({ molarMass, isGas }: QuantityConverterProps) {
  const [values, setValues] = useState<Record<Field, string>>({
    mass: '',
    moles: '',
    molecules: '',
    volume: '',
  });

  function handleChange(field: Field, raw: string) {
    setValues((prev) => {
      const next = { ...prev, [field]: raw };
      const value = parseValue(raw);
      if (value === null) return next;

      let moles: number;
      switch (field) {
        case 'mass': moles = molesFromMass(value, molarMass); break;
        case 'moles': moles = value; break;
        case 'molecules': moles = molesFromMolecules(value); break;
        case 'volume': moles = molesFromVolume(value); break;
      }

      if (field !== 'mass') next.mass = formatPlain(massFromMoles(moles, molarMass));
      if (field !== 'moles') next.moles = formatPlain(moles);
      if (field !== 'molecules') next.molecules = formatMolecules(moleculesFromMoles(moles));
      if (field !== 'volume') next.volume = formatPlain(volumeFromMoles(moles));
      return next;
    });
  }

  const fields: { field: Field; label: string }[] = [
    { field: 'mass', label: t('converter.mass') },
    { field: 'moles', label: t('converter.moles') },
    { field: 'molecules', label: t('converter.molecules') },
    ...(isGas ? [{ field: 'volume' as Field, label: t('converter.volume') }] : []),
  ];

  return (
    <section aria-label={t('converter.title')} className="mt-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {t('converter.title')}
      </h3>
      <div className="mt-2 space-y-2">
        {fields.map(({ field, label }) => (
          <label key={field} className="block text-xs text-slate-500 dark:text-slate-400">
            {label}
            <input
              type="text"
              inputMode="decimal"
              value={values[field]}
              onChange={(e) => handleChange(field, e.target.value)}
              className="mt-0.5 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-sky-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>
        ))}
      </div>
    </section>
  );
}
