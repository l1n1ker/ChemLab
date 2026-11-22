// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import { useRef, useState } from 'react';
import { deriveMolecules, type LabState, type LabStore } from '../domain/labStore';
import { getElement } from '../domain/data/elements';
import { getPeriodicEntry } from '../domain/data/periodicTable';
import { freeValence } from '../domain/validation';
import { fmt, Formula } from '../graph/format';
import { rejectionMessage } from '../i18n/rejectionMessage';
import { t } from '../i18n/ru';
import { AtomCardContent } from './AtomCard';
import { BondLayer } from './BondLayer';
import { elementColor } from './elementColors';
import { ReactionZone } from './ReactionZone';

/**
 * Рабочий стол 2D (SPEC.md 4.2): рендер узлов и жесты.
 * Никакой химии внутри — только команды в LabStore (раздел 9).
 * Клик по атому — карточка (FR-33); двойной клик — модалка результата (FR-34);
 * у молекул — компактная подпись (формула + молярная масса).
 * Связь создаётся одинарной ковалентной; кратность/тип/удаление —
 * в контекстном меню связи (FR-4/FR-7, v0.11).
 */

interface WorkspaceCanvasProps {
  store: LabStore;
  state: LabState;
  innerRef: (el: HTMLDivElement | null) => void;
  layoutId: string;
  onOpenShop: () => void;
  onInspect: (moleculeId: string) => void;
}

