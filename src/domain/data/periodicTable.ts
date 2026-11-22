// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Полная периодическая таблица для магазина-модалки (FR-28…30, FR-33).
 * Сгенерировано tools/buildPeriodicTable.mjs из komed3/periodic-table (MIT),
 * снимок 2026-11-22; русские названия — справочные (NFR-4).
 * Не редактировать вручную — править генератор и перегенерировать.
 */
export type ElementCategory = 'metal' | 'nonmetal' | 'metalloid';

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

export const PERIODIC_TABLE: PeriodicEntry[] = [
  {
    "number": 1,
    "symbol": "H",
    "name": "Водород",
    "category": "nonmetal",
    "iupacGroup": 1,
    "period": 1,
    "fRow": null,
    "stateAtSTP": "gas"
  },
  {
    "number": 2,
    "symbol": "He",
    "name": "Гелий",
    "category": "nonmetal",
    "iupacGroup": 18,
    "period": 1,
    "fRow": null,
    "stateAtSTP": "gas"
  },
  {
    "number": 3,
    "symbol": "Li",
    "name": "Литий",
    "category": "metal",
    "iupacGroup": 1,
    "period": 2,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 4,
    "symbol": "Be",
    "name": "Бериллий",
    "category": "metal",
    "iupacGroup": 2,
    "period": 2,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 5,
    "symbol": "B",
    "name": "Бор",
    "category": "metalloid",
    "iupacGroup": 13,
    "period": 2,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 6,
    "symbol": "C",
    "name": "Углерод",
    "category": "nonmetal",
    "iupacGroup": 14,
    "period": 2,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 7,
    "symbol": "N",
    "name": "Азот",
    "category": "nonmetal",
    "iupacGroup": 15,
    "period": 2,
    "fRow": null,
    "stateAtSTP": "gas"
  },
  {
    "number": 8,
    "symbol": "O",
    "name": "Кислород",
    "category": "nonmetal",
    "iupacGroup": 16,
    "period": 2,
    "fRow": null,
    "stateAtSTP": "gas"
  },
  {
    "number": 9,
    "symbol": "F",
    "name": "Фтор",
    "category": "nonmetal",
    "iupacGroup": 17,
    "period": 2,
    "fRow": null,
    "stateAtSTP": "gas"
  },
  {
    "number": 10,
    "symbol": "Ne",
    "name": "Неон",
    "category": "nonmetal",
    "iupacGroup": 18,
    "period": 2,
    "fRow": null,
    "stateAtSTP": "gas"
  },
  {
    "number": 11,
    "symbol": "Na",
    "name": "Натрий",
    "category": "metal",
    "iupacGroup": 1,
    "period": 3,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 12,
    "symbol": "Mg",
    "name": "Магний",
    "category": "metal",
    "iupacGroup": 2,
    "period": 3,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 13,
    "symbol": "Al",
    "name": "Алюминий",
    "category": "metal",
    "iupacGroup": 13,
    "period": 3,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 14,
    "symbol": "Si",
    "name": "Кремний",
    "category": "metalloid",
    "iupacGroup": 14,
    "period": 3,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 15,
    "symbol": "P",
    "name": "Фосфор",
    "category": "nonmetal",
    "iupacGroup": 15,
    "period": 3,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 16,
    "symbol": "S",
    "name": "Сера",
    "category": "nonmetal",
    "iupacGroup": 16,
    "period": 3,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 17,
    "symbol": "Cl",
    "name": "Хлор",
    "category": "nonmetal",
    "iupacGroup": 17,
    "period": 3,
    "fRow": null,
    "stateAtSTP": "gas"
  },
  {
    "number": 18,
    "symbol": "Ar",
    "name": "Аргон",
    "category": "nonmetal",
    "iupacGroup": 18,
    "period": 3,
    "fRow": null,
    "stateAtSTP": "gas"
  },
  {
    "number": 19,
    "symbol": "K",
    "name": "Калий",
    "category": "metal",
    "iupacGroup": 1,
    "period": 4,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 20,
    "symbol": "Ca",
    "name": "Кальций",
    "category": "metal",
    "iupacGroup": 2,
    "period": 4,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 21,
    "symbol": "Sc",
    "name": "Скандий",
    "category": "metal",
    "iupacGroup": 3,
    "period": 4,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 22,
    "symbol": "Ti",
    "name": "Титан",
    "category": "metal",
    "iupacGroup": 4,
    "period": 4,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 23,
    "symbol": "V",
    "name": "Ванадий",
    "category": "metal",
    "iupacGroup": 5,
    "period": 4,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 24,
    "symbol": "Cr",
    "name": "Хром",
    "category": "metal",
    "iupacGroup": 6,
    "period": 4,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 25,
    "symbol": "Mn",
    "name": "Марганец",
    "category": "metal",
    "iupacGroup": 7,
    "period": 4,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 26,
    "symbol": "Fe",
    "name": "Железо",
    "category": "metal",
    "iupacGroup": 8,
    "period": 4,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 27,
    "symbol": "Co",
    "name": "Кобальт",
    "category": "metal",
    "iupacGroup": 9,
    "period": 4,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 28,
    "symbol": "Ni",
    "name": "Никель",
    "category": "metal",
    "iupacGroup": 10,
    "period": 4,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 29,
    "symbol": "Cu",
    "name": "Медь",
    "category": "metal",
    "iupacGroup": 11,
    "period": 4,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 30,
    "symbol": "Zn",
    "name": "Цинк",
    "category": "metal",
    "iupacGroup": 12,
    "period": 4,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 31,
    "symbol": "Ga",
    "name": "Галлий",
    "category": "metal",
    "iupacGroup": 13,
    "period": 4,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 32,
    "symbol": "Ge",
    "name": "Германий",
    "category": "metalloid",
    "iupacGroup": 14,
    "period": 4,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 33,
    "symbol": "As",
    "name": "Мышьяк",
    "category": "metalloid",
    "iupacGroup": 15,
    "period": 4,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 34,
    "symbol": "Se",
    "name": "Селен",
    "category": "metalloid",
    "iupacGroup": 16,
    "period": 4,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 35,
    "symbol": "Br",
    "name": "Бром",
    "category": "nonmetal",
    "iupacGroup": 17,
    "period": 4,
    "fRow": null,
    "stateAtSTP": "liquid"
  },
  {
    "number": 36,
    "symbol": "Kr",
    "name": "Криптон",
    "category": "nonmetal",
    "iupacGroup": 18,
    "period": 4,
    "fRow": null,
    "stateAtSTP": "gas"
  },
  {
    "number": 37,
    "symbol": "Rb",
    "name": "Рубидий",
    "category": "metal",
    "iupacGroup": 1,
    "period": 5,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 38,
    "symbol": "Sr",
    "name": "Стронций",
    "category": "metal",
    "iupacGroup": 2,
    "period": 5,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 39,
    "symbol": "Y",
    "name": "Иттрий",
    "category": "metal",
    "iupacGroup": 3,
    "period": 5,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 40,
    "symbol": "Zr",
    "name": "Цирконий",
    "category": "metal",
    "iupacGroup": 4,
    "period": 5,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 41,
    "symbol": "Nb",
    "name": "Ниобий",
    "category": "metal",
    "iupacGroup": 5,
    "period": 5,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 42,
    "symbol": "Mo",
    "name": "Молибден",
    "category": "metal",
    "iupacGroup": 6,
    "period": 5,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 43,
    "symbol": "Tc",
    "name": "Технеций",
    "category": "metal",
    "iupacGroup": 7,
    "period": 5,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 44,
    "symbol": "Ru",
    "name": "Рутений",
    "category": "metal",
    "iupacGroup": 8,
    "period": 5,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 45,
    "symbol": "Rh",
    "name": "Родий",
    "category": "metal",
    "iupacGroup": 9,
    "period": 5,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 46,
    "symbol": "Pd",
    "name": "Палладий",
    "category": "metal",
    "iupacGroup": 10,
    "period": 5,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 47,
    "symbol": "Ag",
    "name": "Серебро",
    "category": "metal",
    "iupacGroup": 11,
    "period": 5,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 48,
    "symbol": "Cd",
    "name": "Кадмий",
    "category": "metal",
    "iupacGroup": 12,
    "period": 5,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 49,
    "symbol": "In",
    "name": "Индий",
    "category": "metal",
    "iupacGroup": 13,
    "period": 5,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 50,
    "symbol": "Sn",
    "name": "Олово",
    "category": "metal",
    "iupacGroup": 14,
    "period": 5,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 51,
    "symbol": "Sb",
    "name": "Сурьма",
    "category": "metalloid",
    "iupacGroup": 15,
    "period": 5,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 52,
    "symbol": "Te",
    "name": "Теллур",
    "category": "metalloid",
    "iupacGroup": 16,
    "period": 5,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 53,
    "symbol": "I",
    "name": "Иод",
    "category": "nonmetal",
    "iupacGroup": 17,
    "period": 5,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 54,
    "symbol": "Xe",
    "name": "Ксенон",
    "category": "nonmetal",
    "iupacGroup": 18,
    "period": 5,
    "fRow": null,
    "stateAtSTP": "gas"
  },
  {
    "number": 55,
    "symbol": "Cs",
    "name": "Цезий",
    "category": "metal",
    "iupacGroup": 1,
    "period": 6,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 56,
    "symbol": "Ba",
    "name": "Барий",
    "category": "metal",
    "iupacGroup": 2,
    "period": 6,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 57,
    "symbol": "La",
    "name": "Лантан",
    "category": "metal",
    "iupacGroup": null,
    "period": 6,
    "fRow": "lanthanides",
    "stateAtSTP": "solid"
  },
  {
    "number": 58,
    "symbol": "Ce",
    "name": "Церий",
    "category": "metal",
    "iupacGroup": null,
    "period": 6,
    "fRow": "lanthanides",
    "stateAtSTP": "solid"
  },
  {
    "number": 59,
    "symbol": "Pr",
    "name": "Празеодим",
    "category": "metal",
    "iupacGroup": null,
    "period": 6,
    "fRow": "lanthanides",
    "stateAtSTP": "solid"
  },
  {
    "number": 60,
    "symbol": "Nd",
    "name": "Неодим",
    "category": "metal",
    "iupacGroup": null,
    "period": 6,
    "fRow": "lanthanides",
    "stateAtSTP": "solid"
  },
  {
    "number": 61,
    "symbol": "Pm",
    "name": "Прометий",
    "category": "metal",
    "iupacGroup": null,
    "period": 6,
    "fRow": "lanthanides",
    "stateAtSTP": "solid"
  },
  {
    "number": 62,
    "symbol": "Sm",
    "name": "Самарий",
    "category": "metal",
    "iupacGroup": null,
    "period": 6,
    "fRow": "lanthanides",
    "stateAtSTP": "solid"
  },
  {
    "number": 63,
    "symbol": "Eu",
    "name": "Европий",
    "category": "metal",
    "iupacGroup": null,
    "period": 6,
    "fRow": "lanthanides",
    "stateAtSTP": "solid"
  },
  {
    "number": 64,
    "symbol": "Gd",
    "name": "Гадолиний",
    "category": "metal",
    "iupacGroup": null,
    "period": 6,
    "fRow": "lanthanides",
    "stateAtSTP": "solid"
  },
  {
    "number": 65,
    "symbol": "Tb",
    "name": "Тербий",
    "category": "metal",
    "iupacGroup": null,
    "period": 6,
    "fRow": "lanthanides",
    "stateAtSTP": "solid"
  },
  {
    "number": 66,
    "symbol": "Dy",
    "name": "Диспрозий",
    "category": "metal",
    "iupacGroup": null,
    "period": 6,
    "fRow": "lanthanides",
    "stateAtSTP": "solid"
  },
  {
    "number": 67,
    "symbol": "Ho",
    "name": "Гольмий",
    "category": "metal",
    "iupacGroup": null,
    "period": 6,
    "fRow": "lanthanides",
    "stateAtSTP": "solid"
  },
  {
    "number": 68,
    "symbol": "Er",
    "name": "Эрбий",
    "category": "metal",
    "iupacGroup": null,
    "period": 6,
    "fRow": "lanthanides",
    "stateAtSTP": "solid"
  },
  {
    "number": 69,
    "symbol": "Tm",
    "name": "Тулий",
    "category": "metal",
    "iupacGroup": null,
    "period": 6,
    "fRow": "lanthanides",
    "stateAtSTP": "solid"
  },
  {
    "number": 70,
    "symbol": "Yb",
    "name": "Иттербий",
    "category": "metal",
    "iupacGroup": null,
    "period": 6,
    "fRow": "lanthanides",
    "stateAtSTP": "solid"
  },
  {
    "number": 71,
    "symbol": "Lu",
    "name": "Лютеций",
    "category": "metal",
    "iupacGroup": null,
    "period": 6,
    "fRow": "lanthanides",
    "stateAtSTP": "solid"
  },
  {
    "number": 72,
    "symbol": "Hf",
    "name": "Гафний",
    "category": "metal",
    "iupacGroup": 4,
    "period": 6,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 73,
    "symbol": "Ta",
    "name": "Тантал",
    "category": "metal",
    "iupacGroup": 5,
    "period": 6,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 74,
    "symbol": "W",
    "name": "Вольфрам",
    "category": "metal",
    "iupacGroup": 6,
    "period": 6,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 75,
    "symbol": "Re",
    "name": "Рений",
    "category": "metal",
    "iupacGroup": 7,
    "period": 6,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 76,
    "symbol": "Os",
    "name": "Осмий",
    "category": "metal",
    "iupacGroup": 8,
    "period": 6,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 77,
    "symbol": "Ir",
    "name": "Иридий",
    "category": "metal",
    "iupacGroup": 9,
    "period": 6,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 78,
    "symbol": "Pt",
    "name": "Платина",
    "category": "metal",
    "iupacGroup": 10,
    "period": 6,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 79,
    "symbol": "Au",
    "name": "Золото",
    "category": "metal",
    "iupacGroup": 11,
    "period": 6,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 80,
    "symbol": "Hg",
    "name": "Ртуть",
    "category": "metal",
    "iupacGroup": 12,
    "period": 6,
    "fRow": null,
    "stateAtSTP": "liquid"
  },
  {
    "number": 81,
    "symbol": "Tl",
    "name": "Таллий",
    "category": "metal",
    "iupacGroup": 13,
    "period": 6,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 82,
    "symbol": "Pb",
    "name": "Свинец",
    "category": "metal",
    "iupacGroup": 14,
    "period": 6,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 83,
    "symbol": "Bi",
    "name": "Висмут",
    "category": "metal",
    "iupacGroup": 15,
    "period": 6,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 84,
    "symbol": "Po",
    "name": "Полоний",
    "category": "metal",
    "iupacGroup": 16,
    "period": 6,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 85,
    "symbol": "At",
    "name": "Астат",
    "category": "nonmetal",
    "iupacGroup": 17,
    "period": 6,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 86,
    "symbol": "Rn",
    "name": "Радон",
    "category": "nonmetal",
    "iupacGroup": 18,
    "period": 6,
    "fRow": null,
    "stateAtSTP": "gas"
  },
  {
    "number": 87,
    "symbol": "Fr",
    "name": "Франций",
    "category": "metal",
    "iupacGroup": 1,
    "period": 7,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 88,
    "symbol": "Ra",
    "name": "Радий",
    "category": "metal",
    "iupacGroup": 2,
    "period": 7,
    "fRow": null,
    "stateAtSTP": "solid"
  },
  {
    "number": 89,
    "symbol": "Ac",
    "name": "Актиний",
    "category": "metal",
    "iupacGroup": null,
    "period": 7,
    "fRow": "actinides",
    "stateAtSTP": "solid"
  },
  {
    "number": 90,
    "symbol": "Th",
    "name": "Торий",
    "category": "metal",
    "iupacGroup": null,
    "period": 7,
    "fRow": "actinides",
    "stateAtSTP": "solid"
  },
  {
    "number": 91,
    "symbol": "Pa",
    "name": "Протактиний",
    "category": "metal",
    "iupacGroup": null,
    "period": 7,
    "fRow": "actinides",
    "stateAtSTP": "solid"
  },
  {
    "number": 92,
    "symbol": "U",
    "name": "Уран",
    "category": "metal",
    "iupacGroup": null,
    "period": 7,
    "fRow": "actinides",
    "stateAtSTP": "solid"
  },
  {
    "number": 93,
    "symbol": "Np",
    "name": "Нептуний",
    "category": "metal",
    "iupacGroup": null,
    "period": 7,
    "fRow": "actinides",
    "stateAtSTP": "solid"
  },
  {
    "number": 94,
    "symbol": "Pu",
    "name": "Плутоний",
    "category": "metal",
    "iupacGroup": null,
    "period": 7,
    "fRow": "actinides",
    "stateAtSTP": "solid"
  },
  {
    "number": 95,
    "symbol": "Am",
    "name": "Америций",
    "category": "metal",
    "iupacGroup": null,
    "period": 7,
    "fRow": "actinides",
    "stateAtSTP": "solid"
  },
  {
    "number": 96,
    "symbol": "Cm",
    "name": "Кюрий",
    "category": "metal",
    "iupacGroup": null,
    "period": 7,
    "fRow": "actinides",
    "stateAtSTP": "solid"
  },
  {
    "number": 97,
    "symbol": "Bk",
    "name": "Берклий",
    "category": "metal",
    "iupacGroup": null,
    "period": 7,
    "fRow": "actinides",
    "stateAtSTP": "solid"
  },
  {
    "number": 98,
    "symbol": "Cf",
    "name": "Калифорний",
    "category": "metal",
    "iupacGroup": null,
    "period": 7,
    "fRow": "actinides",
    "stateAtSTP": "solid"
  },
  {
    "number": 99,
    "symbol": "Es",
    "name": "Эйнштейний",
    "category": "metal",
    "iupacGroup": null,
    "period": 7,
    "fRow": "actinides",
    "stateAtSTP": "solid"
  },
  {
    "number": 100,
    "symbol": "Fm",
    "name": "Фермий",
    "category": "metal",
    "iupacGroup": null,
    "period": 7,
    "fRow": "actinides",
    "stateAtSTP": "solid"
  },
  {
    "number": 101,
    "symbol": "Md",
    "name": "Менделевий",
    "category": "metal",
    "iupacGroup": null,
    "period": 7,
    "fRow": "actinides",
    "stateAtSTP": "solid"
  },
  {
    "number": 102,
    "symbol": "No",
    "name": "Нобелий",
    "category": "metal",
    "iupacGroup": null,
    "period": 7,
    "fRow": "actinides",
    "stateAtSTP": "solid"
  },
  {
    "number": 103,
    "symbol": "Lr",
    "name": "Лоуренсий",
    "category": "metal",
    "iupacGroup": null,
    "period": 7,
    "fRow": "actinides",
    "stateAtSTP": "solid"
  },
  {
    "number": 104,
    "symbol": "Rf",
    "name": "Резерфордий",
    "category": "metal",
    "iupacGroup": 4,
    "period": 7,
    "fRow": null,
    "stateAtSTP": null
  },
  {
    "number": 105,
    "symbol": "Db",
    "name": "Дубний",
    "category": "metal",
    "iupacGroup": 5,
    "period": 7,
    "fRow": null,
    "stateAtSTP": null
  },
  {
    "number": 106,
    "symbol": "Sg",
    "name": "Сиборгий",
    "category": "metal",
    "iupacGroup": 6,
    "period": 7,
    "fRow": null,
    "stateAtSTP": null
  },
  {
    "number": 107,
    "symbol": "Bh",
    "name": "Борий",
    "category": "metal",
    "iupacGroup": 7,
    "period": 7,
    "fRow": null,
    "stateAtSTP": null
  },
  {
    "number": 108,
    "symbol": "Hs",
    "name": "Хассий",
    "category": "metal",
    "iupacGroup": 8,
    "period": 7,
    "fRow": null,
    "stateAtSTP": null
  },
  {
    "number": 109,
    "symbol": "Mt",
    "name": "Мейтнерий",
    "category": null,
    "iupacGroup": 9,
    "period": 7,
    "fRow": null,
    "stateAtSTP": null
  },
  {
    "number": 110,
    "symbol": "Ds",
    "name": "Дармштадтий",
    "category": null,
    "iupacGroup": 10,
    "period": 7,
    "fRow": null,
    "stateAtSTP": null
  },
  {
    "number": 111,
    "symbol": "Rg",
    "name": "Рентгений",
    "category": null,
    "iupacGroup": 11,
    "period": 7,
    "fRow": null,
    "stateAtSTP": null
  },
  {
    "number": 112,
    "symbol": "Cn",
    "name": "Коперниций",
    "category": null,
    "iupacGroup": 12,
    "period": 7,
    "fRow": null,
    "stateAtSTP": null
  },
  {
    "number": 113,
    "symbol": "Nh",
    "name": "Нихоний",
    "category": null,
    "iupacGroup": 13,
    "period": 7,
    "fRow": null,
    "stateAtSTP": null
  },
  {
    "number": 114,
    "symbol": "Fl",
    "name": "Флеровий",
    "category": null,
    "iupacGroup": 14,
    "period": 7,
    "fRow": null,
    "stateAtSTP": null
  },
  {
    "number": 115,
    "symbol": "Mc",
    "name": "Московий",
    "category": null,
    "iupacGroup": 15,
    "period": 7,
    "fRow": null,
    "stateAtSTP": null
  },
  {
    "number": 116,
    "symbol": "Lv",
    "name": "Ливерморий",
    "category": null,
    "iupacGroup": 16,
    "period": 7,
    "fRow": null,
    "stateAtSTP": null
  },
  {
    "number": 117,
    "symbol": "Ts",
    "name": "Теннессин",
    "category": null,
    "iupacGroup": 17,
    "period": 7,
    "fRow": null,
    "stateAtSTP": null
  },
  {
    "number": 118,
    "symbol": "Og",
    "name": "Оганесон",
    "category": null,
    "iupacGroup": 18,
    "period": 7,
    "fRow": null,
    "stateAtSTP": "solid"
  }
];

export function getPeriodicEntry(symbol: string): PeriodicEntry {
  const entry = PERIODIC_TABLE.find((e) => e.symbol === symbol);
  if (!entry) throw new Error(`Нет элемента в таблице: ${symbol}`);
  return entry;
}
