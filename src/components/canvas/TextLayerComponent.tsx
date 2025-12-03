import { useRef, useEffect, useState, useCallback } from 'react';
import { Text } from 'react-konva';
import type Konva from 'konva';
import type { TextLayer } from '../../types';
import { useCanvasStore } from '../../store/canvasStore';

interface TextLayerComponentProps {
  layer: TextLayer;
  isSelected: boolean;
  isDraggable: boolean;
  onClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd: (e: Konva.KonvaEventObject<Event>) => void;
}

export const TextLayerComponent: React.FC<TextLayerComponentProps> = ({
  layer,
  isSelected: _isSelected,
  isDraggable,
  onClick,
  onDragEnd,
  onTransformEnd,
}) => {
  const textRef = useRef<Konva.Text>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { updateLayer, saveToHistory } = useCanvasStore();

  const handleDblClick = useCallback(() => {
    if (layer.locked) return;
    setIsEditing(true);
    const textNode = textRef.current;
    if (!textNode) return;
    const stage = textNode.getStage();
    if (!stage) return;

    const container = stage.container();
    const textPosition = textNode.getAbsolutePosition();
    const stageBox = container.getBoundingClientRect();
    const scale = stage.scaleX();

    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);

    const areaPosition = {
      x: stageBox.left + textPosition.x * scale,
      y: stageBox.top + textPosition.y * scale,
    };

    textarea.value = layer.text;
    textarea.style.position = 'absolute';
    textarea.style.left = `${areaPosition.x}px`;
    textarea.style.top = `${areaPosition.y}px`;
    textarea.style.width = `${layer.width * scale}px`;
    textarea.style.height = `${layer.height * scale + 20}px`;
    textarea.style.fontSize = `${layer.fontSize * scale}px`;
    textarea.style.fontFamily = layer.fontFamily;
    textarea.style.fontWeight = layer.fontWeight;
    textarea.style.fontStyle = layer.fontStyle;
    textarea.style.color = layer.fill;
    textarea.style.background = 'rgba(255, 255, 255, 0.95)';
    textarea.style.border = '2px solid #e94560';
    textarea.style.borderRadius = '4px';
    textarea.style.padding = '8px';
    textarea.style.margin = '0';
    textarea.style.overflow = 'hidden';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.lineHeight = String(layer.lineHeight);
    textarea.style.textAlign = layer.align;
    textarea.style.transformOrigin = 'left top';
    textarea.style.zIndex = '9999';
    textarea.focus();

    const removeTextarea = () => {
      textarea.remove();
      setIsEditing(false);
    };

    const handleOutsideClick = (e: MouseEvent) => {
      if (e.target !== textarea) {
        const newText = textarea.value;
        if (newText !== layer.text) {
          updateLayer(layer.id, { text: newText });
          saveToHistory('編輯文字');
        }
        removeTextarea();
        document.removeEventListener('click', handleOutsideClick);
      }
    };

    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        removeTextarea();
        document.removeEventListener('click', handleOutsideClick);
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        const newText = textarea.value;
        if (newText !== layer.text) {
          updateLayer(layer.id, { text: newText });
          saveToHistory('編輯文字');
        }
        removeTextarea();
        document.removeEventListener('click', handleOutsideClick);
      }
    });

    setTimeout(() => document.addEventListener('click', handleOutsideClick), 100);
  }, [layer, updateLayer, saveToHistory]);

  useEffect(() => {
    if (textRef.current) {
      const textHeight = textRef.current.height();
      if (textHeight !== layer.height) {
        updateLayer(layer.id, { height: textHeight });
      }
    }
  }, [layer.text, layer.fontSize, layer.fontFamily, layer.lineHeight]);

  return (
    <Text
      ref={textRef}
      id={layer.id}
      text={layer.text}
      x={layer.x}
      y={layer.y}
      rotation={layer.rotation}
      opacity={layer.opacity}
      fontFamily={layer.fontFamily}
      fontSize={layer.fontSize}
      fontStyle={`${layer.fontWeight} ${layer.fontStyle}`}
      fill={layer.fill}
      width={layer.width}
      align={layer.align}
      lineHeight={layer.lineHeight}
      visible={!isEditing}
      draggable={isDraggable && !isEditing}
      onClick={onClick}
      onDblClick={handleDblClick}
      onDragEnd={onDragEnd}
      onTransformEnd={onTransformEnd}
    />
  );
};
