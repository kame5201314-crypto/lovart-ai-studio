import React from 'react';
import { Group, Circle, Text } from 'react-konva';
import type Konva from 'konva';
import type { MarkerLayer } from '../../types';

interface MarkerLayerComponentProps {
  layer: MarkerLayer;
  isDraggable: boolean;
  onClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd: (e: Konva.KonvaEventObject<Event>) => void;
}

export const MarkerLayerComponent: React.FC<MarkerLayerComponentProps> = ({
  layer,
  isDraggable,
  onClick,
  onDragEnd,
  onTransformEnd,
}) => {
  const radius = layer.width / 2;

  return (
    <Group
      id={layer.id}
      x={layer.x + radius}
      y={layer.y + radius}
      draggable={isDraggable}
      onClick={onClick}
      onDragEnd={onDragEnd}
      onTransformEnd={onTransformEnd}
      opacity={layer.opacity}
      rotation={layer.rotation}
    >
      {/* 標記圓圈 */}
      <Circle
        radius={radius}
        fill={layer.color}
        stroke="#ffffff"
        strokeWidth={2}
        shadowColor="rgba(0,0,0,0.3)"
        shadowBlur={4}
        shadowOffset={{ x: 2, y: 2 }}
      />
      {/* 標記數字 */}
      <Text
        text={String(layer.number)}
        fontSize={layer.number >= 10 ? 14 : 16}
        fontFamily="Arial"
        fontStyle="bold"
        fill="#ffffff"
        align="center"
        verticalAlign="middle"
        width={radius * 2}
        height={radius * 2}
        offsetX={radius}
        offsetY={radius}
      />
    </Group>
  );
};

export default MarkerLayerComponent;
