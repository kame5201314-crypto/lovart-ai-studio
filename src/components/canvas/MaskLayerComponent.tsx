import { Group, Line, Rect } from 'react-konva';
import type { MaskLayer } from '../../types';

interface MaskLayerComponentProps {
  layer: MaskLayer;
  isSelected: boolean;
}

export const MaskLayerComponent: React.FC<MaskLayerComponentProps> = ({
  layer,
  isSelected,
}) => {
  const lines = layer.imageData ? JSON.parse(layer.imageData) : [];

  return (
    <Group id={layer.id} x={layer.x} y={layer.y} opacity={layer.opacity}>
      {isSelected && (
        <Rect
          width={layer.width}
          height={layer.height}
          fill="rgba(233, 69, 96, 0.1)"
          listening={false}
        />
      )}
      {lines.map((line: { points: number[]; strokeWidth: number }, index: number) => (
        <Line
          key={index}
          points={line.points}
          stroke="rgba(255, 255, 255, 0.8)"
          strokeWidth={line.strokeWidth}
          tension={0.5}
          lineCap="round"
          lineJoin="round"
        />
      ))}
    </Group>
  );
};
