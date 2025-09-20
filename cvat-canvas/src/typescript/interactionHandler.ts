// Copyright (C) 2020-2022 Intel Corporation
// Copyright (C) CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import * as SVG from 'svg.js';
import consts from './consts';
import Crosshair from './crosshair';
import {
    translateToSVG, translateFromSVG, PropType, stringifyPoints, translateToCanvas, expandChannels, imageDataToDataURL,
} from './shared';

import {
    InteractionData, InteractionResult, Geometry, Configuration,
} from './canvasModel';

export interface InteractionHandler {
    transform(geometry: Geometry): void;
    interact(interactData: InteractionData): void;
    configure(config: Configuration): void;
    destroy(): void;
    cancel(): void;
}

export class InteractionHandlerImpl implements InteractionHandler {
    private onInteraction: (shapes: InteractionResult[] | null, shapesUpdated?: boolean, isDone?: boolean) => void;
    private geometry: Geometry;
    private canvas: SVG.Container;
    private interactionData: InteractionData;
    private cursorPosition: { x: number; y: number };
    private shapesWereUpdated: boolean;
    private interactionShapes: SVG.Shape[];
    private currentInteractionShape: SVG.Shape | null;
    private crosshair: Crosshair;
    private intermediateShape: PropType<InteractionData, 'intermediateShape'>;
    private drawnIntermediateShape: SVG.Shape;
    private controlPointsSize: number;
    private selectedShapeOpacity: number;
    private cancelled: boolean;
    private snapTolerancePx: number;
    private crosshairHighlightEnabled: boolean;
    private rectangleSnapEnabled: boolean;

    private prepareResult(): InteractionResult[] {
        return this.interactionShapes.map(
            (shape: SVG.Shape): InteractionResult => {
                if (shape.type === 'circle') {
                    const points = [(shape as SVG.Circle).cx(), (shape as SVG.Circle).cy()];
                    return {
                        points: points.map((coord: number): number => coord - this.geometry.offset),
                        shapeType: 'points',
                        button: shape.attr('stroke') === 'green' ? 0 : 2,
                    };
                }

                const bbox = ((shape.node as any) as SVGRectElement).getBBox();
                const points = [bbox.x, bbox.y, bbox.x + bbox.width, bbox.y + bbox.height];
                return {
                    points: points.map((coord: number): number => coord - this.geometry.offset),
                    shapeType: 'rectangle',
                    button: 0,
                };
            },
        );
    }

    private shouldRaiseEvent(): boolean {
        const { interactionData, interactionShapes, shapesWereUpdated } = this;
        const { minPosVertices, minNegVertices, enabled } = interactionData;

        const positiveShapes = interactionShapes.filter(
            (shape: SVG.Shape): boolean => (shape as any).attr('stroke') === 'green',
        );
        const negativeShapes = interactionShapes.filter(
            (shape: SVG.Shape): boolean => (shape as any).attr('stroke') !== 'green',
        );

        const somethingWasDrawn = interactionShapes.some((shape) => shape.type === 'rect') || positiveShapes.length;
        if (interactionData.shapeType === 'rectangle') {
            return enabled && !!interactionShapes.length;
        }

        const minPosVerticesDefined = Number.isInteger(minPosVertices);
        const minNegVerticesDefined = Number.isInteger(minNegVertices) && minNegVertices >= 0;
        const minPosVerticesAchieved = !minPosVerticesDefined || minPosVertices <= positiveShapes.length;
        const minNegVerticesAchieved = !minNegVerticesDefined || minNegVertices <= negativeShapes.length;
        const minimumVerticesAchieved = minPosVerticesAchieved && minNegVerticesAchieved;
        return enabled && somethingWasDrawn && minimumVerticesAchieved && shapesWereUpdated;
    }

    private addCrosshair(): void {
        const { x, y } = this.cursorPosition;
        this.crosshair.show(this.canvas, x, y, this.geometry.scale);
    }

    private removeCrosshair(): void {
        this.crosshair.hide();
    }

