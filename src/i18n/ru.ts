// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Словарь строк UI (NFR-5): RU первична, все строки — через этот словарь.
 * Новая локаль = новый файл словаря с тем же набором ключей.
 */
export const ru = {
  'app.title': 'Химическая лаборатория «Атомы и вещества»',

  'palette.title': 'Магазин атомов',
  'palette.hint': 'Перетащите атом на стол или кликните по нему',

  'workspace.title': 'Рабочий стол',
  'workspace.bondOrder': 'Кратность связи',
  'workspace.bondOrder.single': 'Одинарная',
  'workspace.bondOrder.double': 'Двойная',
  'workspace.bondOrder.triple': 'Тройная',
  'workspace.bondHandle': 'Ручка связи',
  'workspace.bondLabel': 'Связь (клик — разорвать)',
  'workspace.empty': 'Стол пуст. Возьмите атомы в магазине слева.',

  'error.same-atom': 'Нельзя соединить атом с самим собой',
  'error.order-overflow': 'Кратность связи не может быть больше тройной',
  'error.monovalent.H': 'Водород одновалентен',
  'error.monovalent.other': 'У атома {element} уже заняты все валентности ({used} из {max})',
  'error.valence-exceeded': 'У атома {element} не хватает валентности: нужно {used}, доступно {max}',

  'properties.title': 'Свойства вещества',
  'properties.none': 'Выберите молекулу на столе',
  'properties.formula': 'Формула',
  'properties.molarMass': 'Молярная масса',
  'properties.molarMass.unit': 'г/моль',
  'properties.composition': 'Состав',
  'properties.hypothetical': 'Гипотетическое соединение — валентности соблюдены, но такого вещества нет в каталоге',
  'properties.atomCount': '{count} ат.',
  'properties.state.gas': 'газ',
  'properties.state.liquid': 'жидкость',
  'properties.state.solid': 'твёрдое',
  'properties.stateAtSTP': 'При н.у.',

  'inspector.title': '3D-инспектор',
  'inspector.none': 'Выберите молекулу на столе',
  'inspector.schematic': 'Схематичная геометрия',
  'inspector.reference': 'Справочная геометрия',
  'inspector.webglError': 'WebGL недоступен в этом браузере',
} as const;

export type I18nKey = keyof typeof ru;

export type Messages = Record<I18nKey, string>;

export const messages: Messages = ru;

/** Подстановка параметров: t('error.valence-exceeded', { element: 'O', used: 3, max: 2 }). */
export function t(key: I18nKey, params?: Record<string, string | number>): string {
  const template: string = messages[key];
  if (!params) return template;
  return Object.entries(params).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    template,
  );
}
