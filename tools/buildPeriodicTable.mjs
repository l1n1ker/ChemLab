// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Dev-time инструмент (TR-3, SPEC.md 15.4): генерирует src/domain/data/periodicTable.ts
 * из снапшота komed3/periodic-table (MIT) + русских названий (фиксируются здесь, NFR-4).
 *
 * Источник: https://raw.githubusercontent.com/komed3/periodic-table/main/_db/elements.json
 * Дата снимка: 2026-11-22. Запуск: node tools/buildPeriodicTable.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';

const RU_NAMES = [
  'Водород', 'Гелий', 'Литий', 'Бериллий', 'Бор', 'Углерод', 'Азот', 'Кислород', 'Фтор', 'Неон',
  'Натрий', 'Магний', 'Алюминий', 'Кремний', 'Фосфор', 'Сера', 'Хлор', 'Аргон', 'Калий', 'Кальций',
  'Скандий', 'Титан', 'Ванадий', 'Хром', 'Марганец', 'Железо', 'Кобальт', 'Никель', 'Медь', 'Цинк',
  'Галлий', 'Германий', 'Мышьяк', 'Селен', 'Бром', 'Криптон', 'Рубидий', 'Стронций', 'Иттрий', 'Цирконий',
  'Ниобий', 'Молибден', 'Технеций', 'Рутений', 'Родий', 'Палладий', 'Серебро', 'Кадмий', 'Индий', 'Олово',
  'Сурьма', 'Теллур', 'Иод', 'Ксенон', 'Цезий', 'Барий', 'Лантан', 'Церий', 'Празеодим', 'Неодим',
  'Прометий', 'Самарий', 'Европий', 'Гадолиний', 'Тербий', 'Диспрозий', 'Гольмий', 'Эрбий', 'Тулий', 'Иттербий',
  'Лютеций', 'Гафний', 'Тантал', 'Вольфрам', 'Рений', 'Осмий', 'Иридий', 'Платина', 'Золото', 'Ртуть',
  'Таллий', 'Свинец', 'Висмут', 'Полоний', 'Астат', 'Радон', 'Франций', 'Радий', 'Актиний', 'Торий',
  'Протактиний', 'Уран', 'Нептуний', 'Плутоний', 'Америций', 'Кюрий', 'Берклий', 'Калифорний', 'Эйнштейний', 'Фермий',
  'Менделевий', 'Нобелий', 'Лоуренсий', 'Резерфордий', 'Дубний', 'Сиборгий', 'Борий', 'Хассий', 'Мейтнерий', 'Дармштадтий',
  'Рентгений', 'Коперниций', 'Нихоний', 'Флеровий', 'Московий', 'Ливерморий', 'Теннессин', 'Оганесон',
];

const CATEGORY_MAP = {
  nonmetal: 'nonmetal',
  noblegas: 'nonmetal',
  halogen: 'nonmetal',
  metalloid: 'metalloid',
  alkalimetal: 'metal',
  alkalineearthmetal: 'metal',
  metal: 'metal',
  transitionmetal: 'metal',
  lanthanoide: 'metal',
  actinoide: 'metal',
  unknown: null,
};

const PHASE_MAP = { gas: 'gas', liquid: 'liquid', solid: 'solid' };

const src = JSON.parse(readFileSync(new URL('./elements.src.json', import.meta.url), 'utf8'));

const entries = Object.values(src)
  .map((e) => {
    const fRow = e.set === 'lanthanoide' ? 'lanthanides' : e.set === 'actinoide' ? 'actinides' : null;
    return {
      number: e.number,
      symbol: e.symbol,
      name: RU_NAMES[e.number - 1],
      category: CATEGORY_MAP[e.set] ?? null,
      iupacGroup: fRow ? null : e.group,
      period: e.period,
      fRow,
      stateAtSTP: PHASE_MAP[e.phase] ?? null,
    };
  })
  .sort((a, b) => a.number - b.number);

if (entries.length !== 118) throw new Error(`Ожидалось 118 элементов, получено ${entries.length}`);

const header = `// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Полная периодическая таблица для магазина-модалки (FR-28…30, FR-33).
 * Сгенерировано tools/buildPeriodicTable.mjs из komed3/periodic-table (MIT),
 * снимок 2026-11-22; русские названия — справочные (NFR-4).
 * Не редактировать вручную — править генератор и перегенерировать.
 */
`;

const body = `export type ElementCategory = 'metal' | 'nonmetal' | 'metalloid';

export interface PeriodicEntry {
  number: number;
  symbol: string;
  /** Русское название. */
  name: string;
  /** null — сверхтяжёлые без установленной категории (P1: не выдумываем). */
  category: ElementCategory | null;
  /** Группа IUPAC 1–18; null у лантаноидов/актиноидов. */
  iupacGroup: number | null;
  period: number;
  fRow: 'lanthanides' | 'actinides' | null;
  stateAtSTP: 'solid' | 'liquid' | 'gas' | null;
}

export const PERIODIC_TABLE: PeriodicEntry[] = ${JSON.stringify(entries, null, 2)};

export function getPeriodicEntry(symbol: string): PeriodicEntry {
  const entry = PERIODIC_TABLE.find((e) => e.symbol === symbol);
  if (!entry) throw new Error(\`Нет элемента в таблице: \${symbol}\`);
  return entry;
}
`;

writeFileSync(new URL('../src/domain/data/periodicTable.ts', import.meta.url), header + body);
console.log(`periodicTable.ts: ${entries.length} элементов`);
