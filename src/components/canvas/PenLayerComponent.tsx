import { Group, Line, Circle } from 'react-konva';
import type Konva from 'konva';
import type { PenLayer, PenPath } from '../../types';

interface PenLayerComponentProps {
  layer: PenLayer;
  isSelected: boolean;
  showControlPoints?: boolean;
  activePath?: number;
  onControlPointDrag?: (pathIndex: number, pointIndex: number, newPos: { x: number; y: number }) => void;
}

// 將貝茲曲線路徑轉換為 Konva Line 的點陣列
function penPathToPoints(path: PenPath): number[] {
  const points: number[] = [];

  if (path.points.length === 0) return points;

  // 添加第一個點
  points.push(path.points[0].x, path.points[0].y);

  // 添加後續的點（簡化版本 - 直接連接點）
  for (let i = 1; i < path.points.length; i++) {
    points.push(path.points[i].x, path.points[i].y);
  }

  return points;
}

export function PenLayerComponent({
  layer,
  isSelected,
  showControlPoints = false,
  activePath,
  onControlPointDrag,
}: PenLayerComponentProps) {
  return (
    <Group
      id={layer.id}
      x={layer.x}
      y={layer.y}
      opacity={layer.opacity}
      visible={layer.visible}
    >
      {layer.paths.map((path, pathIndex) => (
        <Group key={pathIndex}>
          {/* 繪製路徑線條 */}
          <Line
            points={penPathToPoints(path)}
            stroke={path.stroke}
            strokeWidth={path.strokeWidth}
            lineCap="round"
            lineJoin="round"
            tension={0.3}
            closed={path.closed}
            fill={path.fill}
          />

          {/* 顯示控制點（選中時） */}
          {showControlPoints && (isSelected || activePath === pathIndex) && path.points.map((point, pointIndex) => (
            <Group key={pointIndex}>
              {/* 主控制點 */}
              <Circle
                x={point.x}
                y={point.y}
                radius={6}
                fill="#ffffff"
                stroke="#3b82f6"
                strokeWidth={2}
                draggable
                onDragMove={(e: Konva.KonvaEventObject<DragEvent>) => {
                  onControlPointDrag?.(pathIndex, pointIndex, {
                    x: e.target.x(),
                    y: e.target.y(),
                  });
                }}
              />

              {/* 入控制柄 */}
              {point.handleIn && (
                <>
                  <Line
                    points={[point.x, point.y, point.handleIn.x, point.handleIn.y]}
                    stroke="#3b82f6"
                    strokeWidth={1}
                    dash={[4, 4]}
                  />
                  <Circle
                    x={point.handleIn.x}
                    y={point.handleIn.y}
                    radius={4}
                    fill="#3b82f6"
                    stroke="#ffffff"
                    strokeWidth={1}
                    draggable
                  />
                </>
              )}

              {/* 出控制柄 */}
              {point.handleOut && (
                <>
                  <Line
                    points={[point.x, point.y, point.handleOut.x, point.handleOut.y]}
                    stroke="#3b82f6"
                    strokeWidth={1}
                    dash={[4, 4]}
                  />
                  <Circle
                    x={point.handleOut.x}
                    y={point.handleOut.y}
                    radius={4}
                    fill="#3b82f6"
                    stroke="#ffffff"
                    strokeWidth={1}
                    draggable
                  />
                </>
              )}
            </Group>
          ))}
        </Group>
      ))}
    </Group>
  );
}
