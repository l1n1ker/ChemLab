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
  'palette.substances': 'Готовые вещества',

  'workspace.title': 'Рабочий стол',
  'workspace.bondOrder': 'Кратность связи',
  'workspace.bondOrder.single': 'Одинарная',
  'workspace.bondOrder.double': 'Двойная',
  'workspace.bondOrder.triple': 'Тройная',
  'workspace.bondKind.ionic': 'Ионная связь',
  'workspace.bondHandle': 'Ручка связи',
  'workspace.bondLabel': 'Связь (клик — разорвать)',
  'workspace.empty': 'Стол пуст. Возьмите атомы в магазине слева.',

  'error.same-atom': 'Нельзя соединить атом с самим собой',
  'error.order-overflow': 'Кратность связи не может быть больше тройной',
  'error.bond-kind-mismatch': 'Между этими атомами уже есть связь другого типа',
  'error.ionic-exists': 'Ионная связь между этими атомами уже есть',
  'error.monovalent.H': 'Водород одновалентен',
  'error.monovalent.other': 'У атома {element} уже заняты все валентности ({used} из {max})',
  'error.valence-exceeded': 'У атома {element} не хватает валентности: нужно {used}, доступно {max}',
  'error.dismiss': 'Скрыть сообщение',

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
  'properties.class': 'Класс',
  'properties.class.simple': 'простое вещество',
  'properties.class.oxide': 'оксид',
  'properties.class.acid': 'кислота',
  'properties.class.base': 'основание',
  'properties.class.salt': 'соль',
  'properties.mp': 't° плавления',
  'properties.bp': 't° кипения',
  'properties.density': 'Плотность',
  'properties.densityUnit.g/cm3': 'г/см³',
  'properties.densityUnit.g/L': 'г/л',
  'properties.oxidation': 'Степени окисления',

  'converter.title': 'Конвертер количества',
  'converter.mass': 'Масса, г',
  'converter.moles': 'Количество, моль',
  'converter.molecules': 'Число молекул',
  'converter.volume': 'Объём (н.у.), л',

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
