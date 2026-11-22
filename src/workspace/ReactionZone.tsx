// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import type { LabState, LabStore } from '../domain/labStore';
import type { MoleculeView } from '../domain/types';
import type { ReactionReportEntry, RunResult } from '../domain/reactionEngine';
import { getSubstance } from '../domain/data/substances';
import { fmt, Formula } from '../graph/format';
import { t } from '../i18n/ru';

/**
 * FR-13…17: зона реакции на столе + отчёт.
 * v0.15: зону можно перетаскивать за заголовок и растягивать за угол.
 * v0.16: принадлежность зоне — по центроиду в момент запуска, без ограничений на молекулы.
 */

interface ReactionZoneProps {
  store: LabStore;
  state: LabState;
  molecules: MoleculeView[];
}

function centroidInZone(molecule: MoleculeView, state: LabState): boolean {
  const zone = state.zone;
  const points = molecule.atomIds.map((id) => state.atoms[id].position);
  const cx = points.reduce((s, p) => s + p.x, 0) / points.length;
  const cy = points.reduce((s, p) => s + p.y, 0) / points.length;
  return cx >= zone.x && cx <= zone.x + zone.width && cy >= zone.y && cy <= zone.y + zone.height;
}

function EntryLine({ entry, highlight }: { entry: ReactionReportEntry; highlight?: boolean }) {
  return (
    <li className={`flex justify-between gap-2 ${highlight ? 'font-semibold text-amber-700 dark:text-amber-300' : ''}`}>
      <span>
        <Formula formula={entry.formula} /> {entry.name}
        {highlight ? ` ← ${t('reaction.limiting')}` : ''}
      </span>
      <span className="text-slate-600 dark:text-slate-300">
        {t('reaction.units', { moles: entry.moles, grams: fmt(entry.grams, entry.grams < 10 ? 2 : 1) })}
      </span>
    </li>
  );
}

function Outcome({ outcome, onClose }: { outcome: RunResult; onClose: () => void }) {
  if (!outcome.ok) {
    return (
      <div role="alert" className="absolute bottom-4 right-4 w-96 rounded-xl bg-white p-4 text-sm shadow-xl ring-1 ring-red-300 dark:bg-slate-800 dark:ring-red-800">
        <p className="font-semibold text-red-600 dark:text-red-300">
          {outcome.missing.length > 0 ? t('reaction.notEnough') : t('reaction.noReaction')}
        </p>
        {outcome.missing.length > 0 && (
          <ul className="mt-1 text-slate-600 dark:text-slate-300">
            {outcome.missing.map((m) => (
              <li key={m.substanceId}>
                <Formula formula={getSubstance(m.substanceId).formula} /> {getSubstance(m.substanceId).name}:{' '}
                {t('reaction.need', { need: m.need, have: m.have })}
              </li>
            ))}
          </ul>
        )}
        {outcome.suggestions.length > 0 && (
          <div className="mt-2">
            <p className="text-slate-500 dark:text-slate-400">{t('reaction.suggestions')}</p>
            <ul className="mt-1 space-y-1 text-slate-600 dark:text-slate-300">
              {outcome.suggestions.map(({ reaction, missingSubstanceIds }) => (
                <li key={reaction.id}>
                  {reaction.equation}
                  <span className="text-slate-500">
                    {' '}
                    — {t('reaction.missing', {
                      list: missingSubstanceIds.map((id) => getSubstance(id).name).join(', '),
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <button
          type="button"
          className="mt-3 rounded-md bg-slate-200 px-3 py-1 text-xs hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600"
          onClick={onClose}
        >
          {t('reaction.close')}
        </button>
      </div>
    );
  }

  const { report } = outcome;
  return (
    <div role="dialog" aria-label={t('reaction.report')} className="absolute bottom-4 right-4 w-96 rounded-xl bg-white p-4 text-sm shadow-xl ring-1 ring-emerald-300 dark:bg-slate-800 dark:ring-emerald-700">
      <p className="font-semibold text-slate-900 dark:text-slate-100">{report.reaction.equation}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{t(`reaction.type.${report.reaction.type}`)}</p>

      <p className="mt-2 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">{t('reaction.consumed')}</p>
      <ul className="space-y-0.5">
        {report.consumed.map((e) => (
          <EntryLine key={e.substanceId} entry={e} highlight={e.substanceId === report.limitingSubstanceId} />
        ))}
      </ul>
      <p className="mt-2 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">{t('reaction.produced')}</p>
      <ul className="space-y-0.5">
        {report.produced.map((e) => (
          <EntryLine key={e.substanceId} entry={e} />
        ))}
      </ul>
      {report.excess.length > 0 && (
        <>
          <p className="mt-2 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">{t('reaction.excess')}</p>
          <ul className="space-y-0.5">
            {report.excess.map((e) => (
              <EntryLine key={e.substanceId} entry={e} />
            ))}
          </ul>
        </>
      )}
      <button
        type="button"
        className="mt-3 rounded-md bg-slate-200 px-3 py-1 text-xs hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600"
        onClick={onClose}
      >
        {t('reaction.close')}
      </button>
    </div>
  );
}

export function ReactionZone({ store, state, molecules }: ReactionZoneProps) {
  const zone = state.zone;
  const reactants = molecules.filter((m) => centroidInZone(m, state));

  // v0.15: перетаскивание зоны за заголовок.
  function onHeaderPointerDown(e: React.PointerEvent) {
    e.stopPropagation();
    const drag = { lastX: e.clientX, lastY: e.clientY };
    const onMove = (ev: PointerEvent) => {
      store.moveZoneBy({ x: ev.clientX - drag.lastX, y: ev.clientY - drag.lastY });
      drag.lastX = ev.clientX;
      drag.lastY = ev.clientY;
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  // v0.15: растягивание за правый нижний угол.
  function onResizePointerDown(e: React.PointerEvent) {
    e.stopPropagation();
    const start = { x: e.clientX, y: e.clientY, width: zone.width, height: zone.height };
    const onMove = (ev: PointerEvent) => {
      store.resizeZone(start.width + ev.clientX - start.x, start.height + ev.clientY - start.y);
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  return (
    <>
      <div
        data-testid="reaction-zone"
        className="pointer-events-none absolute rounded-xl border-2 border-dashed border-emerald-600/60 dark:border-emerald-700/60"
        style={{ left: zone.x, top: zone.y, width: zone.width, height: zone.height }}
      >
        <div
          data-testid="reaction-zone-header"
          className="pointer-events-auto flex cursor-move items-center justify-between px-3 py-1.5"
          style={{ touchAction: 'none' }}
          onPointerDown={onHeaderPointerDown}
        >
          <span className="text-xs font-semibold text-emerald-600 select-none dark:text-emerald-500">
            {t('reaction.zone')}
          </span>
          <button
            type="button"
            disabled={reactants.length === 0}
            className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() =>
              store.runReaction(
                reactants.map((m) => m.id),
                { origin: { x: zone.x + 40, y: zone.y + 60 }, width: zone.width - 60 },
              )
            }
          >
            {t('reaction.run')}
          </button>
        </div>
        <span
          data-testid="reaction-zone-resize"
          className="pointer-events-auto absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize rounded-tl-md bg-emerald-700/60"
          style={{ touchAction: 'none' }}
          onPointerDown={onResizePointerDown}
        />
      </div>

      {state.reactionOutcome && (
        <Outcome outcome={state.reactionOutcome} onClose={() => store.clearReactionOutcome()} />
      )}
    </>
  );
}
