// Copyright (C) 2025
//
// SPDX-License-Identifier: MIT

import { connect } from 'react-redux';

import CvatGuiPlusSettingsComponent from 'components/header/settings-modal/cvat-gui-plus-settings';
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
    highlightCrosshairOverlaps: boolean;
    showRectangleAlignmentGuides: boolean;
    enableRectangleDrawingSnap: boolean;
    enableRectangleMovingSnap: boolean;
    snapTolerance: number;
    autoRectangleOnLabelSwitch: boolean;
}

interface DispatchToProps {
    onSwitchCrosshairAlignmentHighlight(enabled: boolean): void;
    onSwitchRectangleAlignmentGuides(enabled: boolean): void;
    onSwitchRectangleDrawingSnap(enabled: boolean): void;
    onSwitchRectangleMovingSnap(enabled: boolean): void;
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
        highlightCrosshairOverlaps,
        showRectangleAlignmentGuides,
        enableRectangleDrawingSnap,
        enableRectangleMovingSnap,
        snapTolerance,
        autoRectangleOnLabelSwitch: shortcuts.featureToggles[ShortcutsFeatureToggleID.AUTO_RECTANGLE_ON_LABEL_SWITCH],
    };
}

const mapDispatchToProps: DispatchToProps = {
    onSwitchCrosshairAlignmentHighlight: switchCrosshairAlignmentHighlight,
    onSwitchRectangleAlignmentGuides: switchRectangleAlignmentGuides,
    onSwitchRectangleDrawingSnap: switchRectangleDrawingSnap,
    onSwitchRectangleMovingSnap: switchRectangleMovingSnap,
    onChangeSnapTolerance: changeSnapTolerance,
    onSwitchAutoRectangleOnLabelSwitch: (enabled: boolean) => (
        shortcutsActions.setFeatureToggle(ShortcutsFeatureToggleID.AUTO_RECTANGLE_ON_LABEL_SWITCH, enabled)
    ),
};

export default connect(mapStateToProps, mapDispatchToProps)(CvatGuiPlusSettingsComponent);
