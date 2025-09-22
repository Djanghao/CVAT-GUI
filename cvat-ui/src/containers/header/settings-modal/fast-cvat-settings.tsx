// Copyright (C) 2025
//
// SPDX-License-Identifier: MIT

import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import FastCvatSettingsComponent from 'components/header/settings-modal/fast-cvat-settings';
import {
    changeSnapTolerance,
    changeEqualSpacingTolerance,
    switchCrosshairAlignmentHighlight,
    switchRectangleAlignmentGuides,
    switchRectangleDrawingSnap,
    switchRectangleMovingSnap,
    switchEqualSpacingAssist,
    switchEqualSpacingAssistOnDrag,
    changeAssistModifier,
    changeEqualSpacingModifier,
} from 'actions/settings-actions';
import { CombinedState } from 'reducers';
import { KeyMap } from 'utils/mousetrap-react';
import { shortcutsActions } from 'actions/shortcuts-actions';
import { ShortcutsFeatureToggleID } from 'utils/shortcuts-feature-toggles';

interface StateToProps {
    rectangleDrawingAssistEnabled: boolean;
    rectangleMovingAssistEnabled: boolean;
    snapTolerance: number;
    equalSpacingTolerance: number;
    autoRectangleOnLabelSwitch: boolean;
    enableEqualSpacingAssist: boolean;
    enableEqualSpacingAssistOnDrag: boolean;
    assistModifier: 'control' | 'alt' | 'shift' | 'meta';
    equalSpacingModifier: 'control' | 'alt' | 'shift' | 'meta';
    keyMap: KeyMap;
}

interface DispatchToProps {
    onToggleRectangleDrawingAssist(enabled: boolean): void;
    onToggleRectangleMovingAssist(enabled: boolean): void;
    onChangeSnapTolerance(pixels: number): void;
    onChangeEqualSpacingTolerance(pixels: number): void;
    onSwitchAutoRectangleOnLabelSwitch(enabled: boolean): void;
    onToggleEqualSpacingAssist(enabled: boolean): void;
    onToggleEqualSpacingAssistOnDrag(enabled: boolean): void;
    onChangeAssistModifier(mod: 'control' | 'alt' | 'shift' | 'meta'): void;
    onChangeEqualSpacingModifier(mod: 'control' | 'alt' | 'shift' | 'meta'): void;
}

function mapStateToProps(state: CombinedState): StateToProps {
    const { workspace } = state.settings;
    const {
        highlightCrosshairOverlaps,
        showRectangleAlignmentGuides,
        enableRectangleDrawingSnap,
        enableRectangleMovingSnap,
        snapTolerance,
        equalSpacingTolerance,
        enableEqualSpacingAssist,
        enableEqualSpacingAssistOnDrag,
        assistModifier,
        equalSpacingModifier,
    } = workspace;
    const { shortcuts } = state;

    return {
        rectangleDrawingAssistEnabled: highlightCrosshairOverlaps && enableRectangleDrawingSnap,
        rectangleMovingAssistEnabled: showRectangleAlignmentGuides && enableRectangleMovingSnap,
        snapTolerance,
        equalSpacingTolerance,
        autoRectangleOnLabelSwitch: shortcuts.featureToggles[ShortcutsFeatureToggleID.AUTO_RECTANGLE_ON_LABEL_SWITCH],
        enableEqualSpacingAssist,
        enableEqualSpacingAssistOnDrag,
        assistModifier,
        equalSpacingModifier,
        keyMap: shortcuts.keyMap,
    };
}

function mapDispatchToProps(dispatch: Dispatch): DispatchToProps {
    return {
        onToggleRectangleDrawingAssist(enabled: boolean): void {
            dispatch(switchCrosshairAlignmentHighlight(enabled));
            dispatch(switchRectangleDrawingSnap(enabled));
        },
        onToggleRectangleMovingAssist(enabled: boolean): void {
            dispatch(switchRectangleAlignmentGuides(enabled));
            dispatch(switchRectangleMovingSnap(enabled));
        },
        onChangeSnapTolerance(pixels: number): void {
            dispatch(changeSnapTolerance(pixels));
        },
        onChangeEqualSpacingTolerance(pixels: number): void {
            dispatch(changeEqualSpacingTolerance(pixels));
        },
        onSwitchAutoRectangleOnLabelSwitch(enabled: boolean): void {
            dispatch(
                shortcutsActions.setFeatureToggle(
                    ShortcutsFeatureToggleID.AUTO_RECTANGLE_ON_LABEL_SWITCH,
                    enabled,
                ),
            );
        },
        onToggleEqualSpacingAssist(enabled: boolean): void {
            dispatch(switchEqualSpacingAssist(enabled));
        },
        onToggleEqualSpacingAssistOnDrag(enabled: boolean): void {
            dispatch(switchEqualSpacingAssistOnDrag(enabled));
        },
        onChangeAssistModifier(mod: 'control' | 'alt' | 'shift' | 'meta'): void {
            dispatch(changeAssistModifier(mod));
        },
        onChangeEqualSpacingModifier(mod: 'control' | 'alt' | 'shift' | 'meta'): void {
            dispatch(changeEqualSpacingModifier(mod));
        },
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(FastCvatSettingsComponent);
