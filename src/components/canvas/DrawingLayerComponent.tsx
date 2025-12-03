import { Group, Line } from 'react-konva';
import type { DrawingLayer } from '../../types';

interface DrawingLayerComponentProps {
  layer: DrawingLayer;
  isSelected: boolean;
}

export const DrawingLayerComponent: React.FC<DrawingLayerComponentProps> = ({
  layer,
}) => {
  return (
    <Group id={layer.id} x={layer.x} y={layer.y} opacity={layer.opacity}>
      {layer.lines.map((line, index) => (
        <Line
          key={index}
          points={line.points}
          stroke={line.stroke}
          strokeWidth={line.strokeWidth}
          tension={line.tension}
          lineCap={line.lineCap}
          lineJoin={line.lineJoin}
        />
      ))}
    </Group>
  );
};
