// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import type { AtomInstance, Bond } from '../domain/types';
import { t } from '../i18n/ru';

/**
 * Слой связей стола: SVG-линии между атомами.
 * FR-7: клик / Enter / Delete по связи разрывает её.
 */

interface BondLayerProps {
  atoms: Record<string, AtomInstance>;
  bonds: Record<string, Bond>;
  onBreak: (bondId: string) => void;
}

const OFFSETS: Record<number, number[]> = {
  1: [0],
  2: [-3.5, 3.5],
  3: [-6, 0, 6],
};

export function BondLayer({ atoms, bonds, onBreak }: BondLayerProps) {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full">
      {Object.values(bonds).map((bond) => {
        const a = atoms[bond.atomIds[0]];
        const b = atoms[bond.atomIds[1]];
        if (!a || !b) return null;
        const dx = b.position.x - a.position.x;
        const dy = b.position.y - a.position.y;
        const len = Math.hypot(dx, dy) || 1;
        const nx = (-dy / len) * 1;
        const ny = (dx / len) * 1;
        return (
          <g key={bond.id}>
            {OFFSETS[bond.order].map((offset) => (
              <line
                key={offset}
                x1={a.position.x + nx * offset}
                y1={a.position.y + ny * offset}
                x2={b.position.x + nx * offset}
                y2={b.position.y + ny * offset}
                stroke="#94a3b8"
                strokeWidth={2.5}
              />
            ))}
            <line
              data-bond-id={bond.id}
              role="button"
              tabIndex={0}
              aria-label={t('workspace.bondLabel')}
              x1={a.position.x}
              y1={a.position.y}
              x2={b.position.x}
              y2={b.position.y}
              stroke="transparent"
              strokeWidth={16}
              className="cursor-pointer"
              style={{ pointerEvents: 'stroke' }}
              onClick={() => onBreak(bond.id)}
              onKeyDown={(e) => {
                if (e.key === 'Delete' || e.key === 'Backspace' || e.key === 'Enter') {
                  onBreak(bond.id);
                }
              }}
            />
          </g>
        );
      })}
    </svg>
  );
}
