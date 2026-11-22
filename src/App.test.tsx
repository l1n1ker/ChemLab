// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from './App';

/** Критерии приёмки FR-1…FR-8 и FR-28…FR-34 (SPEC.md, раздел 5) как тест-кейсы. */

function atomNodes(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>('[data-atom-id]')];
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

async function openShop(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Магазин' }));
  return screen.getByRole('dialog');
}

function cell(symbol: string): HTMLElement {
  const dialog = screen.getByRole('dialog');
  const el = dialog.querySelector<HTMLElement>(`[data-element-cell="${symbol}"]`);
  if (!el) throw new Error(`Ячейка ${symbol} не найдена`);
  return el;
}

function card(substanceId: string): HTMLElement {
  const dialog = screen.getByRole('dialog');
  const el = dialog.querySelector<HTMLElement>(`[data-substance-card="${substanceId}"]`);
  if (!el) throw new Error(`Карточка ${substanceId} не найдена`);
  return el;
}

async function takeAtoms(user: ReturnType<typeof userEvent.setup>, symbols: string[]) {
  await openShop(user);
  for (const symbol of symbols) {
    await user.click(cell(symbol));
  }
  await user.click(screen.getByRole('button', { name: 'Готово' }));
}

async function buildWater(container: HTMLElement, user: ReturnType<typeof userEvent.setup>) {
  await takeAtoms(user, ['O', 'H', 'H']);
  const oxygen = atomByElement(container, 'O');
  const hydrogens = atomsByElement(container, 'H');
  createBond(oxygen, hydrogens[0]);
  createBond(oxygen, hydrogens[1]);
  return oxygen;
}

function inspect(atomNode: HTMLElement) {
  fireEvent.doubleClick(atomNode);
}

describe('FR-28: магазин — модалка с периодической таблицей и корзиной', () => {
  it('полная таблица: 18 элементов активны, остальные затемнены с подсказкой', async () => {
    const user = userEvent.setup();
    render(<App />);
    await openShop(user);

    expect(cell('O').dataset.dimmed).toBeUndefined();
    expect(cell('Og').dataset.dimmed).toBeUndefined(); // недоступен ≠ затемнён фильтром
    expect(cell('Og').getAttribute('aria-disabled')).toBe('true');
    expect(cell('Og').title).toContain('Откроется позже');
  });

  it('корзина O×1 + H×2 → «Готово» → три атома рядком от верхнего левого угла', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await openShop(user);

    await user.click(cell('O'));
    await user.click(cell('H'));
    await user.click(cell('H'));

    // Корзина: чипы со счётчиками; модалка не закрылась при выборе.
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'H ×2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'O' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Готово' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const atoms = atomNodes(container);
    expect(atoms).toHaveLength(3);
    expect(atoms.map((a) => a.style.top)).toEqual(['70px', '70px', '70px']);
    const xs = atoms.map((a) => parseInt(a.style.left)).sort((a, b) => a - b);
    expect(xs).toEqual([60, 140, 220]);
  });

  it('Esc — отмена: корзина очищается, на столе ничего не появляется', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await openShop(user);
    await user.click(cell('O'));
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(atomNodes(container)).toHaveLength(0);
  });

  it('FR-1 сохраняется: взятие неограниченно (два захода по одному O)', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await takeAtoms(user, ['O']);
    await takeAtoms(user, ['O']);
    expect(atomsByElement(container, 'O')).toHaveLength(2);
  });
});

describe('FR-29: фильтры и поиск таблицы', () => {
  it('фильтр «неметалл»: 10 совпадений, сетка не перестраивается, затемнённые некликабельны', async () => {
    const user = userEvent.setup();
    render(<App />);
    await openShop(user);

    await user.selectOptions(screen.getByLabelText('Категория'), 'nonmetal');

    expect(screen.getByText('Совпадений: 10')).toBeInTheDocument();
    const na = cell('Na');
    expect(na.dataset.dimmed).toBe('true');
    // Позиция Na не изменилась (gridColumn всё ещё 2).
    expect(na.style.gridColumn).toBe('2');

    await user.click(na);
    expect(screen.getByText('Элемент не соответствует фильтру')).toBeInTheDocument();

    await user.click(within(screen.getByRole('status')).getByRole('button', { name: 'Сбросить фильтры' }));
    expect(screen.getByText('Совпадений: 18')).toBeInTheDocument();
  });

  it('текстовый поиск по названию и символу', async () => {
    const user = userEvent.setup();
    render(<App />);
    await openShop(user);

    await user.type(screen.getByPlaceholderText('Поиск: символ, название, формула'), 'кисл');
    expect(screen.getByText('Совпадений: 1')).toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText('Поиск: символ, название, формула'));
    await user.type(screen.getByPlaceholderText('Поиск: символ, название, формула'), 'Cl');
    expect(screen.getByText('Совпадений: 1')).toBeInTheDocument();
  });

  it('фильтры не влияют на корзину', async () => {
    const user = userEvent.setup();
    render(<App />);
    await openShop(user);
    await user.click(cell('O'));
    await user.selectOptions(screen.getByLabelText('Категория'), 'metal');
    expect(screen.getByRole('button', { name: 'O' })).toBeInTheDocument();
  });
});

