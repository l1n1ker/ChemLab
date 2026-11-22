// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import { t } from './ru';
import type { BondRejection } from '../domain/validation';

/** Текст отказа валидации связи (FR-5: отказ с понятным объяснением). */
export function rejectionMessage(rejection: BondRejection): string {
  switch (rejection.code) {
    case 'same-atom':
      return t('error.same-atom');
    case 'order-overflow':
      return t('error.order-overflow');
    case 'bond-kind-mismatch':
      return t('error.bond-kind-mismatch');
    case 'ionic-exists':
      return t('error.ionic-exists');
    case 'monovalent':
      return rejection.element === 'H'
        ? t('error.monovalent.H')
        : t('error.monovalent.other', {
            element: rejection.element ?? '',
            used: rejection.used ?? 0,
            max: rejection.max ?? 0,
          });
    case 'valence-exceeded':
      return t('error.valence-exceeded', {
        element: rejection.element ?? '',
        used: rejection.used ?? 0,
        max: rejection.max ?? 0,
      });
  }
}
