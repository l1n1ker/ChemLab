// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import type { MoleculeView } from '../domain/types';
import { t } from '../i18n/ru';
import { fmt, Formula, formatOxidation } from './format';
import { QuantityConverter } from './QuantityConverter';

/**
 * FR-6: панель свойств выбранной молекулы.
 * Все числа — производные от модели (P4), название и свойства —
 * только из каталога (P1).
 */

export function PropertiesPanel({ molecule }: { molecule: MoleculeView | null }) {
  if (!molecule) {
    return (
      <section aria-label={t('properties.title')} className="p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
          {t('properties.title')}
        </h2>
        <p className="mt-3 text-sm text-slate-400 dark:text-slate-500">{t('properties.none')}</p>
      </section>
    );
  }

  const { substance } = molecule;
  const properties = substance?.properties;

  return (
    <section aria-label={t('properties.title')} className="p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
        {t('properties.title')}
      </h2>

      {substance ? (
        <p className="mt-3 text-lg font-semibold text-slate-900 dark:text-slate-100">{substance.name}</p>
      ) : (
        <p className="mt-3 rounded-md bg-amber-100 px-3 py-2 text-sm text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
          {t('properties.hypothetical')}
        </p>
      )}

      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-slate-500 dark:text-slate-400">{t('properties.formula')}</dt>
          <dd className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            <Formula formula={molecule.formula} />
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-slate-500 dark:text-slate-400">{t('properties.molarMass')}</dt>
          <dd className="text-slate-900 dark:text-slate-100">
            {fmt(molecule.molarMass, 3)} {t('properties.molarMass.unit')}
          </dd>
        </div>
        {substance?.class && (
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500 dark:text-slate-400">{t('properties.class')}</dt>
            <dd className="text-slate-900 dark:text-slate-100">{t(`properties.class.${substance.class}`)}</dd>
          </div>
        )}
        {substance?.stateAtSTP && (
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500 dark:text-slate-400">{t('properties.stateAtSTP')}</dt>
            <dd className="text-slate-900 dark:text-slate-100">
              {t(`properties.state.${substance.stateAtSTP}`)}
            </dd>
          </div>
        )}
        {properties?.mp !== undefined && (
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500 dark:text-slate-400">{t('properties.mp')}</dt>
            <dd className="text-slate-900 dark:text-slate-100">{properties.mp} °C</dd>
          </div>
        )}
        {properties?.bp !== undefined && (
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500 dark:text-slate-400">{t('properties.bp')}</dt>
            <dd className="text-slate-900 dark:text-slate-100">{properties.bp} °C</dd>
          </div>
        )}
        {properties?.density !== undefined && (
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500 dark:text-slate-400">{t('properties.density')}</dt>
            <dd className="text-slate-900 dark:text-slate-100">
              {fmt(properties.density, 2)} {t(`properties.densityUnit.${properties.densityUnit ?? 'g/cm3'}`)}
            </dd>
          </div>
        )}
      </dl>

      <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {t('properties.composition')}
      </h3>
      <ul className="mt-2 space-y-1 text-sm">
        {molecule.fractions.map((fraction) => (
          <li key={fraction.element} className="flex justify-between gap-2">
            <span className="text-slate-600 dark:text-slate-300">
              {fraction.name} ({fraction.element}), {t('properties.atomCount', { count: fraction.count })}
            </span>
            <span className="text-slate-900 dark:text-slate-100">{fmt(fraction.percent, 1)} %</span>
          </li>
        ))}
      </ul>

      {molecule.bondIds.length > 0 && (
        <>
          <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t('properties.oxidation')}
          </h3>
          <p className="mt-2 text-sm text-slate-900 dark:text-slate-100">
            {[...molecule.oxidationStates.entries()]
              .map(([element, states]) => `${element}: ${states.map(formatOxidation).join(', ')}`)
              .join(' · ')}
          </p>
        </>
      )}

      <QuantityConverter
        key={molecule.id}
        molarMass={molecule.molarMass}
        isGas={substance?.stateAtSTP === 'gas'}
      />
    </section>
  );
}