describe('FR-30: раскладки таблицы', () => {
  it('переключение Менделеевская → IUPAC без закрытия, фильтры сохраняются', async () => {
    const user = userEvent.setup();
    render(<App />);
    await openShop(user);

    expect(screen.getByRole('button', { name: 'VII A' })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Категория'), 'nonmetal');

    await user.click(screen.getByRole('button', { name: 'IUPAC' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '17' })).toBeInTheDocument();
    expect(screen.getByText('Совпадений: 10')).toBeInTheDocument();
  });
});

describe('FR-31/FR-32: вкладка «Вещества»', () => {
  it('H₂O×1 и CO₂×2 → «Готово» → три молекулы на столе', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await openShop(user);
    await user.click(screen.getByRole('tab', { name: 'Вещества' }));

    await user.click(card('h2o'));
    await user.click(card('co2'));
    await user.click(card('co2'));
    expect(screen.getByRole('button', { name: /CO2 ×2/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Готово' }));

    expect(atomNodes(container)).toHaveLength(9); // 3 + 3 + 3 атома
    const labels = container.querySelectorAll('[data-molecule-label]');
    expect(labels).toHaveLength(3);
    expect(labels[0].textContent).toContain('18,015');
  });

  it('фильтр «кислота»: ярки только кислоты; поиск OH2 находит воду', async () => {
    const user = userEvent.setup();
    render(<App />);
    await openShop(user);
    await user.click(screen.getByRole('tab', { name: 'Вещества' }));

    await user.selectOptions(screen.getByLabelText('Класс'), 'acid');
    expect(card('hcl').dataset.dimmed).toBeUndefined();
    expect(card('h2s').dataset.dimmed).toBeUndefined();
    expect(card('h2o').dataset.dimmed).toBe('true');

    await user.selectOptions(screen.getByLabelText('Класс'), 'any');
    await user.type(screen.getByPlaceholderText('Поиск: символ, название, формула'), 'OH2');
    expect(card('h2o').dataset.dimmed).toBeUndefined();
    expect(card('h2o2').dataset.dimmed).toBe('true');
  });
});

describe('FR-4/FR-5: связи на столе', () => {
  it('US-1 через корзину: O + 2H → подпись «H₂O · 18,015», вода распознана', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await buildWater(container, user);

    const label = container.querySelector('[data-molecule-label]')!;
    expect(label.textContent).toContain('H2O');
    expect(label.textContent).toContain('18,015');
  });

  it('FR-5: вторая связь к H отклоняется — «Водород одновалентен»', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await takeAtoms(user, ['H', 'H', 'O']);

    const [h1, h2] = atomsByElement(container, 'H');
    const oxygen = atomByElement(container, 'O');
    createBond(h1, h2);
    createBond(h1, oxygen);

    expect(screen.getByRole('alert').textContent).toContain('Водород одновалентен');
    expect(screen.getAllByLabelText('Связь (клик — меню)')).toHaveLength(1);
  });

  it('третий H к кислороду воды отклоняется с объяснением', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    const oxygen = await buildWater(container, user);
    await takeAtoms(user, ['H']);

    const hydrogen = atomsByElement(container, 'H')[2];
    createBond(oxygen, hydrogen);

    expect(screen.getByRole('alert').textContent).toContain(
      'У атома O уже заняты все валентности (2 из 2)',
    );
  });
});

