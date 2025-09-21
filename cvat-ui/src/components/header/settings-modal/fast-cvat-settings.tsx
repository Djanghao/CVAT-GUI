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
    rectangleDrawingAssistEnabled: boolean;
    rectangleMovingAssistEnabled: boolean;
    snapTolerance: number;
    autoRectangleOnLabelSwitch: boolean;
    onToggleRectangleDrawingAssist(enabled: boolean): void;
    onToggleRectangleMovingAssist(enabled: boolean): void;
    onChangeSnapTolerance(pixels: number): void;
    onSwitchAutoRectangleOnLabelSwitch(enabled: boolean): void;
}

function FastCvatSettingsComponent(props: Props): JSX.Element {
    const {
        rectangleDrawingAssistEnabled,
        rectangleMovingAssistEnabled,
        snapTolerance,
        autoRectangleOnLabelSwitch,
        onToggleRectangleDrawingAssist,
        onToggleRectangleMovingAssist,
        onChangeSnapTolerance,
        onSwitchAutoRectangleOnLabelSwitch,
    } = props;

    const minSnapTolerance = 0;
    const maxSnapTolerance = 20;

    return (
        <div className='fast-cvat-settings'>
            <Row className='fast-cvat-settings-section cvat-player-setting'>
                <Col span={24}>
                    <Text strong className='cvat-text-color fast-cvat-section-title'>FastCVAT Features</Text>
                </Col>
            </Row>
            <Row className='fast-cvat-settings-option cvat-player-setting'>
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
            <Row className='fast-cvat-settings-option cvat-player-setting'>
                <Col span={24}>
                    <Checkbox
                        className='cvat-text-color'
                        checked={rectangleDrawingAssistEnabled}
                        onChange={(event: CheckboxChangeEvent): void => {
                            onToggleRectangleDrawingAssist(event.target.checked);
                        }}
                    >
                        Show dashed guides & snap while drawing rectangles
                    </Checkbox>
                </Col>
                <Col span={24}>
                    <Text type='secondary'>Highlight aligned crosshair segments and snap to nearby rectangle edges</Text>
                </Col>
            </Row>
            <Row className='fast-cvat-settings-option cvat-player-setting'>
                <Col span={24}>
                    <Checkbox
                        className='cvat-text-color'
                        checked={rectangleMovingAssistEnabled}
                        onChange={(event: CheckboxChangeEvent): void => {
                            onToggleRectangleMovingAssist(event.target.checked);
                        }}
                    >
                        Show dashed guides & snap while moving rectangles
                    </Checkbox>
                </Col>
                <Col span={24}>
                    <Text type='secondary'>Display alignment guides and snap dragged rectangles to nearby edges</Text>
                </Col>
            </Row>
            <Row className='fast-cvat-settings-snap-tolerance cvat-player-setting'>
                <Col>
                    <Text className='cvat-text-color'> Snap tolerance (px) </Text>
                    <InputNumber
                        min={minSnapTolerance}
                        max={maxSnapTolerance}
                        value={snapTolerance}
                        disabled={!rectangleDrawingAssistEnabled && !rectangleMovingAssistEnabled}
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

export default React.memo(FastCvatSettingsComponent);
