// Copyright (C) 2025
//
// SPDX-License-Identifier: MIT

import React from 'react';

import { Row, Col } from 'antd/lib/grid';
import Checkbox, { CheckboxChangeEvent } from 'antd/lib/checkbox';
import InputNumber from 'antd/lib/input-number';
import Text from 'antd/lib/typography/Text';

import { clamp } from 'utils/math';

interface Props {
    highlightCrosshairOverlaps: boolean;
    showRectangleAlignmentGuides: boolean;
    enableRectangleDrawingSnap: boolean;
    enableRectangleMovingSnap: boolean;
    snapTolerance: number;
    autoRectangleOnLabelSwitch: boolean;
    onSwitchCrosshairAlignmentHighlight(enabled: boolean): void;
    onSwitchRectangleAlignmentGuides(enabled: boolean): void;
    onSwitchRectangleDrawingSnap(enabled: boolean): void;
    onSwitchRectangleMovingSnap(enabled: boolean): void;
    onChangeSnapTolerance(pixels: number): void;
    onSwitchAutoRectangleOnLabelSwitch(enabled: boolean): void;
}

function CvatGuiPlusSettingsComponent(props: Props): JSX.Element {
    const {
        highlightCrosshairOverlaps,
        showRectangleAlignmentGuides,
        enableRectangleDrawingSnap,
        enableRectangleMovingSnap,
        snapTolerance,
        autoRectangleOnLabelSwitch,
        onSwitchCrosshairAlignmentHighlight,
        onSwitchRectangleAlignmentGuides,
        onSwitchRectangleDrawingSnap,
        onSwitchRectangleMovingSnap,
        onChangeSnapTolerance,
        onSwitchAutoRectangleOnLabelSwitch,
    } = props;

    const minSnapTolerance = 0;
    const maxSnapTolerance = 20;

    return (
        <div className='cvat-gui-plus-settings'>
            <Row className='cvat-gui-plus-settings-section cvat-player-setting'>
                <Col span={24}>
                    <Text strong className='cvat-text-color'>CVAT-GUI++ Features</Text>
                </Col>
            </Row>
            <Row className='cvat-gui-plus-settings-option cvat-player-setting'>
                <Col span={24}>
                    <Checkbox
                        className='cvat-text-color'
                        checked={autoRectangleOnLabelSwitch}
                        onChange={(event: CheckboxChangeEvent): void => {
                            onSwitchAutoRectangleOnLabelSwitch(event.target.checked);
                        }}
                    >
                        Auto rectangle after switching label
                    </Checkbox>
                </Col>
                <Col span={24}>
                    <Text type='secondary'>Automatically start rectangle drawing after switching the default label via shortcut</Text>
                </Col>
            </Row>
            <Row className='cvat-gui-plus-settings-option cvat-player-setting'>
                <Col span={24}>
                    <Checkbox
                        className='cvat-text-color'
                        checked={highlightCrosshairOverlaps}
                        onChange={(event: CheckboxChangeEvent): void => {
                            onSwitchCrosshairAlignmentHighlight(event.target.checked);
                        }}
                    >
                        Highlight aligned crosshair segments while drawing rectangles
                    </Checkbox>
                </Col>
                <Col span={24}>
                    <Text type='secondary'>Show dashed overlap for the red crosshair when it aligns with existing rectangles</Text>
                </Col>
            </Row>
            <Row className='cvat-gui-plus-settings-option cvat-player-setting'>
                <Col span={24}>
                    <Checkbox
                        className='cvat-text-color'
                        checked={showRectangleAlignmentGuides}
                        onChange={(event: CheckboxChangeEvent): void => {
                            onSwitchRectangleAlignmentGuides(event.target.checked);
                        }}
                    >
                        Show dashed alignment guides when moving rectangles
                    </Checkbox>
                </Col>
                <Col span={24}>
                    <Text type='secondary'>Display full-length dashed guide lines while dragging near aligned rectangles</Text>
                </Col>
            </Row>
            <Row className='cvat-gui-plus-settings-option cvat-player-setting'>
                <Col span={24}>
                    <Checkbox
                        className='cvat-text-color'
                        checked={enableRectangleDrawingSnap}
                        onChange={(event: CheckboxChangeEvent): void => {
                            onSwitchRectangleDrawingSnap(event.target.checked);
                        }}
                    >
                        Snap crosshair to rectangle edges while drawing
                    </Checkbox>
                </Col>
                <Col span={24}>
                    <Text type='secondary'>Automatically snap the drawing crosshair to nearby horizontal or vertical edges</Text>
                </Col>
            </Row>
            <Row className='cvat-gui-plus-settings-option cvat-player-setting'>
                <Col span={24}>
                    <Checkbox
                        className='cvat-text-color'
                        checked={enableRectangleMovingSnap}
                        onChange={(event: CheckboxChangeEvent): void => {
                            onSwitchRectangleMovingSnap(event.target.checked);
                        }}
                    >
                        Snap rectangles to edges while moving
                    </Checkbox>
                </Col>
                <Col span={24}>
                    <Text type='secondary'>Snap dragged rectangles to nearby edges for precise alignment</Text>
                </Col>
            </Row>
            <Row className='cvat-gui-plus-settings-snap-tolerance cvat-player-setting'>
                <Col>
                    <Text className='cvat-text-color'> Snap tolerance (px) </Text>
                    <InputNumber
                        min={minSnapTolerance}
                        max={maxSnapTolerance}
                        value={snapTolerance}
                        disabled={!enableRectangleDrawingSnap && !enableRectangleMovingSnap}
                        onChange={(value: number | undefined | string): void => {
                            if (typeof value !== 'undefined') {
                                onChangeSnapTolerance(
                                    Math.floor(clamp(+value, minSnapTolerance, maxSnapTolerance)),
                                );
                            }
                        }}
                    />
                </Col>
            </Row>
        </div>
    );
}

export default React.memo(CvatGuiPlusSettingsComponent);
