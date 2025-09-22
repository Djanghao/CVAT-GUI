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
import { registerComponentShortcuts } from 'actions/shortcuts-actions';
import { ShortcutScope } from 'utils/enums';
import { getCVATStore } from 'cvat-store';

import { clamp } from 'utils/math';

type ModifierKey = 'control' | 'alt' | 'shift' | 'meta';

const MODIFIER_TO_SEQUENCE: Record<ModifierKey, string> = {
    control: 'ctrl',
    alt: 'alt',
    shift: 'shift',
    meta: 'meta',
};

const SEQUENCE_TO_MODIFIER: Record<string, ModifierKey> = {
    ctrl: 'control',
    alt: 'alt',
    shift: 'shift',
    meta: 'meta',
};

const DEFAULT_ASSIST_MODIFIER: ModifierKey = 'control';
const DEFAULT_EQUAL_MODIFIER: ModifierKey = 'alt';

const storeState = getCVATStore().getState();
const workspaceSettings = storeState.settings?.workspace ?? {};

const initialAssistModifier = (workspaceSettings.assistModifier as ModifierKey) || DEFAULT_ASSIST_MODIFIER;
const initialEqualModifier = (workspaceSettings.equalSpacingModifier as ModifierKey) || DEFAULT_EQUAL_MODIFIER;

registerComponentShortcuts({
    FAST_CVAT_ASSIST_MOD: {
        name: 'Assist modifier',
        description: 'Hold to temporarily disable draw/move snapping & guides',
        sequences: [MODIFIER_TO_SEQUENCE[initialAssistModifier] || MODIFIER_TO_SEQUENCE[DEFAULT_ASSIST_MODIFIER]],
        scope: ShortcutScope.FAST_CVAT,
        displayWeight: 0,
    },
    FAST_CVAT_EQUAL_MOD: {
        name: 'Equal-spacing modifier',
        description: 'Hold to temporarily disable equal-spacing hints/snaps',
        sequences: [MODIFIER_TO_SEQUENCE[initialEqualModifier] || MODIFIER_TO_SEQUENCE[DEFAULT_EQUAL_MODIFIER]],
        scope: ShortcutScope.FAST_CVAT,
        displayWeight: 1,
    },
});

