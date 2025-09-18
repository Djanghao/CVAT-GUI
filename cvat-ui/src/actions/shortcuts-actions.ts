// Copyright (C) 2020-2022 Intel Corporation
// Copyright (C) CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import { getCVATStore } from 'cvat-store';
import { KeyMapItem } from 'utils/mousetrap-react';
import { ShortcutsFeatureToggleID } from 'utils/shortcuts-feature-toggles';
import { ActionUnion, createAction } from 'utils/redux';

export enum ShortcutsActionsTypes {
    SWITCH_SHORTCUT_DIALOG = 'SWITCH_SHORTCUT_DIALOG',
    UPDATE_SEQUENCE = 'UPDATE_SEQUENCE',
    REGISTER_SHORTCUTS = 'REGISTER_SHORTCUTS',
    SET_SHORTCUTS = 'SET_SHORTCUTS',
    SET_DEFAULT_SHORTCUTS = 'SET_DEFAULT_SHORTCUTS',
    SET_FEATURE_TOGGLE = 'SET_FEATURE_TOGGLE',
    SET_FEATURE_TOGGLES = 'SET_FEATURE_TOGGLES',
}

export const shortcutsActions = {
    switchShortcutsModalVisible: (visible: boolean) => (
        createAction(ShortcutsActionsTypes.SWITCH_SHORTCUT_DIALOG, { visible })
    ),
    registerShortcuts: (shortcuts: Record<string, KeyMapItem>) => (
        createAction(ShortcutsActionsTypes.REGISTER_SHORTCUTS, { shortcuts })
    ),
    updateSequence: (shortcutID: string, updatedSequence: string[]) => (
        createAction(ShortcutsActionsTypes.UPDATE_SEQUENCE, { shortcutID, updatedSequence })
    ),
    setDefaultShortcuts: (shortcuts: Record<string, KeyMapItem>) => (
        createAction(ShortcutsActionsTypes.SET_DEFAULT_SHORTCUTS, { shortcuts })
    ),
    setFeatureToggle: (featureID: ShortcutsFeatureToggleID, enabled: boolean) => (
        createAction(ShortcutsActionsTypes.SET_FEATURE_TOGGLE, { featureID, enabled })
    ),
    setFeatureToggles: (featureToggles: Partial<Record<ShortcutsFeatureToggleID, boolean>>) => (
        createAction(ShortcutsActionsTypes.SET_FEATURE_TOGGLES, { featureToggles })
    ),
};

export function registerComponentShortcuts(shortcuts: Record<string, KeyMapItem>): void {
    const store = getCVATStore();
    const { registerShortcuts } = shortcutsActions;
    store.dispatch(registerShortcuts(shortcuts));
}

export type ShortcutsActions = ActionUnion<typeof shortcutsActions>;