    private interactPoints(): void {
        const eventListener = (e: MouseEvent): void => {
            if ((e.button === 0 || (e.button === 2 && this.interactionData.minNegVertices >= 0)) && !e.altKey) {
                e.preventDefault();
                const [cx, cy] = translateToSVG((this.canvas.node as any) as SVGSVGElement, [e.clientX, e.clientY]);
                if (!this.isWithinFrame(cx, cy)) return;

                this.currentInteractionShape = this.canvas
                    .circle((this.controlPointsSize * 2) / this.geometry.scale)
                    .center(cx, cy)
                    .fill('white')
                    .stroke(e.button === 0 ? 'green' : 'red')
                    .addClass('cvat_interaction_point')
                    .attr({
                        'stroke-width': consts.POINTS_STROKE_WIDTH / this.geometry.scale,
                    });

                this.interactionShapes.push(this.currentInteractionShape);
                this.shapesWereUpdated = true;
                if (this.shouldRaiseEvent()) {
                    this.onInteraction(this.prepareResult(), true, false);
                }

                const self = this.currentInteractionShape;
                self.on('mouseenter', (): void => {
                    if (this.interactionData.allowRemoveOnlyLast) {
                        if (this.interactionShapes.indexOf(self) !== this.interactionShapes.length - 1) {
                            return;
                        }
                    }

                    self.addClass('cvat_canvas_removable_interaction_point');
                    self.attr({
                        'stroke-width': consts.POINTS_SELECTED_STROKE_WIDTH / this.geometry.scale,
                        r: (this.controlPointsSize * 1.5) / this.geometry.scale,
                    });

                    self.on('mousedown', (_e: MouseEvent): void => {
                        _e.preventDefault();
                        _e.stopPropagation();
                        self.remove();
                        this.shapesWereUpdated = true;
                        this.interactionShapes = this.interactionShapes.filter(
                            (shape: SVG.Shape): boolean => shape !== self,
                        );
                        if (this.interactionData.startWithBox && this.interactionShapes.length === 1) {
                            this.interactionShapes[0].style({ visibility: '' });
                        }
                        const shouldRaiseEvent = this.shouldRaiseEvent();
                        if (shouldRaiseEvent) {
                            this.onInteraction(this.prepareResult(), true, false);
                        }
                    });
                });

                self.on('mouseleave', (): void => {
                    self.removeClass('cvat_canvas_removable_interaction_point');
                    self.attr({
                        'stroke-width': consts.POINTS_STROKE_WIDTH / this.geometry.scale,
                        r: this.controlPointsSize / this.geometry.scale,
                    });

                    self.off('mousedown');
                });
            }
        };

        // clear this listener in release()
        this.canvas.on('mousedown.interaction', eventListener);
    }

    private interactRectangle(shouldFinish: boolean, onContinue?: () => void): void {
        let initialized = false;
        const eventListener = (e: MouseEvent): void => {
            if (e.button === 0 && !e.altKey) {
                if (!initialized) {
                    // Start from snapped position if snapping is enabled
                    const shouldSnapStart = this.rectangleSnapEnabled && !e.ctrlKey &&
                        this.interactionData?.shapeType === 'rectangle';
                    const startEvent = (() => {
                        if (!shouldSnapStart) return e;
                        const [clientX, clientY] = translateFromSVG(
                            (this.canvas.node as any) as SVGSVGElement,
                            [this.cursorPosition.x, this.cursorPosition.y],
                        );
                        try {
                            return new MouseEvent('mousedown', {
                                clientX,
                                clientY,
                                button: e.button,
                                ctrlKey: e.ctrlKey,
                                altKey: e.altKey,
                                shiftKey: e.shiftKey,
                                metaKey: e.metaKey,
                                bubbles: true,
                                cancelable: true,
                                composed: true,
                            });
                        } catch (_) {
                            return e;
                        }
                    })();

                    (this.currentInteractionShape as any).draw(startEvent, { snapToGrid: 0.1 });
                    initialized = true;
                } else {
                    (this.currentInteractionShape as any).draw(e);
                }
            }
        };

        this.currentInteractionShape = this.canvas.rect();
        this.canvas.on('mousedown.interaction', eventListener);
        this.currentInteractionShape
            .on('drawstop', (): void => {
                if (this.cancelled) {
                    return;
                }

                this.canvas.off('mousedown.interaction', eventListener);
                this.interactionShapes.push(this.currentInteractionShape);
                this.shapesWereUpdated = true;

                if (shouldFinish) {
                    this.interact({ enabled: false });
                } else if (this.shouldRaiseEvent()) {
                    this.onInteraction(this.prepareResult(), true, false);
                }

                if (onContinue) {
                    onContinue();
                }
            })
            .addClass('cvat_canvas_shape_drawing')
            .attr({
                'stroke-width': consts.BASE_STROKE_WIDTH / this.geometry.scale,
            })
            .fill({ opacity: this.selectedShapeOpacity, color: 'white' });
    }

