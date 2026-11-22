// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import { useState } from 'react';
import { ELEMENTS } from '../domain/data/elements';
import { PERIODIC_TABLE, type ElementCategory, type PeriodicEntry } from '../domain/data/periodicTable';
import { t } from '../i18n/ru';
import { elementColor } from './elementColors';
import type { TableLayout } from './layouts';

/**
 * FR-28/FR-29/FR-30: вкладка «Атомы» — полная периодическая таблица.
 * Активны элементы контентного набора M1 (18); фильтры и поиск затемняют
 * без перестановки; клик по активной ячейке — в корзину.
 */

interface AtomsTabProps {
  layout: TableLayout;
  onAdd: (symbol: string) => void;
  onInfo: (symbol: string) => void;
}

interface Filters {
  category: 'any' | ElementCategory;
  state: 'any' | 'solid' | 'liquid' | 'gas';
  valence: 'any' | '1' | '2' | '3' | '4';
  availability: 'any' | 'available' | 'locked';
}

const INITIAL_FILTERS: Filters = {
  category: 'any',
  state: 'any',
  valence: 'any',
  availability: 'any',
};

function isActive(entry: PeriodicEntry): boolean {
  return entry.symbol in ELEMENTS;
}

export function AtomsTab({ layout, onAdd, onInfo }: AtomsTabProps) {
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [search, setSearch] = useState('');
  const [rowSel, setRowSel] = useState<number | null>(null);
  const [colSel, setColSel] = useState<number | null>(null);
  const [rejectedHint, setRejectedHint] = useState(false);

  function matches(entry: PeriodicEntry): boolean {
    if (filters.category !== 'any' && entry.category !== filters.category) return false;
    if (filters.state !== 'any' && entry.stateAtSTP !== filters.state) return false;
    if (filters.availability === 'available' && !isActive(entry)) return false;
    if (filters.availability === 'locked' && isActive(entry)) return false;
    if (filters.valence !== 'any') {
      const element = ELEMENTS[entry.symbol];
      if (!element || !element.valences.includes(Number(filters.valence))) return false;
    }
    if (rowSel !== null && entry.period !== rowSel) return false;
    if (colSel !== null && layout.positions[entry.number][0] !== colSel) return false;
    const q = search.trim().toLowerCase();
    if (q !== '') {
      const hit =
        entry.symbol.toLowerCase().startsWith(q) || entry.name.toLowerCase().includes(q);
      if (!hit) return false;
    }
    return true;
  }

  const activeMatches = PERIODIC_TABLE.filter((e) => isActive(e) && matches(e)).length;

  function resetFilters() {
    setFilters(INITIAL_FILTERS);
    setSearch('');
    setRowSel(null);
    setColSel(null);
    setRejectedHint(false);
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('shop.search.placeholder')}
          className="w-48 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-slate-900 focus:border-sky-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <select
          aria-label={t('shop.filter.category')}
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value as Filters['category'] })}
          className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="any">{t('shop.filter.category')}: {t('shop.filter.any')}</option>
          <option value="metal">{t('atomcard.category.metal')}</option>
          <option value="nonmetal">{t('atomcard.category.nonmetal')}</option>
          <option value="metalloid">{t('atomcard.category.metalloid')}</option>
        </select>
        <select
          aria-label={t('shop.filter.state')}
          value={filters.state}
          onChange={(e) => setFilters({ ...filters, state: e.target.value as Filters['state'] })}
          className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="any">{t('shop.filter.state')}: {t('shop.filter.any')}</option>
          <option value="solid">{t('properties.state.solid')}</option>
          <option value="liquid">{t('properties.state.liquid')}</option>
          <option value="gas">{t('properties.state.gas')}</option>
        </select>
        <select
          aria-label={t('shop.filter.valence')}
          value={filters.valence}
          onChange={(e) => setFilters({ ...filters, valence: e.target.value as Filters['valence'] })}
          className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="any">{t('shop.filter.valence')}: {t('shop.filter.any')}</option>
          {['1', '2', '3', '4'].map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
        <select
          aria-label={t('shop.filter.availability')}
          value={filters.availability}
          onChange={(e) => setFilters({ ...filters, availability: e.target.value as Filters['availability'] })}
          className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="any">{t('shop.filter.availability')}: {t('shop.filter.any')}</option>
          <option value="available">{t('shop.filter.available')}</option>
          <option value="locked">{t('shop.filter.locked')}</option>
        </select>
        <span className="text-slate-500 dark:text-slate-400">{t('shop.filter.matches', { count: activeMatches })}</span>
        <button
          type="button"
          className="rounded-md bg-slate-200 px-2 py-1.5 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          onClick={resetFilters}
        >
          {t('shop.filter.reset')}
        </button>
      </div>

      {rejectedHint && (
        <div role="status" className="mb-2 flex items-center gap-2 rounded-md bg-amber-100 px-3 py-1.5 text-xs text-amber-800 dark:bg-slate-800 dark:text-amber-200">
          {t('shop.filter.rejected')}
          <button type="button" className="underline" onClick={resetFilters}>
            {t('shop.filter.reset')}
          </button>
        </div>
      )}

      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: 'auto repeat(18, minmax(40px, 1fr))' }}
      >
        {/* Заголовки колонок — клик выделяет колонку (FR-29) */}
        <span />
        {layout.columnLabels.map((label, i) => (
          <button
            key={label + i}
            type="button"
            aria-pressed={colSel === i + 1}
            onClick={() => setColSel(colSel === i + 1 ? null : i + 1)}
            className={`rounded px-0.5 py-1 text-center text-[10px] font-semibold ${
              colSel === i + 1 ? 'bg-sky-600 text-white' : 'text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            {label}
          </button>
        ))}

        {/* Строки периодов 1–7 + f-блок */}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((row) => (
          <span key={`row-${row}`} className="contents">
            <button
              type="button"
              aria-pressed={rowSel === row}
              disabled={row > 7}
              onClick={() => setRowSel(rowSel === row ? null : row)}
              className={`rounded px-1 text-[10px] font-semibold ${
                rowSel === row ? 'bg-sky-600 text-white' : 'text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800'
              } ${row > 7 ? 'opacity-40' : ''}`}
            >
              {row > 7 ? '*' : row}
            </button>
            {PERIODIC_TABLE.filter((e) => layout.positions[e.number][1] === row).map((entry) => {
              const [col] = layout.positions[entry.number];
              const active = isActive(entry);
              const matched = matches(entry);
              const dimmed = !matched;
              return (
                <div
                  key={entry.number}
                  role="button"
                  tabIndex={active ? 0 : -1}
                  aria-disabled={!active || dimmed}
                  data-element-cell={entry.symbol}
                  data-dimmed={dimmed || undefined}
                  title={active ? entry.name : `${entry.name} — ${t('shop.locked')}`}
                  style={{ gridColumn: col + 1, backgroundColor: elementColor(entry) }}
                  className={`relative flex min-h-11 cursor-pointer flex-col items-center justify-center rounded px-0.5 text-slate-900 transition-opacity ${
                    !active || dimmed ? 'opacity-25' : ''
                  } ${!active ? 'cursor-not-allowed' : ''}`}
                  onClick={() => {
                    if (!active) return;
                    if (dimmed) {
                      setRejectedHint(true);
                      return;
                    }
                    onAdd(entry.symbol);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && active && !dimmed) onAdd(entry.symbol);
                  }}
                >
                  <span className="absolute left-1 top-0.5 text-[8px]">{entry.number}</span>
                  <span className="text-sm font-bold">{entry.symbol}</span>
                  {active && (
                    <button
                      type="button"
                      aria-label={`${t('shop.elementInfo')}: ${entry.name}`}
                      className="absolute right-0.5 top-0.5 rounded-full bg-white/70 px-1 text-[9px] font-bold text-slate-700 hover:bg-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        onInfo(entry.symbol);
                      }}
                    >
                      ℹ
                    </button>
                  )}
                </div>
              );
            })}
          </span>
        ))}
      </div>
    </div>
  );
}
