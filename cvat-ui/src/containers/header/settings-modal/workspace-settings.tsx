// Copyright (C) 2020-2022 Intel Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { connect } from 'react-redux';

import {
    switchAutoSave,
    changeAutoSaveInterval,
    changeAAMZoomMargin,
    switchShowingInterpolatedTracks,
    switchShowingObjectsTextAlways,
    switchAutomaticBordering,
    switchIntelligentPolygonCrop,
    changeDefaultApproxPolyAccuracy,
    switchTextFontSize,
    switchControlPointsSize,
    changeSnapTolerance,
    switchTextPosition,
    switchTextContent,
    switchShowingTagsOnFrame,
    switchAdaptiveZoom,
    switchCrosshairAlignmentHighlight,
    switchRectangleAlignmentGuides,
    switchRectangleDrawingSnap,
    switchRectangleMovingSnap,
} from 'actions/settings-actions';

import { CombinedState } from 'reducers';

import WorkspaceSettingsComponent from 'components/header/settings-modal/workspace-settings';

interface StateToProps {
    autoSave: boolean;
    autoSaveInterval: number;
    aamZoomMargin: number;
    showAllInterpolationTracks: boolean;
    showObjectsTextAlways: boolean;
    defaultApproxPolyAccuracy: number;
    automaticBordering: boolean;
    adaptiveZoom: boolean;
    intelligentPolygonCrop: boolean;
    textFontSize: number;
    controlPointsSize: number;
    snapTolerance: number;
    textPosition: 'auto' | 'center';
    textContent: string;
    showTagsOnFrame: boolean;
    highlightCrosshairOverlaps: boolean;
    showRectangleAlignmentGuides: boolean;
    enableRectangleDrawingSnap: boolean;
    enableRectangleMovingSnap: boolean;
}

interface DispatchToProps {
    onSwitchAutoSave(enabled: boolean): void;
    onChangeAutoSaveInterval(interval: number): void;
    onChangeAAMZoomMargin(margin: number): void;
    onSwitchShowingInterpolatedTracks(enabled: boolean): void;
    onSwitchShowingObjectsTextAlways(enabled: boolean): void;
    onSwitchAutomaticBordering(enabled: boolean): void;
    onSwitchAdaptiveZoom(enabled: boolean): void;
    onSwitchIntelligentPolygonCrop(enabled: boolean): void;
    onChangeDefaultApproxPolyAccuracy(approxPolyAccuracy: number): void;
    onChangeTextFontSize(fontSize: number): void;
    onChangeControlPointsSize(pointsSize: number): void;
    onChangeSnapTolerance(pixels: number): void;
    onChangeTextPosition(position: 'auto' | 'center'): void;
    onChangeTextContent(textContent: string[]): void;
    onSwitchShowingTagsOnFrame(enabled: boolean): void;
    onSwitchCrosshairAlignmentHighlight(enabled: boolean): void;
    onSwitchRectangleAlignmentGuides(enabled: boolean): void;
    onSwitchRectangleDrawingSnap(enabled: boolean): void;
    onSwitchRectangleMovingSnap(enabled: boolean): void;
}

function mapStateToProps(state: CombinedState): StateToProps {
    const { workspace } = state.settings;
    const {
        autoSave,
        autoSaveInterval,
        aamZoomMargin,
        showAllInterpolationTracks,
        showObjectsTextAlways,
        automaticBordering,
        adaptiveZoom,
        intelligentPolygonCrop,
        defaultApproxPolyAccuracy,
        textFontSize,
        controlPointsSize,
        snapTolerance,
        textPosition,
        textContent,
        showTagsOnFrame,
        highlightCrosshairOverlaps,
        showRectangleAlignmentGuides,
        enableRectangleDrawingSnap,
        enableRectangleMovingSnap,
    } = workspace;

    return {
        autoSave,
        autoSaveInterval,
        aamZoomMargin,
        showAllInterpolationTracks,
        showObjectsTextAlways,
        automaticBordering,
        adaptiveZoom,
        intelligentPolygonCrop,
        defaultApproxPolyAccuracy,
        textFontSize,
        controlPointsSize,
        snapTolerance,
        textPosition,
        textContent,
        showTagsOnFrame,
        highlightCrosshairOverlaps,
        showRectangleAlignmentGuides,
        enableRectangleDrawingSnap,
        enableRectangleMovingSnap,
    };
}

const mapDispatchToProps: DispatchToProps = {
    onSwitchAutoSave: switchAutoSave,
    onChangeAutoSaveInterval: changeAutoSaveInterval,
    onChangeAAMZoomMargin: changeAAMZoomMargin,
    onSwitchShowingInterpolatedTracks: switchShowingInterpolatedTracks,
    onSwitchShowingObjectsTextAlways: switchShowingObjectsTextAlways,
    onSwitchAutomaticBordering: switchAutomaticBordering,
    onSwitchAdaptiveZoom: switchAdaptiveZoom,
    onSwitchIntelligentPolygonCrop: switchIntelligentPolygonCrop,
    onChangeDefaultApproxPolyAccuracy: changeDefaultApproxPolyAccuracy,
    onChangeTextFontSize: switchTextFontSize,
    onChangeControlPointsSize: switchControlPointsSize,
    onChangeSnapTolerance: changeSnapTolerance,
    onChangeTextPosition: switchTextPosition,
    onChangeTextContent: switchTextContent,
    onSwitchShowingTagsOnFrame: switchShowingTagsOnFrame,
    onSwitchCrosshairAlignmentHighlight: switchCrosshairAlignmentHighlight,
    onSwitchRectangleAlignmentGuides: switchRectangleAlignmentGuides,
    onSwitchRectangleDrawingSnap: switchRectangleDrawingSnap,
    onSwitchRectangleMovingSnap: switchRectangleMovingSnap,
};

function WorkspaceSettingsContainer(props: StateToProps & DispatchToProps): JSX.Element {
    return <WorkspaceSettingsComponent {...props} />;
}

export default connect(mapStateToProps, mapDispatchToProps)(WorkspaceSettingsContainer);
