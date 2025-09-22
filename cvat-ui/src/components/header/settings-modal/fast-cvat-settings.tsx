// Copyright (C) 2025
//
// SPDX-License-Identifier: MIT

import React from 'react';

import { Row, Col } from 'antd/lib/grid';
import Checkbox, { CheckboxChangeEvent } from 'antd/lib/checkbox';
import InputNumber from 'antd/lib/input-number';
import Text from 'antd/lib/typography/Text';
import Modal from 'antd/lib/modal';

import MultipleShortcutsDisplay from './multiple-shortcuts-display';
import { KeyMap, KeyMapItem } from 'utils/mousetrap-react';

import { clamp } from 'utils/math';

interface Props {
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

function FastCvatSettingsComponent(props: Props): JSX.Element {
    const {
        rectangleDrawingAssistEnabled,
        rectangleMovingAssistEnabled,
        snapTolerance,
        equalSpacingTolerance,
        autoRectangleOnLabelSwitch,
        enableEqualSpacingAssist,
        enableEqualSpacingAssistOnDrag,
        assistModifier,
        equalSpacingModifier,
        onToggleRectangleDrawingAssist,
        onToggleRectangleMovingAssist,
        onChangeSnapTolerance,
        onChangeEqualSpacingTolerance,
        onSwitchAutoRectangleOnLabelSwitch,
        onToggleEqualSpacingAssist,
        onToggleEqualSpacingAssistOnDrag,
        onChangeAssistModifier,
        onChangeEqualSpacingModifier,
    } = props;

    const minSnapTolerance = 0;
    const maxSnapTolerance = 20;

    const { keyMap } = props;

    const buildFakeItem = (id: string, name: string, desc: string, seq: string): { id: string; item: KeyMapItem } => ({
        id,
        item: {
            name,
            description: desc,
            sequences: seq ? [seq] : [],
            scope: 'FAST_CVAT',
        },
    } as any);

    const onUpdateModifier = (
        current: 'control' | 'alt' | 'shift' | 'meta',
        updated: string[],
        onChange: (mod: 'control' | 'alt' | 'shift' | 'meta') => void,
    ) => {
        const last = updated[updated.length - 1] || '';
        if (['ctrl', 'alt', 'shift'].includes(last)) {
            const map: Record<string, 'control' | 'alt' | 'shift'> = { ctrl: 'control', alt: 'alt', shift: 'shift' };
            onChange(map[last]);
            return;
        }
        if (updated.length === 0) {
            // reset to default on clear
            onChange('control');
            return;
        }
        Modal.error({
            title: 'Only modifier allowed',
            content: 'Please press only one of: Ctrl, Alt, or Shift',
        });
    };

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

            <Row className='fast-cvat-settings-option cvat-player-setting'>
                <Col span={24}>
                    <Checkbox
                        className='cvat-text-color'
                        checked={enableEqualSpacingAssist}
                        onChange={(event: CheckboxChangeEvent): void => {
                            onToggleEqualSpacingAssist(event.target.checked);
                        }}
                    >
                        Equal spacing hint & snap on rectangle start
                    </Checkbox>
                </Col>
                <Col span={24}>
                    <Text type='secondary'>Suggest equal gaps along aligned edges and snap the starting point</Text>
                </Col>
            </Row>
            <Row className='fast-cvat-settings-option cvat-player-setting'>
                <Col span={24}>
                    <Checkbox
                        className='cvat-text-color'
                        checked={enableEqualSpacingAssistOnDrag}
                        onChange={(event: CheckboxChangeEvent): void => {
                            onToggleEqualSpacingAssistOnDrag(event.target.checked);
                        }}
                    >
                        Equal spacing hint & snap while moving rectangles
                    </Checkbox>
                </Col>
                <Col span={24}>
                    <Text type='secondary'>Extend existing equal gaps during drag and snap within tolerance</Text>
                </Col>
            </Row>
            <Row className='fast-cvat-settings-snap-tolerance cvat-player-setting'>
                <Col>
                    <Text className='cvat-text-color'> Equal spacing tolerance (px) </Text>
                    <InputNumber
                        min={minSnapTolerance}
                        max={maxSnapTolerance}
                        value={equalSpacingTolerance}
                        disabled={!enableEqualSpacingAssist && !enableEqualSpacingAssistOnDrag}
                        onChange={(value: number | undefined | string): void => {
                            if (typeof value !== 'undefined') {
                                onChangeEqualSpacingTolerance(
                                    Math.floor(clamp(+value, minSnapTolerance, maxSnapTolerance)),
                                );
                            }
                        }}
                    />
                </Col>
            </Row>
            <Row className='fast-cvat-settings-option cvat-player-setting'>
                <Col span={24}>
                    <Text strong className='cvat-text-color'>Shortcut modifiers</Text>
                </Col>
                <Col span={24}>
                    <Text className='cvat-text-color'>Assist modifier (draw/move):</Text>
                    <div>
                        <MultipleShortcutsDisplay
                            id='FAST_CVAT_ASSIST_MOD'
                            keyMap={{} as any}
                            item={buildFakeItem(
                                'FAST_CVAT_ASSIST_MOD',
                                'Assist modifier',
                                'Hold to temporarily disable draw/move snapping & guides',
                                assistModifier === 'control' ? 'ctrl' : assistModifier,
                            ).item}
                            onKeySequenceUpdate={(shortcutID: string, updated: string[]) =>
                                onUpdateModifier(assistModifier, updated, onChangeAssistModifier)}
                        />
                    </div>
                </Col>
                <Col span={24}>
                    <Text className='cvat-text-color'>Equal-spacing modifier (to disable):</Text>
                    <div>
                        <MultipleShortcutsDisplay
                            id='FAST_CVAT_EQUAL_MOD'
                            keyMap={{} as any}
                            item={buildFakeItem(
                                'FAST_CVAT_EQUAL_MOD',
                                'Equal-spacing modifier',
                                'Hold to temporarily disable equal-spacing hints/snaps',
                                equalSpacingModifier === 'control' ? 'ctrl' : equalSpacingModifier,
                            ).item}
                            onKeySequenceUpdate={(shortcutID: string, updated: string[]) =>
                                onUpdateModifier(equalSpacingModifier, updated, onChangeEqualSpacingModifier)}
                        />
                    </div>
                </Col>
            </Row>
        </div>
    );
}

export default React.memo(FastCvatSettingsComponent);
