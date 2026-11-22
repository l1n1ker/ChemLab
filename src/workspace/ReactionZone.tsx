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
 * Молекула считается в зоне, если её центроид внутри рамки.
 */

export const REACTION_ZONE = { x: 16, y: 430, width: 400, height: 250 };

interface ReactionZoneProps {
  store: LabStore;
  state: LabState;
  molecules: MoleculeView[];
}

function inZone(molecule: MoleculeView, state: LabState): boolean {
  const points = molecule.atomIds.map((id) => state.atoms[id].position);
  const cx = points.reduce((s, p) => s + p.x, 0) / points.length;
  const cy = points.reduce((s, p) => s + p.y, 0) / points.length;
  return (
    cx >= REACTION_ZONE.x &&
    cx <= REACTION_ZONE.x + REACTION_ZONE.width &&
    cy >= REACTION_ZONE.y &&
    cy <= REACTION_ZONE.y + REACTION_ZONE.height
  );
}

function EntryLine({ entry, highlight }: { entry: ReactionReportEntry; highlight?: boolean }) {
  return (
    <li className={`flex justify-between gap-2 ${highlight ? 'font-semibold text-amber-300' : ''}`}>
      <span>
        <Formula formula={entry.formula} /> {entry.name}
        {highlight ? ` ← ${t('reaction.limiting')}` : ''}
      </span>
      <span className="text-slate-300">
        {t('reaction.units', { moles: entry.moles, grams: fmt(entry.grams, entry.grams < 10 ? 2 : 1) })}
      </span>
    </li>
  );
}

function Outcome({ outcome, onClose }: { outcome: RunResult; onClose: () => void }) {
  if (!outcome.ok) {
    return (
      <div role="alert" className="absolute bottom-4 right-4 w-96 rounded-xl bg-slate-800 p-4 text-sm shadow-xl ring-1 ring-red-800">
        <p className="font-semibold text-red-300">
          {outcome.missing.length > 0 ? t('reaction.notEnough') : t('reaction.noReaction')}
        </p>
        {outcome.missing.length > 0 && (
          <ul className="mt-1 text-slate-300">
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
            <p className="text-slate-400">{t('reaction.suggestions')}</p>
            <ul className="mt-1 space-y-1 text-slate-300">
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
          className="mt-3 rounded-md bg-slate-700 px-3 py-1 text-xs hover:bg-slate-600"
          onClick={onClose}
        >
          {t('reaction.close')}
        </button>
      </div>
    );
  }

  const { report } = outcome;
  return (
    <div role="dialog" aria-label={t('reaction.report')} className="absolute bottom-4 right-4 w-96 rounded-xl bg-slate-800 p-4 text-sm shadow-xl ring-1 ring-emerald-700">
      <p className="font-semibold text-slate-100">{report.reaction.equation}</p>
      <p className="text-xs text-slate-400">{t(`reaction.type.${report.reaction.type}`)}</p>

      <p className="mt-2 text-xs font-semibold uppercase text-slate-400">{t('reaction.consumed')}</p>
      <ul className="space-y-0.5">
        {report.consumed.map((e) => (
          <EntryLine key={e.substanceId} entry={e} highlight={e.substanceId === report.limitingSubstanceId} />
        ))}
      </ul>
      <p className="mt-2 text-xs font-semibold uppercase text-slate-400">{t('reaction.produced')}</p>
      <ul className="space-y-0.5">
        {report.produced.map((e) => (
          <EntryLine key={e.substanceId} entry={e} />
        ))}
      </ul>
      {report.excess.length > 0 && (
        <>
          <p className="mt-2 text-xs font-semibold uppercase text-slate-400">{t('reaction.excess')}</p>
          <ul className="space-y-0.5">
            {report.excess.map((e) => (
              <EntryLine key={e.substanceId} entry={e} />
            ))}
          </ul>
        </>
      )}
      <button
        type="button"
        className="mt-3 rounded-md bg-slate-700 px-3 py-1 text-xs hover:bg-slate-600"
        onClick={onClose}
      >
        {t('reaction.close')}
      </button>
    </div>
  );
}

export function ReactionZone({ store, state, molecules }: ReactionZoneProps) {
  const reactants = molecules.filter((m) => inZone(m, state));

  return (
    <>
      <div
        data-testid="reaction-zone"
        className="absolute rounded-xl border-2 border-dashed border-emerald-700/60"
        style={{
          left: REACTION_ZONE.x,
          top: REACTION_ZONE.y,
          width: REACTION_ZONE.width,
          height: REACTION_ZONE.height,
        }}
      >
        <div className="flex items-center justify-between px-3 py-1.5">
          <span className="text-xs font-semibold text-emerald-500">{t('reaction.zone')}</span>
          <button
            type="button"
            disabled={reactants.length === 0}
            className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() =>
              store.runReaction(
                reactants.map((m) => m.id),
                {
                  origin: { x: REACTION_ZONE.x + 40, y: REACTION_ZONE.y + 60 },
                  width: REACTION_ZONE.width - 60,
                },
              )
            }
          >
            {t('reaction.run')}
          </button>
        </div>
      </div>

      {state.reactionOutcome && (
        <Outcome outcome={state.reactionOutcome} onClose={() => store.clearReactionOutcome()} />
      )}
    </>
  );
}
