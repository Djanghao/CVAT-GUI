// Copyright (C) CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

export enum ShortcutsFeatureToggleID {
    AUTO_RECTANGLE_ON_LABEL_SWITCH = 'AUTO_RECTANGLE_ON_LABEL_SWITCH',
}

export interface ShortcutsFeatureToggleDefinition {
    id: ShortcutsFeatureToggleID;
    title: string;
    description: string;
}

export const SHORTCUTS_FEATURE_TOGGLES: ShortcutsFeatureToggleDefinition[] = [
    {
        id: ShortcutsFeatureToggleID.AUTO_RECTANGLE_ON_LABEL_SWITCH,
        title: 'Auto rectangle after switching label',
        description: 'Automatically start rectangle drawing in two-point mode when the default label is switched via shortcut.',
    },
];

export const SHORTCUTS_DEFAULT_FEATURE_TOGGLE_STATE: Record<ShortcutsFeatureToggleID, boolean> = {
    [ShortcutsFeatureToggleID.AUTO_RECTANGLE_ON_LABEL_SWITCH]: true,
};

export function normalizeFeatureToggles(
    featureToggles?: Partial<Record<ShortcutsFeatureToggleID, boolean>>,
): Record<ShortcutsFeatureToggleID, boolean> {
    return {
        ...SHORTCUTS_DEFAULT_FEATURE_TOGGLE_STATE,
        ...(featureToggles || {}),
    };
}
