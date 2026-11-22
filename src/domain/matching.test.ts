// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from 'vitest';
import { findCatalogMatch } from './matching';
import type { AtomInstance, Bond, BondOrder } from './types';

let seq = 0;
function atom(element: string): AtomInstance {
  seq += 1;
  return { id: `a${seq}`, element, position: { x: 0, y: 0 } };
}

function bond(a: AtomInstance, b: AtomInstance, order: BondOrder): Bond {
  seq += 1;
  return { id: `b${seq}`, atomIds: [a.id, b.id], order, kind: 'covalent' };
}

describe('DR-6: сопоставление с каталогом по структуре, не по формуле', () => {
  it('вода: O с двумя одинарными O–H → «Вода»', () => {
    const o = atom('O');
    const h1 = atom('H');
    const h2 = atom('H');
    const match = findCatalogMatch([o, h1, h2], [bond(o, h1, 1), bond(o, h2, 1)]);
    expect(match?.substance.id).toBe('h2o');
    expect(match?.mapping.get(o.id)).toBe(0);
  });

  it('CO₂: O=C=O с двойными связями', () => {
    const c = atom('C');
    const o1 = atom('O');
    const o2 = atom('O');
    const match = findCatalogMatch([c, o1, o2], [bond(c, o1, 2), bond(c, o2, 2)]);
    expect(match?.substance.id).toBe('co2');
  });

  it('CO (C≡O) не путается с CO₂', () => {
    const c = atom('C');
    const o = atom('O');
    const match = findCatalogMatch([c, o], [bond(c, o, 3)]);
    expect(match?.substance.id).toBe('co');
  });

  it('C=O (двойная) — не CO из каталога: структура другая → null', () => {
    const c = atom('C');
    const o = atom('O');
    const match = findCatalogMatch([c, o], [bond(c, o, 2)]);
    expect(match).toBeNull();
  });

  it('H₂O₂: цепочка H–O–O–H распознаётся', () => {
    const h1 = atom('H');
    const o1 = atom('O');
    const o2 = atom('O');
    const h2 = atom('H');
    const match = findCatalogMatch(
      [h1, o1, o2, h2],
      [bond(h1, o1, 1), bond(o1, o2, 1), bond(o2, h2, 1)],
    );
    expect(match?.substance.id).toBe('h2o2');
  });

  it('метан: C с четырьмя H', () => {
    const c = atom('C');
    const hs = [atom('H'), atom('H'), atom('H'), atom('H')];
    const match = findCatalogMatch(
      [c, ...hs],
      hs.map((h) => bond(c, h, 1)),
    );
    expect(match?.substance.id).toBe('ch4');
  });

  it('H₂ и O₂ распознаются', () => {
    const h1 = atom('H');
    const h2 = atom('H');
    expect(findCatalogMatch([h1, h2], [bond(h1, h2, 1)])?.substance.id).toBe('h2');

    const o1 = atom('O');
    const o2 = atom('O');
    expect(findCatalogMatch([o1, o2], [bond(o1, o2, 2)])?.substance.id).toBe('o2');
  });

  it('некаталожная корректная структура (CH3) → null', () => {
    const c = atom('C');
    const hs = [atom('H'), atom('H'), atom('H')];
    const match = findCatalogMatch(
      [c, ...hs],
      hs.map((h) => bond(c, h, 1)),
    );
    expect(match).toBeNull();
  });
});
