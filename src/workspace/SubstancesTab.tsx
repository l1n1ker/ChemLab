// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import { useState } from 'react';
import { SUBSTANCES } from '../domain/data/substances';
import type { SubstanceClass } from '../domain/types';
import { matchesSubstanceQuery } from '../domain/formulaSearch';
import { Formula } from '../graph/format';
import { t } from '../i18n/ru';

/**
 * FR-31/FR-32: вкладка «Вещества» — карточки каталога, фильтры и поиск.
 * Правила затемнения — как в таблице (FR-29): без перестановки сетки.
 */

interface SubstancesTabProps {
  onAdd: (substanceId: string) => void;
}

const CLASS_KEYS: SubstanceClass[] = ['simple', 'oxide', 'acid', 'base', 'salt'];

const CATALOG_ELEMENTS = [
  ...new Set(SUBSTANCES.flatMap((s) => s.structure.atoms.map((a) => a.element))),
].sort();

export function SubstancesTab({ onAdd }: SubstancesTabProps) {
  const [classFilter, setClassFilter] = useState<'any' | SubstanceClass>('any');
  const [elementFilter, setElementFilter] = useState<'any' | string>('any');
  const [stateFilter, setStateFilter] = useState<'any' | 'solid' | 'liquid' | 'gas'>('any');
  const [search, setSearch] = useState('');

  function matches(substanceId: string): boolean {
    const substance = SUBSTANCES.find((s) => s.id === substanceId)!;
    if (classFilter !== 'any' && substance.class !== classFilter) return false;
    if (stateFilter !== 'any' && substance.stateAtSTP !== stateFilter) return false;
    if (
      elementFilter !== 'any' &&
      !substance.structure.atoms.some((a) => a.element === elementFilter)
    ) {
      return false;
    }
    return matchesSubstanceQuery(search, substance);
  }

  const matchCount = SUBSTANCES.filter((s) => matches(s.id)).length;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('shop.search.placeholder')}
          className="w-48 rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-slate-100 focus:border-sky-400 focus:outline-none"
        />
        <select
          aria-label={t('shop.filter.class')}
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value as typeof classFilter)}
          className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-slate-100"
        >
          <option value="any">{t('shop.filter.class')}: {t('shop.filter.any')}</option>
          {CLASS_KEYS.map((cls) => (
            <option key={cls} value={cls}>{t(`properties.class.${cls}`)}</option>
          ))}
        </select>
        <select
          aria-label={t('shop.filter.containsElement')}
          value={elementFilter}
          onChange={(e) => setElementFilter(e.target.value)}
          className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-slate-100"
        >
          <option value="any">{t('shop.filter.containsElement')}: {t('shop.filter.any')}</option>
          {CATALOG_ELEMENTS.map((symbol) => (
            <option key={symbol} value={symbol}>{symbol}</option>
          ))}
        </select>
        <select
          aria-label={t('shop.filter.state')}
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value as typeof stateFilter)}
          className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-slate-100"
        >
          <option value="any">{t('shop.filter.state')}: {t('shop.filter.any')}</option>
          <option value="solid">{t('properties.state.solid')}</option>
          <option value="liquid">{t('properties.state.liquid')}</option>
          <option value="gas">{t('properties.state.gas')}</option>
        </select>
        <span className="text-slate-400">{t('shop.filter.matches', { count: matchCount })}</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {SUBSTANCES.map((substance) => {
          const dimmed = !matches(substance.id);
          return (
            <button
              key={substance.id}
              type="button"
              data-substance-card={substance.id}
              data-dimmed={dimmed || undefined}
              aria-disabled={dimmed}
              onClick={() => !dimmed && onAdd(substance.id)}
              className={`flex flex-col items-start gap-1 rounded-lg bg-slate-800 p-3 text-left transition-opacity hover:bg-slate-700 ${
                dimmed ? 'pointer-events-none opacity-25' : ''
              }`}
            >
              <span className="text-base font-semibold text-slate-100">
                <Formula formula={substance.formula} />
              </span>
              <span className="text-xs text-slate-300">{substance.name}</span>
              <span className="flex gap-1 text-[10px]">
                {substance.class && (
                  <span className="rounded bg-slate-700 px-1.5 py-0.5 text-slate-300">
                    {t(`properties.class.${substance.class}`)}
                  </span>
                )}
                {substance.stateAtSTP && (
                  <span className="rounded bg-slate-700 px-1.5 py-0.5 text-slate-300">
                    {t(`properties.state.${substance.stateAtSTP}`)}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