interface Props {
    rectangleDrawingAssistEnabled: boolean;
    rectangleMovingAssistEnabled: boolean;
    snapTolerance: number;
    equalSpacingTolerance: number;
    autoRectangleOnLabelSwitch: boolean;
    enableEqualSpacingAssist: boolean;
    enableEqualSpacingAssistOnDrag: boolean;
    assistModifier: ModifierKey;
    equalSpacingModifier: ModifierKey;
    keyMap: KeyMap;
    onToggleRectangleDrawingAssist(enabled: boolean): void;
    onToggleRectangleMovingAssist(enabled: boolean): void;
    onChangeSnapTolerance(pixels: number): void;
    onChangeEqualSpacingTolerance(pixels: number): void;
    onSwitchAutoRectangleOnLabelSwitch(enabled: boolean): void;
    onToggleEqualSpacingAssist(enabled: boolean): void;
    onToggleEqualSpacingAssistOnDrag(enabled: boolean): void;
    onChangeAssistModifier(mod: ModifierKey): void;
    onChangeEqualSpacingModifier(mod: ModifierKey): void;
    onUpdateShortcut(shortcutID: string, sequences: string[]): void;
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
        onUpdateShortcut,
        keyMap,
    } = props;

    const minSnapTolerance = 0;
    const maxSnapTolerance = 20;

    const enhancedKeyMap: KeyMap = { ...keyMap };

    const ensureShortcutItem = (
        id: 'FAST_CVAT_ASSIST_MOD' | 'FAST_CVAT_EQUAL_MOD',
        name: string,
        description: string,
        sequence: string,
        displayWeight: number,
    ): KeyMapItem => {
        if (!enhancedKeyMap[id]) {
            enhancedKeyMap[id] = {
                name,
                description,
                sequences: [sequence],
                scope: ShortcutScope.FAST_CVAT,
                displayWeight,
            } as KeyMapItem;
        }
        return enhancedKeyMap[id];
    };

    const assistSequence = MODIFIER_TO_SEQUENCE[assistModifier] || MODIFIER_TO_SEQUENCE[DEFAULT_ASSIST_MODIFIER];
    const equalSequence = MODIFIER_TO_SEQUENCE[equalSpacingModifier] || MODIFIER_TO_SEQUENCE[DEFAULT_EQUAL_MODIFIER];

    const assistShortcutItem = ensureShortcutItem(
        'FAST_CVAT_ASSIST_MOD',
        'Assist modifier',
        'Hold to temporarily disable draw/move snapping & guides',
        assistSequence,
        0,
    );

    const equalShortcutItem = ensureShortcutItem(
        'FAST_CVAT_EQUAL_MOD',
        'Equal-spacing modifier',
        'Hold to temporarily disable equal-spacing hints/snaps',
        equalSequence,
        1,
    );

    const parseModifierSequence = (updated: string[]): { mod: ModifierKey; sequence: string } | 'clear' | 'invalid' => {
        if (!updated.length) {
            return 'clear';
        }

        const last = updated[updated.length - 1];
        if (!last) {
            return 'invalid';
        }

        const normalized = last.toLowerCase().trim();
        const tokens = normalized.split('+').filter(Boolean);
        if (tokens.length !== 1) {
            return 'invalid';
        }

        const token = tokens[0];
        if (!(token in SEQUENCE_TO_MODIFIER)) {
            return 'invalid';
        }

        return {
            mod: SEQUENCE_TO_MODIFIER[token],
            sequence: token,
        };
    };

    const handleAssistShortcutUpdate = (updated: string[]): void => {
        const parsed = parseModifierSequence(updated);
        if (parsed === 'invalid') {
            Modal.error({
                title: 'Only modifier allowed',
                content: 'Please press only one of: Ctrl, Alt, Shift, or Meta',
            });
            return;
        }

        if (parsed === 'clear') {
            const fallbackSequence = MODIFIER_TO_SEQUENCE[DEFAULT_ASSIST_MODIFIER];
            onChangeAssistModifier(DEFAULT_ASSIST_MODIFIER);
            onUpdateShortcut('FAST_CVAT_ASSIST_MOD', [fallbackSequence]);
            return;
        }

        if (assistModifier !== parsed.mod) {
            onChangeAssistModifier(parsed.mod);
        }
        onUpdateShortcut('FAST_CVAT_ASSIST_MOD', [parsed.sequence]);
    };

    const handleEqualShortcutUpdate = (updated: string[]): void => {
        const parsed = parseModifierSequence(updated);
        if (parsed === 'invalid') {
            Modal.error({
                title: 'Only modifier allowed',
                content: 'Please press only one of: Ctrl, Alt, Shift, or Meta',
            });
            return;
        }

        if (parsed === 'clear') {
            const fallbackSequence = MODIFIER_TO_SEQUENCE[DEFAULT_EQUAL_MODIFIER];
            onChangeEqualSpacingModifier(DEFAULT_EQUAL_MODIFIER);
            onUpdateShortcut('FAST_CVAT_EQUAL_MOD', [fallbackSequence]);
            return;
        }

        if (equalSpacingModifier !== parsed.mod) {
            onChangeEqualSpacingModifier(parsed.mod);
        }
        onUpdateShortcut('FAST_CVAT_EQUAL_MOD', [parsed.sequence]);
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
                            keyMap={enhancedKeyMap}
                            item={assistShortcutItem}
                            onKeySequenceUpdate={(_, updated: string[]) => handleAssistShortcutUpdate(updated)}
                        />
                    </div>
                </Col>
                <Col span={24}>
                    <Text className='cvat-text-color'>Equal-spacing modifier (to disable):</Text>
                    <div>
                        <MultipleShortcutsDisplay
                            id='FAST_CVAT_EQUAL_MOD'
                            keyMap={enhancedKeyMap}
                            item={equalShortcutItem}
                            onKeySequenceUpdate={(_, updated: string[]) => handleEqualShortcutUpdate(updated)}
                        />
                    </div>
                </Col>
            </Row>
        </div>
    );
}

export default React.memo(FastCvatSettingsComponent);
