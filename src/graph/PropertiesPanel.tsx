// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import type { MoleculeView } from '../domain/types';
import { t } from '../i18n/ru';

/**
 * FR-6 (объём M0): панель свойств выбранной молекулы.
 * Все числа — производные от модели (P4), название — только из каталога (P1).
 */

/** Химическая формула с нижними индексами: H2O → H₂O. */
export function Formula({ formula }: { formula: string }) {
  const parts = formula.match(/[A-Z][a-z]?|\d+/g) ?? [];
  return (
    <>
      {parts.map((part, i) =>
        /^\d+$/.test(part) ? <sub key={i}>{part}</sub> : <span key={i}>{part}</span>,
      )}
    </>
  );
}

/** Школьный формат числа: десятичный разделитель — запятая. */
export function fmt(n: number, digits: number): string {
  return n.toFixed(digits).replace('.', ',');
}

export function PropertiesPanel({ molecule }: { molecule: MoleculeView | null }) {
  if (!molecule) {
    return (
      <section aria-label={t('properties.title')} className="p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
          {t('properties.title')}
        </h2>
        <p className="mt-3 text-sm text-slate-500">{t('properties.none')}</p>
      </section>
    );
  }

  return (
    <section aria-label={t('properties.title')} className="p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
        {t('properties.title')}
      </h2>

      {molecule.substance ? (
        <p className="mt-3 text-lg font-semibold text-slate-100">{molecule.substance.name}</p>
      ) : (
        <p className="mt-3 rounded-md bg-amber-900/40 px-3 py-2 text-sm text-amber-200">
          {t('properties.hypothetical')}
        </p>
      )}

      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-slate-400">{t('properties.formula')}</dt>
          <dd className="text-lg font-semibold text-slate-100">
            <Formula formula={molecule.formula} />
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-slate-400">{t('properties.molarMass')}</dt>
          <dd className="text-slate-100">
            {fmt(molecule.molarMass, 3)} {t('properties.molarMass.unit')}
          </dd>
        </div>
        {molecule.substance?.stateAtSTP && (
          <div className="flex justify-between gap-2">
            <dt className="text-slate-400">{t('properties.stateAtSTP')}</dt>
            <dd className="text-slate-100">
              {t(`properties.state.${molecule.substance.stateAtSTP}`)}
            </dd>
          </div>
        )}
      </dl>

      <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {t('properties.composition')}
      </h3>
      <ul className="mt-2 space-y-1 text-sm">
        {molecule.fractions.map((fraction) => (
          <li key={fraction.element} className="flex justify-between gap-2">
            <span className="text-slate-300">
              {fraction.name} ({fraction.element}), {t('properties.atomCount', { count: fraction.count })}
            </span>
            <span className="text-slate-100">{fmt(fraction.percent, 1)} %</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
