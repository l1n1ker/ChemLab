// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import { useEffect, useState } from 'react';
import { getSubstance } from '../domain/data/substances';
import { t } from '../i18n/ru';
import { getLayout, type TableLayout } from './layouts';
import { AtomsTab } from './AtomsTab';
import { SubstancesTab } from './SubstancesTab';
import { Formula } from '../graph/format';

/**
 * FR-28…32: магазин — модальное окно с вкладками «Атомы» (периодическая
 * таблица) и «Вещества» (каталог); единая корзина; «Готово» размещает
 * набранное на столе. Корзина — не объекты домена до размещения (FR-28).
 */

export interface CartEntry {
  kind: 'element' | 'substance';
  id: string;
}

interface ShopModalProps {
  open: boolean;
  onClose: () => void;
  layout: TableLayout;
  onLayoutChange: (layoutId: string) => void;
  onDone: (cart: CartEntry[]) => void;
  onElementInfo: (symbol: string) => void;
}

function cartKey(entry: CartEntry): string {
  return `${entry.kind}:${entry.id}`;
}

export function ShopModal({ open, onClose, layout, onLayoutChange, onDone, onElementInfo }: ShopModalProps) {
  const [tab, setTab] = useState<'atoms' | 'substances'>('atoms');
  const [cart, setCart] = useState<CartEntry[]>([]);

  // Esc — отмена и очистка корзины (FR-28).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCart([]);
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const addToCart = (entry: CartEntry) => setCart((prev) => [...prev, entry]);
  const decrement = (key: string) =>
    setCart((prev) => {
      const index = prev.findIndex((e) => cartKey(e) === key);
      return index === -1 ? prev : [...prev.slice(0, index), ...prev.slice(index + 1)];
    });

  const chips = [...new Set(cart.map(cartKey))].map((key) => ({
    key,
    count: cart.filter((e) => cartKey(e) === key).length,
  }));

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60"
      onClick={() => {
        setCart([]);
        onClose();
      }}
    >
      <div
        role="dialog"
        aria-label={t('shop.open')}
        className="flex max-h-[90vh] w-[min(1100px,95vw)] flex-col rounded-xl bg-white shadow-2xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 border-b border-slate-200 px-4 py-2 dark:border-slate-700">
          <div role="tablist" className="flex gap-1">
            {(['atoms', 'substances'] as const).map((tabId) => (
              <button
                key={tabId}
                role="tab"
                aria-selected={tab === tabId}
                onClick={() => setTab(tabId)}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
                  tab === tabId ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {t(tabId === 'atoms' ? 'shop.tab.atoms' : 'shop.tab.substances')}
              </button>
            ))}
          </div>

          {tab === 'atoms' && (
            <div className="flex gap-1" aria-label="layout">
              {/* FR-30: два варианта → сегментный переключатель */}
              {(['mendeleev', 'iupac'] as const).map((id) => {
                const l = getLayout(id);
                return (
                  <button
                    key={id}
                    aria-pressed={layout.id === id}
                    onClick={() => onLayoutChange(id)}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                      layout.id === id ? 'bg-violet-500 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    {t(l.nameKey)}
                  </button>
                );
              })}
            </div>
          )}

          <button
            type="button"
            aria-label={t('shop.close')}
            className="ml-auto rounded-md bg-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            onClick={() => {
              setCart([]);
              onClose();
            }}
          >
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {tab === 'atoms' ? (
            <AtomsTab layout={layout} onAdd={(symbol) => addToCart({ kind: 'element', id: symbol })} onInfo={onElementInfo} />
          ) : (
            <SubstancesTab onAdd={(id) => addToCart({ kind: 'substance', id })} />
          )}
        </div>

        {/* Единая корзина (FR-28/FR-31) */}
        <div className="flex items-center gap-2 border-t border-slate-200 px-4 py-2 dark:border-slate-700">
          <span className="text-sm text-slate-500 dark:text-slate-400">{t('shop.cart')}:</span>
          <div className="flex min-h-8 flex-1 flex-wrap items-center gap-1.5">
            {chips.length === 0 && (
              <span className="text-xs text-slate-400 dark:text-slate-500">{t('shop.cart.empty')}</span>
            )}
            {chips.map(({ key, count }) => {
              const [kind, id] = key.split(':');
              return (
                <button
                  key={key}
                  type="button"
                  title={key}
                  onClick={() => decrement(key)}
                  className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                >
                  {kind === 'substance' ? <Formula formula={getSubstance(id).formula} /> : id}
                  {count > 1 ? ` ×${count}` : ''}
                </button>
              );
            })}
          </div>
          {chips.length > 0 && (
            <button
              type="button"
              className="rounded-md bg-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              onClick={() => setCart([])}
            >
              {t('shop.cart.clear')}
            </button>
          )}
          <button
            type="button"
            disabled={cart.length === 0}
            className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => {
              onDone(cart);
              setCart([]);
              onClose();
            }}
          >
            {t('shop.done')}
          </button>
        </div>
      </div>
    </div>
  );
}
