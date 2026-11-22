// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import { useRef, useState } from 'react';
import { deriveMolecules, type LabState, type LabStore } from '../domain/labStore';
import { getElement } from '../domain/data/elements';
import type { BondKind, BondOrder } from '../domain/types';
import { freeValence } from '../domain/validation';
import { fmt, Formula } from '../graph/format';
import { rejectionMessage } from '../i18n/rejectionMessage';
import { t } from '../i18n/ru';
import { AtomCardContent } from './AtomCard';
import { BondLayer } from './BondLayer';

/**
 * Рабочий стол 2D (SPEC.md 4.2): рендер узлов и жесты.
 * Никакой химии внутри — только команды в LabStore (раздел 9).
 * Клик по атому — карточка (FR-33); двойной клик — модалка результата (FR-34);
 * у молекул — компактная подпись (формула + молярная масса).
 */

interface WorkspaceCanvasProps {
  store: LabStore;
  state: LabState;
  innerRef: (el: HTMLDivElement | null) => void;
  layoutId: string;
  onOpenShop: () => void;
  onInspect: (moleculeId: string) => void;
}

const ORDER_KEYS = [
  { order: 1, key: 'workspace.bondOrder.single' },
  { order: 2, key: 'workspace.bondOrder.double' },
  { order: 3, key: 'workspace.bondOrder.triple' },
] as const;

export function WorkspaceCanvas({ store, state, innerRef, layoutId, onOpenShop, onInspect }: WorkspaceCanvasProps) {
  const [bondOrder, setBondOrder] = useState<BondOrder>(1);
  const [bondKind, setBondKind] = useState<BondKind>('covalent');
  const [bondDrag, setBondDrag] = useState<{ fromId: string; x: number; y: number } | null>(null);
  const [atomCardId, setAtomCardId] = useState<string | null>(null);
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
    if (current && current.fromId !== atomId) {
      store.createBond(current.fromId, atomId, bondKind === 'ionic' ? 1 : bondOrder, bondKind);
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
        <span className="ml-4 text-sm text-slate-300">{t('workspace.bondOrder')}:</span>
        {ORDER_KEYS.map(({ order, key }) => (
          <button
            key={order}
            type="button"
            aria-label={t(key)}
            aria-pressed={bondKind === 'covalent' && bondOrder === order}
            onClick={() => {
              setBondKind('covalent');
              setBondOrder(order);
            }}
            className={`h-8 w-8 rounded-md font-semibold ${
              bondKind === 'covalent' && bondOrder === order
                ? 'bg-sky-500 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {order}
          </button>
        ))}
        {/* DR-4: ионная связь — явный режим (v0.6, Q1) */}
        <button
          type="button"
          aria-label={t('workspace.bondKind.ionic')}
          aria-pressed={bondKind === 'ionic'}
          onClick={() => setBondKind('ionic')}
          className={`h-8 rounded-md px-2 text-sm font-semibold ${
            bondKind === 'ionic'
              ? 'bg-violet-500 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          ⇄
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
          if (!target.closest('[data-atom-id]') && !target.closest('[data-atom-card]')) {
            setAtomCardId(null);
          }
        }}
      >
        {Object.keys(state.atoms).length === 0 && (
          <p className="absolute inset-0 flex items-center justify-center text-slate-500">
            {t('workspace.empty')}
          </p>
        )}

        <BondLayer atoms={state.atoms} bonds={state.bonds} onBreak={(id) => store.breakBond(id)} />

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
              className={`absolute flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center rounded-full border-2 border-slate-500 font-bold select-none ${
                element.symbol === 'H' ? 'text-slate-900' : 'text-white'
              }`}
              style={{
                left: atom.position.x,
                top: atom.position.y,
                backgroundColor: element.cpkColor,
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
              </div>
            );
          })}

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
      </div>
    </section>
  );
}
