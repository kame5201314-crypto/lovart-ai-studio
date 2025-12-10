import React from 'react';
import { Group, Circle, Text, Label, Tag } from 'react-konva';
import type Konva from 'konva';
import type { MarkerLayer } from '../../types';

interface MarkerLayerComponentProps {
  layer: MarkerLayer;
  isDraggable: boolean;
  isSelected?: boolean;
  onClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd: (e: Konva.KonvaEventObject<Event>) => void;
}

export const MarkerLayerComponent: React.FC<MarkerLayerComponentProps> = ({
  layer,
  isDraggable,
  isSelected = false,
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
        stroke={isSelected ? '#3b82f6' : '#ffffff'}
        strokeWidth={isSelected ? 3 : 2}
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
      {/* 物件名稱標籤（識別後顯示在標記旁邊） */}
      {layer.objectName && !layer.isIdentifying && (
        <Label x={radius + 8} y={-8}>
          <Tag
            fill="rgba(0, 0, 0, 0.75)"
            cornerRadius={4}
            pointerDirection="left"
            pointerWidth={6}
            pointerHeight={8}
          />
          <Text
            text={layer.objectName}
            fontSize={12}
            fontFamily="Arial"
            fill="#ffffff"
            padding={6}
          />
        </Label>
      )}
      {/* 識別中狀態 */}
      {layer.isIdentifying && (
        <Label x={radius + 8} y={-8}>
          <Tag
            fill="rgba(59, 130, 246, 0.9)"
            cornerRadius={4}
            pointerDirection="left"
            pointerWidth={6}
            pointerHeight={8}
          />
          <Text
            text="識別中..."
            fontSize={12}
            fontFamily="Arial"
            fill="#ffffff"
            padding={6}
          />
        </Label>
      )}
    </Group>
  );
};

export default MarkerLayerComponent;