    private initInteraction(): void {
        if (this.interactionData.crosshair) {
            this.addCrosshair();
        } else if (this.crosshair) {
            this.removeCrosshair();
        }
    }

    private startInteraction(): void {
        if (this.interactionData.shapeType === 'rectangle') {
            this.interactRectangle(true);
        } else if (this.interactionData.shapeType === 'points') {
            if (this.interactionData.startWithBox) {
                this.interactRectangle(false, (): void => this.interactPoints());
            } else {
                this.interactPoints();
            }
        } else {
            throw new Error('Interactor implementation supports only rectangle and points');
        }
    }

    private release(): void {
        if (this.currentInteractionShape && this.currentInteractionShape.remember('_paintHandler')) {
            // Cancel active drawing first
            (this.currentInteractionShape as any).draw('cancel');
        }

        if (this.drawnIntermediateShape) {
            this.drawnIntermediateShape.remove();
            this.drawnIntermediateShape = null;
        }

        if (this.crosshair) {
            this.removeCrosshair();
        }

        this.canvas.off('mousedown.interaction');
        this.interactionShapes.forEach((shape: SVG.Shape): SVG.Shape => shape.remove());
        this.interactionShapes = [];
        if (this.currentInteractionShape) {
            this.currentInteractionShape.remove();
            this.currentInteractionShape = null;
        }
    }

    private isWithinFrame(x: number, y: number): boolean {
        const { offset, image } = this.geometry;
        const { width, height } = image;
        const [imageX, imageY] = [Math.round(x - offset), Math.round(y - offset)];
        return imageX >= 0 && imageX < width && imageY >= 0 && imageY < height;
    }

    private updateIntermediateShape(): void {
        const { intermediateShape, geometry } = this;
        if (!intermediateShape) {
            if (this.drawnIntermediateShape) {
                this.drawnIntermediateShape.remove();
            }

            return;
        }

        const { shapeType, points } = intermediateShape;
        if (this.drawnIntermediateShape?.type === 'polygon' && shapeType === 'polygon') {
            const isInvalidShape = shapeType === 'polygon' && points.length < 3 * 2;
            this.drawnIntermediateShape.attr('points', stringifyPoints(translateToCanvas(geometry.offset, points)));
            this.drawnIntermediateShape.stroke(isInvalidShape ? 'red' : 'black');
            return;
        }

        this.drawnIntermediateShape?.remove();
        if (shapeType === 'polygon') {
            const isInvalidShape = shapeType === 'polygon' && points.length < 3 * 2;
            this.drawnIntermediateShape = this.canvas
                .polygon(stringifyPoints(translateToCanvas(geometry.offset, points)))
                .attr({
                    'color-rendering': 'optimizeQuality',
                    'shape-rendering': 'geometricprecision',
                    'stroke-width': consts.BASE_STROKE_WIDTH / this.geometry.scale,
                    stroke: isInvalidShape ? 'red' : 'black',
                })
                .fill({ opacity: this.selectedShapeOpacity, color: 'white' })
                .addClass('cvat_canvas_interact_intermediate_shape');
            this.canvas.node.prepend(this.drawnIntermediateShape.node);
        } else if (shapeType === 'mask') {
            const [left, top, right, bottom] = points.slice(-4);
            const imageBitmap = expandChannels(255, 255, 255, points);

            const image = this.canvas.image().attr({
                'color-rendering': 'optimizeQuality',
                'shape-rendering': 'geometricprecision',
                'pointer-events': 'none',
                opacity: 0.5,
            }).addClass('cvat_canvas_interact_intermediate_shape');
            image.move(this.geometry.offset + left, this.geometry.offset + top);
            this.drawnIntermediateShape = image;
            this.canvas.node.prepend(this.drawnIntermediateShape.node);

            imageDataToDataURL(
                imageBitmap,
                right - left + 1,
                bottom - top + 1,
                (dataURL: string) => new Promise((resolve, reject) => {
                    image.loaded(() => {
                        resolve();
                    });
                    image.error(() => {
                        reject();
                    });
                    image.load(dataURL);
                }),
            );
        } else {
            throw new Error(
                `Shape type "${shapeType}" was not implemented at interactionHandler::updateIntermediateShape`,
            );
        }
    }

    private visualComponentsChanged(interactionData: InteractionData): boolean {
        const allowedKeys = ['enabled', 'crosshair'];
        if (Object.keys(interactionData).every((key: string): boolean => allowedKeys.includes(key))) {
            if (this.interactionData.crosshair !== undefined && interactionData.crosshair !== undefined &&
                this.interactionData.crosshair !== interactionData.crosshair) {
                return true;
            }
        }
        return false;
    }

