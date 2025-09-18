// Copyright (C) CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import {
    Button,
    Col,
    Flex,
    Row,
    Collapse,
    List,
    Alert,
    Switch,
} from 'antd/lib';
import Search from 'antd/lib/input/Search';
import Empty from 'antd/lib/empty';
import Modal from 'antd/lib/modal';
import React, {
    useState, useMemo,
    useCallback,
} from 'react';
import { ShortcutScope } from 'utils/enums';
import { KeyMap } from 'utils/mousetrap-react';
import { shortcutsActions } from 'actions/shortcuts-actions';
import { useDispatch, useSelector } from 'react-redux';
import { CombinedState } from 'reducers';
import MultipleShortcutsDisplay from './multiple-shortcuts-display';
import { SHORTCUTS_FEATURE_TOGGLES, SHORTCUTS_DEFAULT_FEATURE_TOGGLE_STATE } from 'utils/shortcuts-feature-toggles';

interface Props {
    keyMap: KeyMap;
    onKeySequenceUpdate(shortcutID: string, updatedSequence: string[]): void;
}

function ShortcutsSettingsComponent(props: Props): JSX.Element {
    const { keyMap, onKeySequenceUpdate } = props;
    const [searchValue, setSearchValue] = useState('');
    const shortcuts = useSelector((state: CombinedState) => state.shortcuts);
    const [activeKeys, setActiveKeys] = useState<string[]>([]);
    const dispatch = useDispatch();

    const onSearchChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        setSearchValue(event.target.value.toLowerCase());
    };

    const onRestoreDefaults = useCallback(() => {
        Modal.confirm({
            title: 'Are you sure you want to restore defaults?',
            okText: 'Yes',
            className: 'cvat-shortcuts-settings-restore-modal',
            cancelText: 'No',
            onOk: () => {
                const currentSettings = localStorage.getItem('clientSettings');
                dispatch(shortcutsActions.registerShortcuts({ ...shortcuts.defaultState }));
                // Also reset feature toggles to defaults immediately (no refresh needed)
                dispatch(shortcutsActions.setFeatureToggles(SHORTCUTS_DEFAULT_FEATURE_TOGGLE_STATE));
                if (currentSettings) {
                    try {
                        const parsedSettings = JSON.parse(currentSettings);
                        delete parsedSettings.shortcuts;
                        localStorage.setItem('clientSettings', JSON.stringify(parsedSettings));
                    } catch (error) {
                        localStorage.removeItem('clientSettings');
                    }
                }
            },
        });
    }, [shortcuts.defaultState]);

    const filteredKeyMap = useMemo(() => Object.entries(keyMap).filter(
        ([, item]) => (
            item.name.toLowerCase().includes(searchValue) ||
            item.description.toLowerCase().includes(searchValue)
        ),
    ), [keyMap, searchValue]);

    const items: any = useMemo(() => {
        const normalizedSearch = searchValue.trim().toLowerCase();

        const featureSections = SHORTCUTS_FEATURE_TOGGLES.filter((toggle) => (
            !normalizedSearch ||
            toggle.title.toLowerCase().includes(normalizedSearch) ||
            toggle.description.toLowerCase().includes(normalizedSearch)
        ));

        const sections: any[] = [];

        if (featureSections.length) {
            sections.push({
                label: <span className='cvat-shortcuts-settings-label cvat-shortcuts-settings-cvat-gui-label'>CVAT-GUI++ Features</span>,
                key: ShortcutScope.CVAT_GUI,
                showArrow: true,
                className: 'cvat-shortcuts-settings-cvat-gui',
                children: (
                    <List
                        dataSource={featureSections}
                        renderItem={(item) => (
                            <List.Item
                                key={item.id}
                                className='cvat-shortcuts-settings-collapse-item'
                            >
                                <List.Item.Meta
                                    title={<p className='cvat-shortcuts-settings-item-title'>{item.title}</p>}
                                    description={<span className='cvat-shortcuts-settings-item-description'>{item.description}</span>}
                                />
                                <Switch
                                    checked={shortcuts.featureToggles[item.id]}
                                    onChange={(checked) => dispatch(
                                        shortcutsActions.setFeatureToggle(item.id, checked),
                                    )}
                                />
                            </List.Item>
                        )}
                        style={{ paddingLeft: 5 }}
                    />
                ),
            });
        }

        const scopeItems = Object.values(ShortcutScope)
            .filter((scope: string) => scope !== ShortcutScope.CVAT_GUI)
            .map((scope: string) => {
            const viewFilteredItems = filteredKeyMap.filter(
                ([, item]) => item.scope === scope,
            ).sort(([, item1], [, item2]) => (item1.displayWeight ?? 0) - (item2.displayWeight ?? 0));
            if (viewFilteredItems.length === 0) {
                return null;
            }

            let scopeTitle = scope.split('_').join(' ');
            const firstAlphaIndex = scopeTitle.search(/[a-zA-Z]/);
            if (firstAlphaIndex !== -1) {
                scopeTitle = scopeTitle.slice(0, firstAlphaIndex) +
                scopeTitle.charAt(firstAlphaIndex).toUpperCase() +
                scopeTitle.slice(firstAlphaIndex + 1).toLowerCase();
            }
            return {
                label: <span className='cvat-shortcuts-settings-label'>{scopeTitle}</span>,
                key: scope,
                showArrow: !searchValue,
                children: (
                    <List
                        dataSource={viewFilteredItems}
                        renderItem={([id, item]) => (
                            <List.Item
                                className='cvat-shortcuts-settings-collapse-item'
                            >
                                <List.Item.Meta
                                    className={`${item.nonActive ? 'cvat-shortcuts-settings-item-non-active' : ''}`}
                                    title={<p className='cvat-shortcuts-settings-item-title'>{item.name}</p>}
                                    description={<span className='cvat-shortcuts-settings-item-description'>{item.description}</span>}
                                />
                                <MultipleShortcutsDisplay
                                    id={id}
                                    keyMap={keyMap}
                                    item={item}
                                    onKeySequenceUpdate={onKeySequenceUpdate}
                                />
                            </List.Item>
                        )}
                        style={{ paddingLeft: 5 }}
                    />
                ),
            };
        }).filter(Boolean);

        const filteredScopeItems = scopeItems.filter(Boolean);

        if (!sections.length && filteredScopeItems.length === 0) {
            return null;
        }

        return [...sections, ...filteredScopeItems];
    }, [dispatch, filteredKeyMap, searchValue, shortcuts.featureToggles]);

    const handleCollapseChange = (keys: string[] | string): void => {
        if (!searchValue) {
            setActiveKeys(Array.isArray(keys) ? keys : [keys]);
        }
    };

    return (
        <div className='cvat-shortcuts-settings'>
            <Row className='cvat-shortcuts-setting'>
                <Col span={24}>
                    <Flex gap={4}>
                        <Search
                            size='large'
                            placeholder='Search for a shortcut here...'
                            allowClear
                            onChange={onSearchChange}
                            className='cvat-shortcuts-settings-search'
                        />
                        <Button size='large' onClick={onRestoreDefaults} className='cvat-shortcuts-settings-restore'>Restore Defaults</Button>
                    </Flex>
                </Col>
            </Row>
            <Row className='cvat-shortcuts-setting'>
                <Col span={24}>
                    <Alert message='Shortcut may consist of any combination of modifiers (alt, ctrl, or shift) and one non-modifier at the end. Some key combinations may be reserved by the browser and cannot be overridden in CVAT.' type='warning' showIcon />
                    {items ? (
                        <Collapse
                            items={items}
                            bordered={false}
                            activeKey={searchValue ? Object.values(ShortcutScope) : activeKeys}
                            onChange={handleCollapseChange}
                            className='cvat-shortcuts-settings-collapse'
                        />
                    ) : (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    )}
                </Col>
            </Row>
        </div>
    );
}

export default React.memo(ShortcutsSettingsComponent);