export function WorkspaceCanvas({ store, state, innerRef, layoutId, onOpenShop, onInspect }: WorkspaceCanvasProps) {
  const [bondDrag, setBondDrag] = useState<{ fromId: string; x: number; y: number } | null>(null);
  const [atomCardId, setAtomCardId] = useState<string | null>(null);
  const [bondMenuId, setBondMenuId] = useState<string | null>(null);
  const bondDragRef = useRef(bondDrag);
  bondDragRef.current = bondDrag;

  const localRef = useRef<HTMLDivElement | null>(null);
  const molecules = deriveMolecules(state);

  function moleculeOf(atomId: string) {
    return molecules.find((m) => m.atomIds.includes(atomId)) ?? null;
  }

  function toLocal(clientX: number, clientY: number) {
    const rect = localRef.current?.getBoundingClientRect();
    return { x: clientX - (rect?.left ?? 0), y: clientY - (rect?.top ?? 0) };
  }

  // Перемещение: указатель на атоме; связная группа движется как единая молекула.
  function onAtomPointerDown(e: React.PointerEvent, atomId: string) {
    e.stopPropagation();
    const drag = { lastX: e.clientX, lastY: e.clientY, moved: false };
    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - drag.lastX;
      const dy = ev.clientY - drag.lastY;
      if (dx !== 0 || dy !== 0) drag.moved = true;
      drag.lastX = ev.clientX;
      drag.lastY = ev.clientY;
      store.moveMoleculeOf(atomId, { x: dx, y: dy });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      // FR-33: клик без перемещения — карточка атома.
      if (!drag.moved && !bondDragRef.current) {
        setAtomCardId((current) => (current === atomId ? null : atomId));
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  // FR-4: протягивание связи от «ручки связи» к другому атому.
  function onHandlePointerDown(e: React.PointerEvent, fromId: string) {
    e.stopPropagation();
    setAtomCardId(null);
    setBondDrag({ fromId, ...toLocal(e.clientX, e.clientY) });
    const onMove = (ev: PointerEvent) =>
      setBondDrag({ fromId, ...toLocal(ev.clientX, ev.clientY) });
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      setBondDrag(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  function onAtomPointerUp(atomId: string) {
    const current = bondDragRef.current;
    // FR-4 (v0.11): новая связь — всегда одинарная ковалентная.
    if (current && current.fromId !== atomId) {
      store.createBond(current.fromId, atomId, 1, 'covalent');
    }
  }

  const dragSource = bondDrag ? state.atoms[bondDrag.fromId] : null;
  const cardAtom = atomCardId ? state.atoms[atomCardId] : null;

  return (
    <section aria-label={t('workspace.title')} className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-slate-700 px-4 py-2">
        <button
          type="button"
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-500"
          onClick={onOpenShop}
        >
          {t('shop.open')}
        </button>
      </div>

      <div
        ref={(el) => {
          localRef.current = el;
          innerRef(el);
        }}
        data-testid="workspace"
        className="relative min-h-0 flex-1 overflow-hidden bg-slate-900"
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (
            !target.closest('[data-atom-id]') &&
            !target.closest('[data-atom-card]') &&
            !target.closest('[data-bond-id]') &&
            !target.closest('[data-bond-menu]')
          ) {
            setAtomCardId(null);
            setBondMenuId(null);
          }
        }}
      >
        {Object.keys(state.atoms).length === 0 && (
          <p className="absolute inset-0 flex items-center justify-center text-slate-500">
            {t('workspace.empty')}
          </p>
        )}

        <BondLayer
          atoms={state.atoms}
          bonds={state.bonds}
          onMenu={(id) => {
            setAtomCardId(null);
            setBondMenuId(id);
          }}
        />

        {dragSource && bondDrag && (
          <svg className="pointer-events-none absolute inset-0 h-full w-full">
            <line
              x1={dragSource.position.x}
              y1={dragSource.position.y}
              x2={bondDrag.x}
              y2={bondDrag.y}
              stroke="#38bdf8"
              strokeWidth={2}
              strokeDasharray="6 4"
            />
          </svg>
        )}

        {Object.values(state.atoms).map((atom) => {
          const element = getElement(atom.element);
          return (
            <div
              key={atom.id}
              data-atom-id={atom.id}
              data-element={atom.element}
              role="button"
              tabIndex={0}
              className="absolute flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center rounded-full border-2 border-slate-600 text-base font-bold text-slate-900 select-none"
              style={{
                left: atom.position.x,
                top: atom.position.y,
                backgroundColor: elementColor(getPeriodicEntry(atom.element)),
                touchAction: 'none',
              }}
              onPointerDown={(e) => onAtomPointerDown(e, atom.id)}
              onPointerUp={() => onAtomPointerUp(atom.id)}
              onDoubleClick={() => {
                const molecule = moleculeOf(atom.id);
                if (molecule) {
                  setAtomCardId(null);
                  onInspect(molecule.id);
                }
              }}
            >
              {element.symbol}
              {/* FR-3: свободные валентности */}
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-[10px] font-semibold text-slate-100">
                {freeValence(atom, state.bonds)}
              </span>
              {/* FR-4: ручка связи */}
              <span
                role="button"
                tabIndex={0}
                aria-label={t('workspace.bondHandle')}
                title={t('workspace.bondHandle')}
                className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 cursor-crosshair rounded-full border border-slate-400 bg-slate-600 hover:bg-sky-400"
                style={{ touchAction: 'none' }}
                onPointerDown={(e) => onHandlePointerDown(e, atom.id)}
              />
              {/* FR-1 (v0.12): копия атома без магазина */}
              <span
                role="button"
                tabIndex={0}
                aria-label={t('atom.clone')}
                title={t('atom.clone')}
                className="absolute -bottom-1 -left-1 flex h-4 w-4 items-center justify-center rounded-full border border-slate-400 bg-emerald-600 text-[10px] font-bold text-white hover:bg-emerald-500"
                onClick={(e) => {
                  e.stopPropagation();
                  store.addAtom(atom.element, {
                    x: atom.position.x + 60,
                    y: atom.position.y + 44,
                  });
                }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                +
              </span>
            </div>
          );
        })}

        {/* FR-34: компактные подписи молекул (формула + молярная масса) */}
        {molecules
          .filter((m) => m.bondIds.length > 0)
          .map((molecule) => {
            const xs = molecule.atomIds.map((id) => state.atoms[id].position.x);
            const ys = molecule.atomIds.map((id) => state.atoms[id].position.y);
            const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
            const bottom = Math.max(...ys) + 34;
            return (
              <div
                key={molecule.id}
                data-molecule-label={molecule.id}
                className="absolute flex -translate-x-1/2 items-center gap-1.5 rounded-md bg-slate-800/90 px-2 py-0.5 text-xs text-slate-200"
                style={{ left: cx, top: bottom }}
              >
                <span className="font-semibold">
                  <Formula formula={molecule.formula} />
                </span>
                <span className="text-slate-400">
                  {fmt(molecule.molarMass, 3)} {t('properties.molarMass.unit')}
                </span>
                <button
                  type="button"
                  className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] hover:bg-slate-600"
                  onClick={() => onInspect(molecule.id)}
                >
                  {t('result.open')}
                </button>
                {/* FR-34 (v0.12): копия молекулы без магазина */}
                <button
                  type="button"
                  aria-label={t('molecule.clone')}
                  title={t('molecule.clone')}
                  className="rounded bg-emerald-700 px-1.5 py-0.5 text-[10px] font-bold text-white hover:bg-emerald-600"
                  onClick={() => store.cloneMolecule(molecule.id)}
                >
                  +
                </button>
              </div>
            );
          })}

        {/* FR-7 (v0.11): контекстное меню связи — кратность, тип, удаление */}
        {bondMenuId && state.bonds[bondMenuId] && (() => {
          const bond = state.bonds[bondMenuId];
          const a = state.atoms[bond.atomIds[0]];
          const b = state.atoms[bond.atomIds[1]];
          const mid = { x: (a.position.x + b.position.x) / 2, y: (a.position.y + b.position.y) / 2 };
          return (
            <div
              data-bond-menu
              role="menu"
              aria-label={t('bond.menu.title')}
              className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-lg bg-slate-800 p-1.5 shadow-xl ring-1 ring-slate-600"
              style={{ left: mid.x, top: mid.y }}
            >
              <span className="px-1 text-[10px] text-slate-400">{t('bond.menu.order')}:</span>
              {([1, 2, 3] as const).map((order) => (
                <button
                  key={order}
                  type="button"
                  role="menuitem"
                  aria-label={t(`workspace.bondOrder.${order === 1 ? 'single' : order === 2 ? 'double' : 'triple'}`)}
                  aria-pressed={bond.kind === 'covalent' && bond.order === order}
                  className={`h-7 w-7 rounded text-xs font-bold ${
                    bond.kind === 'covalent' && bond.order === order
                      ? 'bg-sky-500 text-white'
                      : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                  }`}
                  onClick={() => {
                    store.changeBond(bond.id, order, 'covalent');
                    setBondMenuId(null);
                  }}
                >
                  {order}
                </button>
              ))}
              <button
                type="button"
                role="menuitem"
                aria-pressed={bond.kind === 'ionic'}
                className={`h-7 rounded px-2 text-xs font-semibold ${
                  bond.kind === 'ionic'
                    ? 'bg-violet-500 text-white'
                    : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                }`}
                onClick={() => {
                  store.changeBond(bond.id, 1, 'ionic');
                  setBondMenuId(null);
                }}
              >
                {t('bond.menu.ionic')}
              </button>
              <button
                type="button"
                role="menuitem"
                className="h-7 rounded bg-red-800 px-2 text-xs font-semibold text-red-100 hover:bg-red-700"
                onClick={() => {
                  store.breakBond(bond.id);
                  setBondMenuId(null);
                }}
              >
                {t('bond.menu.delete')}
              </button>
            </div>
          );
        })()}

        {/* FR-33: карточка атома — поповер, не модалка */}
        {cardAtom && (
          <div
            data-atom-card
            className="absolute z-10"
            style={{ left: cardAtom.position.x + 30, top: cardAtom.position.y - 20 }}
          >
            <AtomCardContent
              symbol={cardAtom.element}
              freeValence={freeValence(cardAtom, state.bonds)}
              layoutId={layoutId}
            />
          </div>
        )}

        {state.lastRejection && (
          <div
            role="alert"
            className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-lg bg-red-900/90 px-4 py-2 text-sm text-red-100"
          >
            {rejectionMessage(state.lastRejection)}
            <button
              type="button"
              className="rounded bg-red-800 px-2 py-0.5 text-xs hover:bg-red-700"
              onClick={() => store.clearRejection()}
            >
              {t('error.dismiss')}
            </button>
          </div>
        )}

        {/* FR-13…17: зона реакции */}
        <ReactionZone store={store} state={state} molecules={molecules} />
      </div>
    </section>
  );
}
