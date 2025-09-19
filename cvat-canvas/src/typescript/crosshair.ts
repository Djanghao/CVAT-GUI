// Copyright (C) 2020-2022 Intel Corporation
//
// SPDX-License-Identifier: MIT

import * as SVG from 'svg.js';
import consts from './consts';

type Interval = [number, number];

export default class Crosshair {
    private xGroup: SVG.G | null;
    private yGroup: SVG.G | null;
    private canvas: SVG.Container | null;
    private lastX: number;
    private lastY: number;
    private lastScale: number;
    private instanceId: string;

    public constructor() {
        this.xGroup = null;
        this.yGroup = null;
        this.canvas = null;
        this.lastX = 0;
        this.lastY = 0;
        this.lastScale = 1;
        this.instanceId = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    }

    private clearGroups(): void {
        if (!this.canvas) return;
        // Remove any crosshair lines created by this instance, even if reparented by sorting
        const selection = (this.canvas.select('.cvat_canvas_crosshair') as any);
        const members: SVG.Element[] = selection && selection.members ? selection.members : [];
        for (const el of members) {
            if (el.attr('data-crosshair-id') === this.instanceId) {
                el.remove();
            }
        }
        // Clean up groups if they still exist
        if (this.xGroup) { this.xGroup.remove(); this.xGroup = null; }
        if (this.yGroup) { this.yGroup.remove(); this.yGroup = null; }
    }

    private getVisibleRects(): SVG.Rect[] {
        if (!this.canvas) return [];
        const selection = (this.canvas.select('rect.cvat_canvas_shape') as any);
        const members: SVG.Rect[] = selection && selection.members ? selection.members : [];
        return members.filter((rect: SVG.Rect) => !rect.hasClass('cvat_canvas_hidden')) as SVG.Rect[];
    }

