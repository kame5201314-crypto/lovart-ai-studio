import { useRef } from 'react';
import { Image } from 'react-konva';
import useImage from 'use-image';
import type Konva from 'konva';
import type { ImageLayer } from '../../types';

interface ImageLayerComponentProps {
  layer: ImageLayer;
  isDraggable: boolean;
  onClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd: (e: Konva.KonvaEventObject<Event>) => void;
}

export const ImageLayerComponent: React.FC<ImageLayerComponentProps> = ({
  layer,
  isDraggable,
  onClick,
  onDragEnd,
  onTransformEnd,
}) => {
  // 對於 base64 圖片不需要 crossOrigin，對於 URL 圖片使用 anonymous
  const isBase64 = layer.src.startsWith('data:');
  const [image] = useImage(layer.src, isBase64 ? undefined : 'anonymous');
  const imageRef = useRef<Konva.Image>(null);

  if (!image) {
    return null;
  }

  return (
    <Image
      ref={imageRef}
      id={layer.id}
      image={image}
      x={layer.x}
      y={layer.y}
      width={layer.width}
      height={layer.height}
      rotation={layer.rotation}
      opacity={layer.opacity}
      draggable={isDraggable}
      onClick={onClick}
      onDragEnd={onDragEnd}
      onTransformEnd={onTransformEnd}
    />
  );
};
