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
  'workspace.bondOrder.single': 'Одинарная',
  'workspace.bondOrder.double': 'Двойная',
  'workspace.bondOrder.triple': 'Тройная',
  'workspace.bondHandle': 'Ручка связи',
  'workspace.bondLabel': 'Связь (клик — меню)',
  'bond.menu.title': 'Связь',
  'bond.menu.order': 'Кратность',
  'bond.menu.covalent': 'Ковалентная',
  'bond.menu.ionic': 'Ионная',
  'bond.menu.delete': 'Удалить связь',
  'workspace.empty': 'Стол пуст. Нажмите «Магазин», чтобы взять атомы или готовые вещества.',
  'atom.clone': 'Добавить копию атома',
  'molecule.clone': 'Добавить копию молекулы',

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

  'shop.open': 'Магазин',
  'shop.tab.atoms': 'Атомы',
  'shop.tab.substances': 'Вещества',
  'shop.cart': 'Корзина',
  'shop.cart.empty': 'Корзина пуста — кликайте по ячейкам таблицы',
  'shop.cart.clear': 'Очистить корзину',
  'shop.done': 'Готово',
  'shop.close': 'Закрыть',
  'shop.locked': 'Откроется позже',
  'shop.layout.mendeleev': 'Менделеевская',
  'shop.layout.iupac': 'IUPAC',
  'shop.search.placeholder': 'Поиск: символ, название, формула',
  'shop.filter.category': 'Категория',
  'shop.filter.state': 'Состояние при н.у.',
  'shop.filter.valence': 'Валентность',
  'shop.filter.availability': 'Доступность',
  'shop.filter.available': 'доступные',
  'shop.filter.locked': 'закрытые',
  'shop.filter.any': 'все',
  'shop.filter.reset': 'Сбросить фильтры',
  'shop.filter.matches': 'Совпадений: {count}',
  'shop.filter.rejected': 'Элемент не соответствует фильтру',
  'shop.filter.class': 'Класс',
  'shop.filter.containsElement': 'Содержит элемент',
  'shop.elementInfo': 'Карточка элемента',

  'atomcard.number': '№',
  'atomcard.mass': 'Ar',
  'atomcard.valences': 'Валентность',
  'atomcard.category': 'Категория',
  'atomcard.category.metal': 'металл',
  'atomcard.category.nonmetal': 'неметалл',
  'atomcard.category.metalloid': 'металлоид',
  'atomcard.group': 'Группа',
  'atomcard.period': 'Период',
  'atomcard.freeValence': 'Свободных валентностей',

  'result.open': 'Подробнее',
  'result.title': 'Просмотр результата',
  'result.dismantle': 'Разобрать на атомы',
  'result.close': 'Закрыть',

  'reaction.zone': 'Зона реакции',
  'reaction.run': 'Запустить реакцию',
  'reaction.report': 'Отчёт о реакции',
  'reaction.consumed': 'Израсходовано',
  'reaction.produced': 'Получено',
  'reaction.excess': 'Осталось (избыток)',
  'reaction.limiting': 'лимитирующий реагент',
  'reaction.close': 'Скрыть',
  'reaction.noReaction': 'Реакция не найдена для этого набора веществ',
  'reaction.notEnough': 'Недостаточно реагентов',
  'reaction.need': 'нужно {need}, есть {have}',
  'reaction.suggestions': 'Ближайшие возможные реакции:',
  'reaction.missing': 'не хватает: {list}',
  'reaction.type.combination': 'соединение',
  'reaction.type.decomposition': 'разложение',
  'reaction.type.substitution': 'замещение',
  'reaction.type.exchange': 'обмен',
  'reaction.type.combustion': 'горение',
  'reaction.units': '{moles} моль · {grams} г',

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