    public constructor(
        onInteraction: (
            shapes: InteractionResult[] | null,
            shapesUpdated?: boolean,
            isDone?: boolean,
        ) => void,
        canvas: SVG.Container,
        geometry: Geometry,
        configuration: Configuration,
    ) {
        this.onInteraction = (shapes: InteractionResult[] | null, shapesUpdated?: boolean, isDone?: boolean): void => {
            this.shapesWereUpdated = false;
            onInteraction(shapes, shapesUpdated, isDone);
        };
        this.canvas = canvas;
        this.geometry = geometry;
        this.shapesWereUpdated = false;
        this.interactionShapes = [];
        this.interactionData = { enabled: false };
        this.currentInteractionShape = null;
        this.crosshair = new Crosshair();
        this.intermediateShape = null;
        this.drawnIntermediateShape = null;
        this.controlPointsSize = configuration.controlPointsSize;
        this.selectedShapeOpacity = configuration.selectedShapeOpacity;
        this.snapTolerancePx = Math.max(0, configuration.snapTolerancePx ?? 2);
        this.crosshairHighlightEnabled = configuration.highlightCrosshairOverlaps ?? true;
        this.rectangleSnapEnabled = configuration.enableRectangleDrawingSnap ?? true;
        this.crosshair.setHighlightEnabled(this.crosshairHighlightEnabled);
        this.cursorPosition = {
            x: 0,
            y: 0,
        };

        this.canvas.on('mousemove.interaction', (e: MouseEvent): void => {
            let [x, y] = translateToSVG((this.canvas.node as any) as SVGSVGElement, [e.clientX, e.clientY]);

            const shouldSnap = !e.ctrlKey && this.rectangleSnapEnabled &&
                this.interactionData?.shapeType === 'rectangle';
            if (shouldSnap) {
                const scale = this.geometry.scale;
                const threshold = Math.max(0, this.snapTolerancePx) / scale;
                const rects = Array.from(
                    (this.canvas.node as any as SVGSVGElement).getElementsByClassName('cvat_canvas_shape'),
                ).filter((el: Element) => el.tagName && el.tagName.toLowerCase() === 'rect') as SVGRectElement[];

                let bestDX = Number.POSITIVE_INFINITY;
                let snapX: number | null = null;
                let bestDY = Number.POSITIVE_INFINITY;
                let snapY: number | null = null;

                for (const rect of rects) {
                    if ((rect as any).classList.contains('cvat_canvas_hidden')) continue;
                    const bb = rect.getBBox();
                    const candX = [bb.x, bb.x + bb.width];
                    const candY = [bb.y, bb.y + bb.height];
                    for (const cx of candX) {
                        const dx = Math.abs(x - cx);
                        if (dx <= threshold && dx < bestDX) {
                            bestDX = dx;
                            snapX = cx;
                        }
                    }
                    for (const cy of candY) {
                        const dy = Math.abs(y - cy);
                        if (dy <= threshold && dy < bestDY) {
                            bestDY = dy;
                            snapY = cy;
                        }
                    }
                }

                if (snapX !== null) x = snapX;
                if (snapY !== null) y = snapY;
            }

            this.cursorPosition = { x, y };
            if (this.crosshair) {
                this.crosshair.move(x, y);
            }

            // While drawing an interaction rectangle, keep the overlay aligned with snapped position
            const isDrawingRect = this.currentInteractionShape && this.currentInteractionShape.type === 'rect' &&
                !!this.currentInteractionShape.remember('_paintHandler') && this.interactionData?.shapeType === 'rectangle';
            if (isDrawingRect && shouldSnap) {
                const [clientX, clientY] = translateFromSVG(
                    (this.canvas.node as any) as SVGSVGElement,
                    [x, y],
                );
                let updateEvent: MouseEvent;
                try {
                    updateEvent = new MouseEvent('mousemove', {
                        clientX,
                        clientY,
                        button: e.button,
                        ctrlKey: e.ctrlKey,
                        altKey: e.altKey,
                        shiftKey: e.shiftKey,
                        metaKey: e.metaKey,
                        bubbles: true,
                        cancelable: true,
                        composed: true,
                    });
                } catch (_) {
                    updateEvent = e;
                }

                const invokeUpdate = () => {
                    try {
                        (this.currentInteractionShape as any).draw('update', updateEvent);
                    } catch (_) { /* ignore */ }
                };

                try {
                    window.requestAnimationFrame(invokeUpdate);
                } catch (_) {
                    setTimeout(invokeUpdate, 0);
                }
            }

            if (this.interactionData.enableSliding && this.interactionShapes.length) {
                if (this.isWithinFrame(x, y)) {
                    this.onInteraction(
                        [
                            ...this.prepareResult(),
                            {
                                points: [x - this.geometry.offset, y - this.geometry.offset],
                                shapeType: 'points',
                                button: 0,
                            },
                        ],
                        true,
                        false,
                    );
                }
            }
        });
    }

