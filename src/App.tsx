// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import { useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { deriveMolecules, LabStore } from './domain/labStore';
import { ResultModal } from './graph/ResultModal';
import { t } from './i18n/ru';
import { AtomCardContent } from './workspace/AtomCard';
import { getLayout } from './workspace/layouts';
import { placeCart } from './workspace/placement';
import { ShopModal, type CartEntry } from './workspace/ShopModal';
import { WorkspaceCanvas } from './workspace/WorkspaceCanvas';

export function App() {
  const [store] = useState(() => new LabStore());
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const molecules = useMemo(() => deriveMolecules(state), [state]);

  const [shopOpen, setShopOpen] = useState(false);
  // FR-30: выбор раскладки запоминается в пределах сессии.
  const [layoutId, setLayoutId] = useState('mendeleev');
  const [inspectedId, setInspectedId] = useState<string | null>(null);
  const [infoSymbol, setInfoSymbol] = useState<string | null>(null);

  const workspaceEl = useRef<HTMLDivElement | null>(null);
  const inspected = molecules.find((m) => m.id === inspectedId) ?? null;

  // FR-28/FR-31: «Готово» — корзина размещается рядком от верхнего левого угла.
  function handleCartDone(cart: CartEntry[]) {
    const occupied = Object.values(store.getSnapshot().atoms).map((a) => a.position);
    const items = cart.map((entry) => ({ width: entry.kind === 'substance' ? 200 : 60 }));
    const positions = placeCart(items, occupied, workspaceEl.current?.clientWidth || 800);
    cart.forEach((entry, i) => {
      if (entry.kind === 'element') {
        store.addAtom(entry.id, positions[i]);
      } else {
        store.addSubstance(entry.id, positions[i]);
      }
    });
  }

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 px-4 py-3">
        <h1 className="text-lg font-bold">{t('app.title')}</h1>
      </header>

      <main className="flex min-h-0 flex-1">
        <WorkspaceCanvas
          store={store}
          state={state}
          layoutId={layoutId}
          innerRef={(el) => {
            workspaceEl.current = el;
          }}
          onOpenShop={() => setShopOpen(true)}
          onInspect={setInspectedId}
        />
      </main>

      <ShopModal
        open={shopOpen}
        onClose={() => setShopOpen(false)}
        layout={getLayout(layoutId)}
        onLayoutChange={setLayoutId}
        onDone={handleCartDone}
        onElementInfo={setInfoSymbol}
      />

      <ResultModal
        molecule={inspected}
        state={state}
        onClose={() => setInspectedId(null)}
        onDismantle={(id) => {
          store.dismantleMolecule(id);
          setInspectedId(null);
        }}
      />

      {/* FR-33: карточка элемента из магазина (иконка ℹ) */}
      {infoSymbol && (
        <div className="fixed right-4 top-16 z-50" data-atom-card>
          <AtomCardContent symbol={infoSymbol} layoutId={layoutId} />
          <button
            type="button"
            className="mt-1 w-full rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700"
            onClick={() => setInfoSymbol(null)}
          >
            {t('result.close')}
          </button>
        </div>
      )}
    </div>
  );
}