    private mergeIntervals(intervals: Interval[], min: number, max: number): Interval[] {
        if (!intervals.length) return [];
        const clamped = intervals
            .map(([s, e]) => [Math.max(min, Math.min(s, max)), Math.max(min, Math.min(e, max))] as Interval)
            .filter(([s, e]) => e > s)
            .sort((a, b) => a[0] - b[0]);

        const merged: Interval[] = [];
        for (const cur of clamped) {
            if (!merged.length || cur[0] > merged[merged.length - 1][1]) {
                merged.push([cur[0], cur[1]]);
            } else {
                merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], cur[1]);
            }
        }
        return merged;
    }

    private buildSegments(x: number, y: number, scale: number): void {
        if (!this.canvas) return;

        const width = (this.canvas.node as any).clientWidth as number;
        const height = (this.canvas.node as any).clientHeight as number;
        const strokeWidth = consts.BASE_STROKE_WIDTH / (2 * scale);
        const threshold = 2 / scale; // pixel tolerance for alignment
        const dashedStrokeWidth = consts.BASE_STROKE_WIDTH / (1 * scale); // thicker for emphasis
        const haloWidth = Math.max(dashedStrokeWidth * 1.8, 3 / scale);
        const dashLen = Math.max(8 / scale, 6 / scale);
        const dashArray = `${dashLen} ${dashLen}`;

        const rects = this.getVisibleRects();

        const hOverlaps: Interval[] = [];
        const vOverlaps: Interval[] = [];

        for (const rect of rects) {
            const bb = (rect as any).bbox() as { x: number; y: number; width: number; height: number };
            const left = bb.x;
            const right = bb.x + bb.width;
            const top = bb.y;
            const bottom = bb.y + bb.height;

            if (Math.abs(y - top) <= threshold || Math.abs(y - bottom) <= threshold) {
                hOverlaps.push([left, right]);
            }
            if (Math.abs(x - left) <= threshold || Math.abs(x - right) <= threshold) {
                vOverlaps.push([top, bottom]);
            }
        }

        const mergedH = this.mergeIntervals(hOverlaps, 0, width);
        const mergedV = this.mergeIntervals(vOverlaps, 0, height);

        // Complement segments for solids
        const solidH: Interval[] = [];
        let cursor = 0;
        for (const [s, e] of mergedH) {
            if (s > cursor) solidH.push([cursor, s]);
            cursor = Math.max(cursor, e);
        }
        if (cursor < width) solidH.push([cursor, width]);

        const solidV: Interval[] = [];
        cursor = 0;
        for (const [s, e] of mergedV) {
            if (s > cursor) solidV.push([cursor, s]);
            cursor = Math.max(cursor, e);
        }
        if (cursor < height) solidV.push([cursor, height]);

        // Recreate groups
        this.clearGroups();
        this.xGroup = this.canvas.group();
        this.yGroup = this.canvas.group();

        // Draw horizontal: y = const
        for (const [s, e] of solidH) {
            this.xGroup
                .line(s, y, e, y)
                .attr({ 'stroke-width': strokeWidth })
                .attr({ 'data-crosshair-id': this.instanceId })
                .addClass('cvat_canvas_crosshair');
        }
        for (const [s, e] of mergedH) {
            // halo for visibility
            this.xGroup
                .line(s, y, e, y)
                .attr({
                    'stroke-width': haloWidth,
                    'stroke-linecap': 'round',
                    'stroke-dasharray': dashArray,
                    'stroke-opacity': 0.6,
                })
                .style({ stroke: '#000' })
                .attr({ 'data-crosshair-id': this.instanceId })
                .addClass('cvat_canvas_crosshair');

            // main dashed highlight
            this.xGroup
                .line(s, y, e, y)
                .attr({
                    'stroke-width': dashedStrokeWidth,
                    'stroke-linecap': 'round',
                    'stroke-dasharray': dashArray,
                })
                .style({ stroke: '#FFEB3B' })
                .attr({ 'data-crosshair-id': this.instanceId })
                .addClass('cvat_canvas_crosshair');
        }

        // Draw vertical: x = const
        for (const [s, e] of solidV) {
            this.yGroup
                .line(x, s, x, e)
                .attr({ 'stroke-width': strokeWidth })
                .attr({ 'data-crosshair-id': this.instanceId })
                .addClass('cvat_canvas_crosshair');
        }
        for (const [s, e] of mergedV) {
            // halo for visibility
            this.yGroup
                .line(x, s, x, e)
                .attr({
                    'stroke-width': haloWidth,
                    'stroke-linecap': 'round',
                    'stroke-dasharray': dashArray,
                    'stroke-opacity': 0.6,
                })
                .style({ stroke: '#000' })
                .attr({ 'data-crosshair-id': this.instanceId })
                .addClass('cvat_canvas_crosshair');

            // main dashed highlight
            this.yGroup
                .line(x, s, x, e)
                .attr({
                    'stroke-width': dashedStrokeWidth,
                    'stroke-linecap': 'round',
                    'stroke-dasharray': dashArray,
                })
                .style({ stroke: '#FFEB3B' })
                .attr({ 'data-crosshair-id': this.instanceId })
                .addClass('cvat_canvas_crosshair');
        }
    }

    public show(canvas: SVG.Container, x: number, y: number, scale: number): void {
        if (this.canvas && this.canvas !== canvas) {
            this.clearGroups();
        }
        this.canvas = canvas;
        this.lastX = x;
        this.lastY = y;
        this.lastScale = scale;
        this.buildSegments(x, y, scale);
    }

    public hide(): void {
        this.clearGroups();
        this.canvas = null;
    }

    public move(x: number, y: number): void {
        if (!this.canvas) return;
        this.lastX = x;
        this.lastY = y;
        this.buildSegments(x, y, this.lastScale);
    }

    public scale(scale: number): void {
        if (!this.canvas) return;
        this.lastScale = scale;
        this.buildSegments(this.lastX, this.lastY, scale);
    }
}
