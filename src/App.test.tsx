// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { App } from './App';

/** Критерии приёмки FR-1…FR-7 (SPEC.md, раздел 5) как тест-кейсы. */

function atomNodes(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>('[data-atom-id]')];
}

function atomPalette() {
  return within(screen.getByLabelText('Магазин атомов'));
}

function substancePalette() {
  return within(screen.getByLabelText('Готовые вещества'));
}

function atomByElement(container: HTMLElement, element: string): HTMLElement {
  const node = atomNodes(container).find((n) => n.dataset.element === element);
  if (!node) throw new Error(`Атом ${element} не найден на столе`);
  return node;
}

function atomsByElement(container: HTMLElement, element: string): HTMLElement[] {
  return atomNodes(container).filter((n) => n.dataset.element === element);
}

function bondHandle(atomNode: HTMLElement): HTMLElement {
  return within(atomNode).getByLabelText('Ручка связи');
}

function createBond(from: HTMLElement, to: HTMLElement) {
  fireEvent.pointerDown(bondHandle(from), { clientX: 0, clientY: 0 });
  fireEvent.pointerUp(to, { clientX: 0, clientY: 0 });
  fireEvent.pointerUp(window, { clientX: 0, clientY: 0 });
}

async function buildWater(container: HTMLElement, user: ReturnType<typeof userEvent.setup>) {
  await user.click(atomPalette().getByRole('button', { name: /Кислород/ }));
  await user.click(atomPalette().getByRole('button', { name: /Водород/ }));
  await user.click(atomPalette().getByRole('button', { name: /Водород/ }));
  const oxygen = atomByElement(container, 'O');
  const hydrogens = atomsByElement(container, 'H');
  createBond(oxygen, hydrogens[0]);
  createBond(oxygen, hydrogens[1]);
  return oxygen;
}

function select(atomNode: HTMLElement) {
  fireEvent.pointerDown(atomNode, { clientX: 0, clientY: 0 });
  fireEvent.pointerUp(window, { clientX: 0, clientY: 0 });
}

describe('FR-1: магазин атомов', () => {
  it('клик — атом появляется на столе, в магазине остаётся доступным', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await user.click(atomPalette().getByRole('button', { name: /Кислород/ }));

    expect(atomByElement(container, 'O')).toBeInTheDocument();
    expect(atomPalette().getByRole('button', { name: /Кислород/ })).toBeInTheDocument();
  });

  it('перетаскивание из магазина на стол кладёт атом в точку броска', () => {
    const { container } = render(<App />);
    const workspace = screen.getByTestId('workspace');
    vi.spyOn(workspace, 'getBoundingClientRect').mockReturnValue({
      left: 0, top: 0, right: 800, bottom: 600, width: 800, height: 600, x: 0, y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    const paletteButton = atomPalette().getByRole('button', { name: /Водород/ });
    fireEvent.pointerDown(paletteButton, { clientX: 10, clientY: 10 });
    fireEvent.pointerMove(window, { clientX: 200, clientY: 150 });
    fireEvent.pointerUp(window, { clientX: 200, clientY: 150 });

    const atom = atomByElement(container, 'H');
    expect(atom.style.left).toBe('200px');
    expect(atom.style.top).toBe('150px');
  });
});

describe('FR-3: символ и свободные валентности', () => {
  it('свободные валентности убывают по мере создания связей', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await user.click(atomPalette().getByRole('button', { name: /Кислород/ }));
    await user.click(atomPalette().getByRole('button', { name: /Водород/ }));

    const oxygen = atomByElement(container, 'O');
    const hydrogen = atomByElement(container, 'H');
    expect(oxygen.textContent).toContain('2');
    expect(hydrogen.textContent).toContain('1');

    createBond(oxygen, hydrogen);

    expect(oxygen.textContent).toContain('1');
    expect(hydrogen.textContent).toContain('0');
  });
});

describe('FR-4: ручное создание связи с выбором кратности', () => {
  it('US-1 end-to-end: O + 2H → молекула «Вода · H₂O · 18,015 г/моль · H 11,2 %, O 88,8 %»', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    const oxygen = await buildWater(container, user);

    select(oxygen);

    const panel = screen.getByLabelText('Свойства вещества');
    expect(panel.textContent).toContain('Вода');
    expect(panel.textContent).toContain('H2O');
    expect(panel.textContent).toContain('18,015');
    expect(panel.textContent).toContain('11,2');
    expect(panel.textContent).toContain('88,8');
  });

  it('выбор кратности 2: O=O распознаётся как кислород O₂', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await user.click(atomPalette().getByRole('button', { name: /Кислород/ }));
    await user.click(atomPalette().getByRole('button', { name: /Кислород/ }));

    await user.click(screen.getByRole('button', { name: 'Двойная' }));
    const oxygens = atomsByElement(container, 'O');
    createBond(oxygens[0], oxygens[1]);
    select(oxygens[0]);

    const panel = screen.getByLabelText('Свойства вещества');
    expect(panel.textContent).toContain('Кислород');
    expect(panel.textContent).toContain('O2');
  });

  it('связная группа перетаскивается как единая молекула', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    const oxygen = await buildWater(container, user);

    const before = atomByElement(container, 'H').style.left;
    fireEvent.pointerDown(oxygen, { clientX: 100, clientY: 100 });
    fireEvent.pointerMove(window, { clientX: 150, clientY: 130 });
    fireEvent.pointerUp(window, { clientX: 150, clientY: 130 });

    const hydrogen = atomByElement(container, 'H');
    expect(hydrogen.style.left).not.toBe(before);
  });
});

