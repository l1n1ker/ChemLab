// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import { useState } from 'react';
import { lookupSubstances, type LookupResult } from '../domain/formulaSearch';
import type { Substance } from '../domain/types';
import { Formula } from '../graph/format';
import { t } from '../i18n/ru';

/**
 * FR-25: конструктор по формуле (обратный поток к ручной сборке).
 * Ввод формулы или названия → молекула на столе; изомеры — выбор карточкой;
 * нет в каталоге — честный отказ (P1), структуру не выдумываем.
 */

interface FormulaBuilderProps {
  onBuild: (substanceId: string) => void;
}

export function FormulaBuilder({ onBuild }: FormulaBuilderProps) {
  const [query, setQuery] = useState('');
  const [outcome, setOutcome] = useState<LookupResult | null>(null);

  function submit() {
    const result = lookupSubstances(query);
    setOutcome(result);
    if (result.status === 'unique') {
      onBuild(result.substance.id);
      setQuery('');
      setOutcome(null);
    }
  }

  function choose(substance: Substance) {
    onBuild(substance.id);
    setQuery('');
    setOutcome(null);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        value={query}
        aria-label={t('builder.submit')}
        placeholder={t('builder.placeholder')}
        className="w-56 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-sky-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        onChange={(e) => {
          setQuery(e.target.value);
          setOutcome(null);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
        }}
      />
      <button
        type="button"
        className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-sky-500"
        onClick={submit}
      >
        {t('builder.submit')}
      </button>

      {outcome?.status === 'isomers' && (
        <div role="dialog" aria-label={t('builder.isomers')} className="flex basis-full flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-slate-500 dark:text-slate-400">{t('builder.isomers')}</span>
          {outcome.substances.map((substance) => (
            <button
              key={substance.id}
              type="button"
              className="flex flex-col items-start rounded-lg bg-white px-3 py-1.5 text-left ring-1 ring-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:ring-slate-600 dark:hover:bg-slate-700"
              onClick={() => choose(substance)}
            >
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                <Formula formula={substance.formula} />
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-300">{substance.name}</span>
            </button>
          ))}
          <button
            type="button"
            className="rounded-md bg-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
            onClick={() => setOutcome(null)}
          >
            {t('builder.cancel')}
          </button>
        </div>
      )}

      {outcome?.status === 'notFound' && (
        <p role="alert" className="basis-full pt-1 text-xs text-amber-700 dark:text-amber-300">
          {t('builder.notFound')}
        </p>
      )}
    </div>
  );
}
