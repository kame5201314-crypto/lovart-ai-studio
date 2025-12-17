import React from 'react';
import { Line } from 'react-konva';

export interface GuideLine {
  points: number[];
  orientation: 'horizontal' | 'vertical';
}

interface AlignmentGuidesProps {
  guides: GuideLine[];
  stageWidth: number;
  stageHeight: number;
}

export const AlignmentGuides: React.FC<AlignmentGuidesProps> = ({ guides, stageWidth, stageHeight }) => {
  return (
    <>
      {guides.map((guide, index) => (
        <Line
          key={`guide-${index}`}
          points={guide.orientation === 'vertical' ? [guide.points[0], 0, guide.points[0], stageHeight] : [0, guide.points[1], stageWidth, guide.points[1]]}
          stroke="#00D4FF"
          strokeWidth={1}
          dash={[4, 4]}
          listening={false}
        />
      ))}
    </>
  );
};

export const SNAP_THRESHOLD = 8;

interface LayerBounds {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const getLayerSnapPoints = (layer: LayerBounds) => ({
  vertical: [layer.x, layer.x + layer.width / 2, layer.x + layer.width],
  horizontal: [layer.y, layer.y + layer.height / 2, layer.y + layer.height],
});

export const calculateSnap = (
  movingLayer: LayerBounds,
  allLayers: LayerBounds[],
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number; guides: GuideLine[] } => {
  const guides: GuideLine[] = [];
  let snapX = movingLayer.x;
  let snapY = movingLayer.y;
  const movingPoints = getLayerSnapPoints(movingLayer);
  const canvasSnapPoints = { vertical: [0, canvasWidth / 2, canvasWidth], horizontal: [0, canvasHeight / 2, canvasHeight] };
  const otherSnapPoints = allLayers.filter(l => l.id !== movingLayer.id).map(getLayerSnapPoints);
  const allV = [...canvasSnapPoints.vertical, ...otherSnapPoints.flatMap(p => p.vertical)];
  const allH = [...canvasSnapPoints.horizontal, ...otherSnapPoints.flatMap(p => p.horizontal)];

  for (const mp of movingPoints.vertical) {
    for (const tp of allV) {
      if (Math.abs(mp - tp) < SNAP_THRESHOLD) {
        snapX = movingLayer.x + (tp - mp);
        guides.push({ points: [tp, 0], orientation: 'vertical' });
        break;
      }
    }
  }

  for (const mp of movingPoints.horizontal) {
    for (const tp of allH) {
      if (Math.abs(mp - tp) < SNAP_THRESHOLD) {
        snapY = movingLayer.y + (tp - mp);
        guides.push({ points: [0, tp], orientation: 'horizontal' });
        break;
      }
    }
  }

  return { x: snapX, y: snapY, guides };
};

export default AlignmentGuides;