describe('FR-7: контекстное меню связи (v0.11)', () => {
  it('клик по связи открывает меню; «Удалить связь» разрывает её, подписи пересчитываются', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await buildWater(container, user);

    await user.click(screen.getAllByLabelText('Связь (клик — меню)')[0]);
    expect(screen.getByRole('menu', { name: 'Связь' })).toBeInTheDocument();

    await user.click(screen.getByRole('menuitem', { name: 'Удалить связь' }));

    expect(screen.getAllByLabelText('Связь (клик — меню)')).toHaveLength(1);
    // Осталась молекула HO — одна подпись вместо H₂O.
    const labels = container.querySelectorAll('[data-molecule-label]');
    expect(labels).toHaveLength(1);
    expect(labels[0].textContent).toContain('HO');
  });

  it('смена кратности через меню: O–O → O=O распознаётся как кислород', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await takeAtoms(user, ['O', 'O']);
    const oxygens = atomsByElement(container, 'O');
    createBond(oxygens[0], oxygens[1]);

    // Свежая связь — одинарная: подпись «O2» есть, вещество ещё не распознано.
    await user.click(screen.getByLabelText('Связь (клик — меню)'));
    await user.click(screen.getByRole('menuitem', { name: 'Двойная' }));

    inspect(oxygens[0]);
    const modal = screen.getByRole('dialog', { name: 'Просмотр результата' });
    expect(modal.textContent).toContain('Кислород');
  });

  it('смена кратности валидируется: O–H в воде нельзя сделать двойной', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await buildWater(container, user);

    await user.click(screen.getAllByLabelText('Связь (клик — меню)')[0]);
    await user.click(screen.getByRole('menuitem', { name: 'Двойная' }));

    expect(screen.getByRole('alert').textContent).toContain(
      'У атома O уже заняты все валентности (2 из 2)',
    );
    // Связь осталась одинарной.
    expect(container.querySelector('[data-molecule-label]')!.textContent).toContain('H2O');
  });
});

describe('FR-33: карточка атома', () => {
  it('клик по O с одной связью → поповер с данными элемента и свободной валентностью 1', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await takeAtoms(user, ['O', 'H']);
    createBond(atomByElement(container, 'O'), atomByElement(container, 'H'));

    const oxygen = atomByElement(container, 'O');
    fireEvent.pointerDown(oxygen, { clientX: 0, clientY: 0 });
    fireEvent.pointerUp(window, { clientX: 0, clientY: 0 });

    const card = container.querySelector('[data-atom-card]')!;
    expect(card.textContent).toContain('Кислород');
    expect(card.textContent).toContain('8');
    expect(card.textContent).toContain('15,999');
    expect(card.textContent).toContain('неметалл');
    expect(card.textContent).toContain('VI A');
    expect(card.textContent).toContain('Свободных валентностей');
    expect(card.textContent).toContain('1');
  });

  it('иконка ℹ в таблице открывает карточку элемента', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await openShop(user);
    await user.click(screen.getByRole('button', { name: 'Карточка элемента: Натрий' }));

    const info = container.querySelector('[data-atom-card]')!;
    expect(info.textContent).toContain('Натрий');
    expect(info.textContent).toContain('металл');
  });
});

describe('FR-34: модалка «Просмотр результата»', () => {
  it('двойной клик по воде → модалка с описанием, конвертером и 3D; стол не изменился', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    const oxygen = await buildWater(container, user);

    inspect(oxygen);

    const modal = screen.getByRole('dialog', { name: 'Просмотр результата' });
    expect(modal.textContent).toContain('Вода');
    expect(modal.textContent).toContain('H2O');
    expect(modal.textContent).toContain('18,015');
    expect(modal.textContent).toContain('11,2');
    expect(modal.textContent).toContain('88,8');
    expect(within(modal).getByLabelText('Масса, г')).toBeInTheDocument();
    // 3D-инспектор внутри модалки (в jsdom — fallback WebGL).
    expect(within(modal).getByLabelText('3D-инспектор')).toBeInTheDocument();
    // Стол под модалкой не изменился.
    expect(atomNodes(container)).toHaveLength(3);
  });

  it('«Разобрать на атомы» (приём FR-27): связи исчезают, модалка закрывается', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    const oxygen = await buildWater(container, user);
    inspect(oxygen);

    await user.click(screen.getByRole('button', { name: 'Разобрать на атомы' }));

    expect(screen.queryByRole('dialog', { name: 'Просмотр результата' })).not.toBeInTheDocument();
    expect(atomNodes(container)).toHaveLength(3);
    expect(screen.queryAllByLabelText('Связь (клик — меню)')).toHaveLength(0);
    expect(container.querySelectorAll('[data-molecule-label]')).toHaveLength(0);
  });

  it('FR-8: конвертер внутри модалки — 36 г воды → 2 моль, 1,203·10²⁴ молекул', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    const oxygen = await buildWater(container, user);
    inspect(oxygen);

    fireEvent.change(screen.getByLabelText('Масса, г'), { target: { value: '36' } });

    expect(screen.getByLabelText('Количество, моль')).toHaveValue('2');
    expect(screen.getByLabelText('Число молекул')).toHaveValue('1,203·10²⁴');
    expect(screen.queryByLabelText('Объём (н.у.), л')).not.toBeInTheDocument();
  });
});