    public transform(geometry: Geometry): void {
        this.geometry = geometry;

        if (this.crosshair) {
            this.crosshair.scale(this.geometry.scale);
        }

        const shapesToBeScaled = this.currentInteractionShape ?
            [...this.interactionShapes, this.currentInteractionShape] :
            [...this.interactionShapes];
        for (const shape of shapesToBeScaled) {
            if (shape.type === 'circle') {
                if (shape.hasClass('cvat_canvas_removable_interaction_point')) {
                    (shape as SVG.Circle).radius((this.controlPointsSize * 1.5) / this.geometry.scale);
                    shape.attr('stroke-width', consts.POINTS_SELECTED_STROKE_WIDTH / this.geometry.scale);
                } else {
                    (shape as SVG.Circle).radius(this.controlPointsSize / this.geometry.scale);
                    shape.attr('stroke-width', consts.POINTS_STROKE_WIDTH / this.geometry.scale);
                }
            } else {
                shape.attr('stroke-width', consts.BASE_STROKE_WIDTH / this.geometry.scale);
            }
        }

        if (this.drawnIntermediateShape) {
            this.drawnIntermediateShape.stroke({ width: consts.BASE_STROKE_WIDTH / this.geometry.scale });
        }
    }

    public interact(interactionData: InteractionData): void {
        if (interactionData.enabled) {
            this.cancelled = false;
            if (interactionData.intermediateShape) {
                this.intermediateShape = interactionData.intermediateShape;
                this.updateIntermediateShape();
                if (this.interactionData.startWithBox) {
                    this.interactionShapes[0].style({ visibility: 'hidden' });
                }
            } else if (this.visualComponentsChanged(interactionData)) {
                this.interactionData = { ...this.interactionData, ...interactionData };
                this.initInteraction();
            } else if (interactionData.enabled) {
                this.interactionData = interactionData;
                this.initInteraction();
                this.startInteraction();
            }
        } else {
            if (this.currentInteractionShape && this.currentInteractionShape.remember('_paintHandler')) {
                // Finish active drawing first if possible
                (this.currentInteractionShape as any).draw('stop');
            }

            this.onInteraction(this.prepareResult(), this.shouldRaiseEvent(), true);
            this.release();
            this.interactionData = interactionData;
        }
    }

    public configure(configuration: Configuration): void {
        this.controlPointsSize = configuration.controlPointsSize;
        this.selectedShapeOpacity = configuration.selectedShapeOpacity;
        if (typeof configuration.snapTolerancePx === 'number') {
            this.snapTolerancePx = Math.max(0, configuration.snapTolerancePx);
        }
        if (typeof configuration.highlightCrosshairOverlaps === 'boolean') {
            this.crosshairHighlightEnabled = configuration.highlightCrosshairOverlaps;
            this.crosshair.setHighlightEnabled(this.crosshairHighlightEnabled);
        }
        if (typeof configuration.enableRectangleDrawingSnap === 'boolean') {
            this.rectangleSnapEnabled = configuration.enableRectangleDrawingSnap;
        }

        if (this.drawnIntermediateShape) {
            this.drawnIntermediateShape.fill({
                opacity: configuration.selectedShapeOpacity,
            });
        }

        // when interactRectangle
        if (this.currentInteractionShape && this.currentInteractionShape.type === 'rect') {
            this.currentInteractionShape.fill({ opacity: configuration.selectedShapeOpacity });
        }

        // when interactPoints with startwithbbox
        if (this.interactionShapes[0] && this.interactionShapes[0].type === 'rect') {
            this.interactionShapes[0].fill({ opacity: configuration.selectedShapeOpacity });
        }
    }

    public cancel(): void {
        this.cancelled = true;
        this.release();
        this.onInteraction(null);
    }

    public destroy(): void {
        // nothing to release
    }
}
