// Copyright (C) 2025
//
// SPDX-License-Identifier: MIT

import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import FastCvatSettingsComponent from 'components/header/settings-modal/fast-cvat-settings';
import {
    changeSnapTolerance,
    switchCrosshairAlignmentHighlight,
    switchRectangleAlignmentGuides,
    switchRectangleDrawingSnap,
    switchRectangleMovingSnap,
} from 'actions/settings-actions';
import { CombinedState } from 'reducers';
import { shortcutsActions } from 'actions/shortcuts-actions';
import { ShortcutsFeatureToggleID } from 'utils/shortcuts-feature-toggles';

interface StateToProps {
    rectangleDrawingAssistEnabled: boolean;
    rectangleMovingAssistEnabled: boolean;
    snapTolerance: number;
    autoRectangleOnLabelSwitch: boolean;
}

interface DispatchToProps {
    onToggleRectangleDrawingAssist(enabled: boolean): void;
    onToggleRectangleMovingAssist(enabled: boolean): void;
    onChangeSnapTolerance(pixels: number): void;
    onSwitchAutoRectangleOnLabelSwitch(enabled: boolean): void;
}

function mapStateToProps(state: CombinedState): StateToProps {
    const { workspace } = state.settings;
    const {
        highlightCrosshairOverlaps,
        showRectangleAlignmentGuides,
        enableRectangleDrawingSnap,
        enableRectangleMovingSnap,
        snapTolerance,
    } = workspace;
    const { shortcuts } = state;

    return {
        rectangleDrawingAssistEnabled: highlightCrosshairOverlaps && enableRectangleDrawingSnap,
        rectangleMovingAssistEnabled: showRectangleAlignmentGuides && enableRectangleMovingSnap,
        snapTolerance,
        autoRectangleOnLabelSwitch: shortcuts.featureToggles[ShortcutsFeatureToggleID.AUTO_RECTANGLE_ON_LABEL_SWITCH],
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
        onSwitchAutoRectangleOnLabelSwitch(enabled: boolean): void {
            dispatch(
                shortcutsActions.setFeatureToggle(
                    ShortcutsFeatureToggleID.AUTO_RECTANGLE_ON_LABEL_SWITCH,
                    enabled,
                ),
            );
        },
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(FastCvatSettingsComponent);