describe('DR-4: ионная связь (UI, v0.11 — через меню связи)', () => {
  it('Na–Cl, смена типа на «Ионная» в меню → «Хлорид натрия», соль, степени окисления', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await takeAtoms(user, ['Na', 'Cl']);
    createBond(atomByElement(container, 'Na'), atomByElement(container, 'Cl'));

    await user.click(screen.getByLabelText('Связь (клик — меню)'));
    await user.click(screen.getByRole('menuitem', { name: 'Ионная' }));

    inspect(atomByElement(container, 'Na'));

    const modal = screen.getByRole('dialog', { name: 'Просмотр результата' });
    expect(modal.textContent).toContain('Хлорид натрия');
    expect(modal.textContent).toContain('соль');
    expect(modal.textContent).toContain('Na: +1');
    expect(modal.textContent).toContain('Cl: −1');
  });
});

describe('v0.12: быстрое клонирование без магазина', () => {
  it('пустой стол подсказывает про магазин (актуальный текст)', () => {
    render(<App />);
    expect(screen.getByText(/Нажмите «Магазин»/)).toBeInTheDocument();
  });

  it('FR-1: кнопка «+» на атоме добавляет его копию', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await takeAtoms(user, ['O']);

    await user.click(within(atomByElement(container, 'O')).getByLabelText('Добавить копию атома'));

    expect(atomsByElement(container, 'O')).toHaveLength(2);
  });

  it('FR-34: кнопка «+» в подписи молекулы клонирует молекулу целиком', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await buildWater(container, user);

    const label = container.querySelector('[data-molecule-label]')!;
    await user.click(within(label as HTMLElement).getByLabelText('Добавить копию молекулы'));

    expect(atomNodes(container)).toHaveLength(6);
    const labels = container.querySelectorAll('[data-molecule-label]');
    expect(labels).toHaveLength(2);
    for (const l of labels) expect(l.textContent).toContain('H2O');
  });
});

describe('FR-13…17 / US-3: зона реакции', () => {
  function dragBy(atomNode: HTMLElement, dx: number, dy: number) {
    fireEvent.pointerDown(atomNode, { clientX: 0, clientY: 0 });
    fireEvent.pointerMove(window, { clientX: dx, clientY: dy });
    fireEvent.pointerUp(window, { clientX: dx, clientY: dy });
  }

  async function placeSubstances(user: ReturnType<typeof userEvent.setup>, ids: string[]) {
    await openShop(user);
    await user.click(screen.getByRole('tab', { name: 'Вещества' }));
    for (const id of ids) {
      await user.click(card(id));
    }
    await user.click(screen.getByRole('button', { name: 'Готово' }));
  }

  it('кнопка запуска неактивна, пока зона пуста', async () => {
    const user = userEvent.setup();
    render(<App />);
    await placeSubstances(user, ['h2']);
    expect(screen.getByRole('button', { name: 'Запустить реакцию' })).toBeDisabled();
  });

  it('US-3: 2 H₂ + 1 O₂ в зоне → 2 H₂O на столе, отчёт с массами и избытком', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await placeSubstances(user, ['h2', 'h2', 'o2']);

    // Порядок атомов = порядок добавления: [h2, h2, o2] по 2 атома.
    // Тащим первый атом каждой молекулы — молекула движется целиком.
    let nodes = atomNodes(container);
    dragBy(nodes[0], 0, 420);
    nodes = atomNodes(container);
    dragBy(nodes[2], 0, 420);
    nodes = atomNodes(container);
    dragBy(nodes[4], -100, 420);

    await user.click(screen.getByRole('button', { name: 'Запустить реакцию' }));

    const report = screen.getByRole('dialog', { name: 'Отчёт о реакции' });
    expect(report.textContent).toContain('2H2 + O2 → 2H2O');
    expect(report.textContent).toContain('Получено');
    expect(report.textContent).toContain('2 моль');
    expect(report.textContent).toContain('36,0');

    const labels = container.querySelectorAll('[data-molecule-label]');
    expect(labels).toHaveLength(2);
    for (const label of labels) expect(label.textContent).toContain('H2O');
  });

  it('FR-16: только H₂ в зоне → подсказка «не хватает: Кислород»', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await placeSubstances(user, ['h2']);
    const hydrogen = atomByElement(container, 'H');
    dragBy(hydrogen, 0, 420);

    await user.click(screen.getByRole('button', { name: 'Запустить реакцию' }));

    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('Реакция не найдена');
    expect(alert.textContent).toContain('не хватает: Кислород');
    // Ничего не изъято.
    expect(atomNodes(container)).toHaveLength(2);
  });
});

