// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import { useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { deriveMolecules, LabStore } from './domain/labStore';
import { PropertiesPanel } from './graph/PropertiesPanel';
import { t } from './i18n/ru';
import { Inspector3D } from './inspector3d/Inspector3D';
import { AtomPalette } from './workspace/AtomPalette';
import { WorkspaceCanvas } from './workspace/WorkspaceCanvas';

export function App() {
  const [store] = useState(() => new LabStore());
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const molecules = useMemo(() => deriveMolecules(state), [state]);
  const selected = molecules.find((m) => m.id === state.selectedMoleculeId) ?? null;

  const workspaceEl = useRef<HTMLDivElement | null>(null);
  const [ghost, setGhost] = useState<{ element: string; x: number; y: number } | null>(null);

  // FR-1: клик/Enter — атом появляется на столе в свободном месте.
  function takeAtom(element: string) {
    const count = Object.keys(store.getSnapshot().atoms).length;
    store.addAtom(element, { x: 100 + (count % 6) * 80, y: 100 + Math.floor(count / 6) * 90 });
  }

  // FR-1: перетаскивание из магазина на стол.
  function startPaletteDrag(element: string, e: React.PointerEvent) {
    setGhost({ element, x: e.clientX, y: e.clientY });
    let moved = false;
    const onMove = (ev: PointerEvent) => {
      moved = true;
      setGhost({ element, x: ev.clientX, y: ev.clientY });
    };
    const onUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      setGhost(null);
      if (!moved) return;
      const rect = workspaceEl.current?.getBoundingClientRect();
      const inside =
        rect &&
        ev.clientX >= rect.left &&
        ev.clientX <= rect.right &&
        ev.clientY >= rect.top &&
        ev.clientY <= rect.bottom;
      if (inside) {
        store.addAtom(element, { x: ev.clientX - rect.left, y: ev.clientY - rect.top });
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 px-4 py-3">
        <h1 className="text-lg font-bold">{t('app.title')}</h1>
      </header>

      <main className="flex min-h-0 flex-1">
        <aside className="w-60 shrink-0 overflow-y-auto border-r border-slate-800">
          <AtomPalette onTake={takeAtom} onDragStart={startPaletteDrag} />
        </aside>

        <WorkspaceCanvas
          store={store}
          state={state}
          innerRef={(el) => {
            workspaceEl.current = el;
          }}
        />

        <aside className="flex w-84 shrink-0 flex-col border-l border-slate-800">
          <div className="min-h-0 flex-1 overflow-y-auto">
            <PropertiesPanel molecule={selected} />
          </div>
          <div className="h-80 shrink-0 border-t border-slate-800">
            <Inspector3D molecule={selected} state={state} />
          </div>
        </aside>
      </main>

      {ghost && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-50 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-sky-400 font-bold opacity-80"
          style={{ left: ghost.x, top: ghost.y }}
        >
          {ghost.element}
        </div>
      )}
    </div>
  );
}
