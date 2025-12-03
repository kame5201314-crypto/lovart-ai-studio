import React, { useRef } from 'react';
import { Rect, Circle, RegularPolygon, Star, Arrow } from 'react-konva';
import type Konva from 'konva';
import type { ShapeLayer } from '../../types';

interface ShapeLayerComponentProps {
  layer: ShapeLayer;
  isDraggable: boolean;
  onClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd: (e: Konva.KonvaEventObject<Event>) => void;
}

export const ShapeLayerComponent: React.FC<ShapeLayerComponentProps> = ({
  layer,
  isDraggable,
  onClick,
  onDragEnd,
  onTransformEnd,
}) => {
  const shapeRef = useRef<Konva.Shape>(null);

  const commonProps = {
    id: layer.id,
    x: layer.x,
    y: layer.y,
    rotation: layer.rotation,
    opacity: layer.opacity,
    draggable: isDraggable,
    onClick,
    onDragEnd,
    onTransformEnd,
    fill: layer.fill,
    stroke: layer.stroke,
    strokeWidth: layer.strokeWidth,
  };

  switch (layer.shapeType) {
    case 'rectangle':
      return (
        <Rect
          ref={shapeRef as React.RefObject<Konva.Rect>}
          {...commonProps}
          width={layer.width}
          height={layer.height}
        />
      );

    case 'circle':
      return (
        <Circle
          ref={shapeRef as React.RefObject<Konva.Circle>}
          {...commonProps}
          x={layer.x + layer.width / 2}
          y={layer.y + layer.height / 2}
          radius={Math.min(layer.width, layer.height) / 2}
        />
      );

    case 'triangle':
      return (
        <RegularPolygon
          ref={shapeRef as React.RefObject<Konva.RegularPolygon>}
          {...commonProps}
          x={layer.x + layer.width / 2}
          y={layer.y + layer.height / 2}
          sides={3}
          radius={Math.min(layer.width, layer.height) / 2}
        />
      );

    case 'star':
      return (
        <Star
          ref={shapeRef as React.RefObject<Konva.Star>}
          {...commonProps}
          x={layer.x + layer.width / 2}
          y={layer.y + layer.height / 2}
          numPoints={5}
          innerRadius={Math.min(layer.width, layer.height) / 4}
          outerRadius={Math.min(layer.width, layer.height) / 2}
        />
      );

    case 'hexagon':
      return (
        <RegularPolygon
          ref={shapeRef as React.RefObject<Konva.RegularPolygon>}
          {...commonProps}
          x={layer.x + layer.width / 2}
          y={layer.y + layer.height / 2}
          sides={6}
          radius={Math.min(layer.width, layer.height) / 2}
        />
      );

    case 'arrow':
      return (
        <Arrow
          ref={shapeRef as React.RefObject<Konva.Arrow>}
          {...commonProps}
          points={[0, layer.height / 2, layer.width, layer.height / 2]}
          pointerLength={20}
          pointerWidth={20}
        />
      );

    default:
      return (
        <Rect
          ref={shapeRef as React.RefObject<Konva.Rect>}
          {...commonProps}
          width={layer.width}
          height={layer.height}
        />
      );
  }
};

export default ShapeLayerComponent;