describe('FR-13 (v0.15/v0.16): зона перетаскивается и растягивается, молекулы свободны', () => {
  function dragBy(node: HTMLElement, dx: number, dy: number) {
    fireEvent.pointerDown(node, { clientX: 0, clientY: 0 });
    fireEvent.pointerMove(window, { clientX: dx, clientY: dy });
    fireEvent.pointerUp(window, { clientX: dx, clientY: dy });
  }

  async function placeSubstances(user: ReturnType<typeof userEvent.setup>, ids: string[]) {
    await user.click(screen.getByRole('button', { name: 'Магазин' }));
    await user.click(screen.getByRole('tab', { name: 'Вещества' }));
    for (const id of ids) {
      await user.click(card(id));
    }
    await user.click(screen.getByRole('button', { name: 'Готово' }));
  }

  it('заголовок перетаскивает зону', () => {
    render(<App />);
    const header = screen.getByTestId('reaction-zone-header');
    dragBy(header, 50, 30);
    const zone = screen.getByTestId('reaction-zone');
    expect(zone.style.left).toBe('66px');
    expect(zone.style.top).toBe('460px');
  });

  it('угол растягивает зону; размер не меньше минимального', () => {
    render(<App />);
    const handle = screen.getByTestId('reaction-zone-resize');
    dragBy(handle, 60, 40);
    let zone = screen.getByTestId('reaction-zone');
    expect(zone.style.width).toBe('460px');
    expect(zone.style.height).toBe('290px');

    dragBy(handle, -500, -500);
    zone = screen.getByTestId('reaction-zone');
    expect(zone.style.width).toBe('200px');
    expect(zone.style.height).toBe('140px');
  });

  it('молекулу можно вытащить из зоны — тогда она не участвует в реакции', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await placeSubstances(user, ['h2o', 'h2']);

    // Затаскиваем обе молекулы в зону.
    dragBy(atomNodes(container)[0], 0, 420);
    dragBy(atomNodes(container)[3], 0, 420);

    // Вытаскиваем воду обратно: молекула движется свободно (v0.16, отмена заморозки).
    const waterAtom = atomNodes(container)[0];
    const beforeTop = waterAtom.style.top;
    dragBy(waterAtom, 0, -420);
    expect(atomNodes(container)[0].style.top).not.toBe(beforeTop);

    // Запуск: в зоне только H₂ — реакция не найдена, вода осталась на столе.
    await user.click(screen.getByRole('button', { name: 'Запустить реакцию' }));
    expect(screen.getByRole('alert').textContent).toContain('Реакция не найдена');
    expect(atomNodes(container)).toHaveLength(5);
  });

  it('связь молекулы внутри зоны удаляется через меню как обычно', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await placeSubstances(user, ['h2o']);
    dragBy(atomNodes(container)[0], 0, 420);

    await user.click(screen.getAllByLabelText('Связь (клик — меню)')[0]);
    await user.click(screen.getByRole('menuitem', { name: 'Удалить связь' }));

    // Одна связь разорвана, подпись пересчиталась в HO.
    expect(screen.getAllByLabelText('Связь (клик — меню)')).toHaveLength(1);
    const labels = container.querySelectorAll('[data-molecule-label]');
    expect(labels[0].textContent).toContain('HO');
  });
});

describe('FR-38: тема оформления', () => {
  function stubMatchMedia(matches: boolean) {
    window.matchMedia = ((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as typeof window.matchMedia;
  }

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    stubMatchMedia(false);
  });

  it('переключатель справа вверху: три режима, по умолчанию — системная', () => {
    stubMatchMedia(false);
    render(<App />);
    const group = screen.getByRole('group', { name: 'Тема оформления' });
    expect(within(group).getByRole('button', { name: 'Системная' })).toHaveAttribute('aria-pressed', 'true');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('выбор «Тёмная»/«Светлая» переключает класс dark и сохраняется', async () => {
    stubMatchMedia(false);
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Тёмная' }));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('chemlab.theme')).toBe('dark');

    await user.click(screen.getByRole('button', { name: 'Светлая' }));
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('chemlab.theme')).toBe('light');
  });

  it('выбор применяется при загрузке (перезагрузка сохраняет светлую/тёмную)', () => {
    stubMatchMedia(false);
    localStorage.setItem('chemlab.theme', 'dark');
    render(<App />);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('системная тема следует prefers-color-scheme ОС', () => {
    stubMatchMedia(true);
    localStorage.setItem('chemlab.theme', 'system');
    render(<App />);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
