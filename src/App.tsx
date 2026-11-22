// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import { useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { deriveMolecules, LabStore } from './domain/labStore';
import type { Vec2 } from './domain/types';
import { PropertiesPanel } from './graph/PropertiesPanel';
import { t } from './i18n/ru';
import { Inspector3D } from './inspector3d/Inspector3D';
import { AtomPalette } from './workspace/AtomPalette';
import { SubstancePalette } from './workspace/SubstancePalette';
import { WorkspaceCanvas } from './workspace/WorkspaceCanvas';

/** Полезная нагрузка перетаскивания из магазина: что бросить на стол. */
interface DragPayload {
  label: string;
  drop: (position: Vec2) => void;
}

export function App() {
  const [store] = useState(() => new LabStore());
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const molecules = useMemo(() => deriveMolecules(state), [state]);
  const selected = molecules.find((m) => m.id === state.selectedMoleculeId) ?? null;

  const workspaceEl = useRef<HTMLDivElement | null>(null);
  const [ghost, setGhost] = useState<{ payload: DragPayload; x: number; y: number } | null>(null);

  // Свободное место на столе для кликового добавления.
  function freePosition(): Vec2 {
    const count = Object.keys(store.getSnapshot().atoms).length;
    return { x: 100 + (count % 6) * 80, y: 100 + Math.floor(count / 6) * 90 };
  }

  // FR-1/FR-2: клик/Enter — объект появляется на столе.
  function takeAtom(element: string) {
    store.addAtom(element, freePosition());
  }

  function takeSubstance(substanceId: string) {
    store.addSubstance(substanceId, freePosition());
  }

  // FR-1/FR-2: перетаскивание из магазина на стол.
  function startPaletteDrag(payload: DragPayload, e: React.PointerEvent) {
    setGhost({ payload, x: e.clientX, y: e.clientY });
    let moved = false;
    const onMove = (ev: PointerEvent) => {
      moved = true;
      setGhost({ payload, x: ev.clientX, y: ev.clientY });
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
        payload.drop({ x: ev.clientX - rect.left, y: ev.clientY - rect.top });
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
        <aside className="flex w-60 shrink-0 flex-col divide-y divide-slate-800 overflow-y-auto border-r border-slate-800">
          <AtomPalette
            onTake={takeAtom}
            onDragStart={(element, e) =>
              startPaletteDrag({ label: element, drop: (pos) => store.addAtom(element, pos) }, e)
            }
          />
          <SubstancePalette
            onTake={takeSubstance}
            onDragStart={(substanceId, e) =>
              startPaletteDrag(
                { label: substanceId, drop: (pos) => store.addSubstance(substanceId, pos) },
                e,
              )
            }
          />
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
          className="pointer-events-none fixed z-50 flex h-12 min-w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-sky-400 px-2 font-bold opacity-80"
          style={{ left: ghost.x, top: ghost.y }}
        >
          {ghost.payload.label}
        </div>
      )}
    </div>
  );
}