describe('FR-5: отказ с объяснением при нарушении валентности', () => {
  it('вторая связь к H отклоняется: «Водород одновалентен»', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await user.click(atomPalette().getByRole('button', { name: /Водород/ }));
    await user.click(atomPalette().getByRole('button', { name: /Водород/ }));
    await user.click(atomPalette().getByRole('button', { name: /Кислород/ }));

    const [h1, h2] = atomsByElement(container, 'H');
    const oxygen = atomByElement(container, 'O');
    createBond(h1, h2);
    createBond(h1, oxygen);

    expect(screen.getByRole('alert').textContent).toContain('Водород одновалентен');
    // Связь не создана: линий связи на столе по-прежнему одна.
    expect(screen.getAllByLabelText('Связь (клик — разорвать)')).toHaveLength(1);
  });

  it('третий H к кислороду воды отклоняется с объяснением', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    const oxygen = await buildWater(container, user);

    await user.click(atomPalette().getByRole('button', { name: /Водород/ }));
    const hydrogen = atomsByElement(container, 'H')[2];
    createBond(oxygen, hydrogen);

    expect(screen.getByRole('alert').textContent).toContain(
      'У атома O уже заняты все валентности (2 из 2)',
    );
  });
});

describe('FR-6: панель свойств', () => {
  it('валентно-корректное некаталожное соединение помечается гипотетическим', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await user.click(atomPalette().getByRole('button', { name: /Углерод/ }));
    for (let i = 0; i < 3; i++) {
      await user.click(atomPalette().getByRole('button', { name: /Водород/ }));
    }

    const carbon = atomByElement(container, 'C');
    for (const hydrogen of atomsByElement(container, 'H')) {
      createBond(carbon, hydrogen);
    }
    select(carbon);

    const panel = screen.getByLabelText('Свойства вещества');
    expect(panel.textContent).toContain('Гипотетическое соединение');
    expect(panel.textContent).toContain('CH3');
  });
});

describe('FR-7: разрыв связи', () => {
  it('клик по связи разрывает её, молекула распадается на две части', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await buildWater(container, user);

    const bonds = screen.getAllByLabelText('Связь (клик — разорвать)');
    expect(bonds).toHaveLength(2);

    await user.click(bonds[0]);

    expect(screen.getAllByLabelText('Связь (клик — разорвать)')).toHaveLength(1);
  });
});

describe('FR-2: магазин готовых веществ', () => {
  it('вода из магазина появляется на столе целой молекулой', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await user.click(substancePalette().getByRole('button', { name: /^Вода/ }));

    expect(atomNodes(container)).toHaveLength(3);
    expect(screen.getAllByLabelText('Связь (клик — разорвать)')).toHaveLength(2);

    select(atomByElement(container, 'O'));
    const panel = screen.getByLabelText('Свойства вещества');
    expect(panel.textContent).toContain('Вода');
    expect(panel.textContent).toContain('оксид');
  });
});

describe('FR-8: конвертер количества (UI)', () => {
  it('Given выбрана H₂O, When в поле «Масса» введено 36 г, Then «Количество» = 2 моль, «Число молекул» ≈ 1,204·10²⁴', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    const oxygen = await buildWater(container, user);
    select(oxygen);

    const massInput = screen.getByLabelText('Масса, г');
    fireEvent.change(massInput, { target: { value: '36' } });

    expect(screen.getByLabelText('Количество, моль')).toHaveValue('2');
    expect(screen.getByLabelText('Число молекул')).toHaveValue('1,203·10²⁴');
    // Вода — жидкость: поле объёма скрыто.
    expect(screen.queryByLabelText('Объём (н.у.), л')).not.toBeInTheDocument();
  });

  it('Given выбран CO₂ (газ), When введено 3 моль, Then объём 67,2 л', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await user.click(substancePalette().getByRole('button', { name: /Диоксид углерода/ }));
    select(atomByElement(container, 'C'));

    const molesInput = screen.getByLabelText('Количество, моль');
    fireEvent.change(molesInput, { target: { value: '3' } });

    expect(screen.getByLabelText('Объём (н.у.), л')).toHaveValue('67,2');
  });
});

describe('DR-4: ионная связь (UI, явный режим)', () => {
  it('Na–Cl в ионном режиме → хлорид натрия с классом «соль»', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await user.click(atomPalette().getByRole('button', { name: /Натрий/ }));
    await user.click(atomPalette().getByRole('button', { name: /Хлор/ }));

    await user.click(screen.getByRole('button', { name: 'Ионная связь' }));
    createBond(atomByElement(container, 'Na'), atomByElement(container, 'Cl'));
    select(atomByElement(container, 'Na'));

    const panel = screen.getByLabelText('Свойства вещества');
    expect(panel.textContent).toContain('Хлорид натрия');
    expect(panel.textContent).toContain('соль');
    expect(panel.textContent).toContain('Na: +1');
    expect(panel.textContent).toContain('Cl: −1');
  });

  it('в ионном режиме кратность не применяется: повторная попытка отклоняется', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await user.click(atomPalette().getByRole('button', { name: /Натрий/ }));
    await user.click(atomPalette().getByRole('button', { name: /Хлор/ }));

    await user.click(screen.getByRole('button', { name: 'Ионная связь' }));
    const na = atomByElement(container, 'Na');
    const cl = atomByElement(container, 'Cl');
    createBond(na, cl);
    createBond(na, cl);

    expect(screen.getByRole('alert').textContent).toContain(
      'Ионная связь между этими атомами уже есть',
    );
  });
});
