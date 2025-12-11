import { useRef, useEffect, useState } from 'react';
import { Image } from 'react-konva';
import type Konva from 'konva';
import type { VideoLayer } from '../../types';

interface VideoLayerComponentProps {
  layer: VideoLayer;
  isDraggable: boolean;
  isSelected?: boolean;
  onClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd: (e: Konva.KonvaEventObject<Event>) => void;
  onContextMenu?: (e: Konva.KonvaEventObject<PointerEvent>) => void;
  onVideoTimeUpdate?: (currentTime: number) => void;
}

export const VideoLayerComponent: React.FC<VideoLayerComponentProps> = ({
  layer,
  isDraggable,
  onClick,
  onDragEnd,
  onTransformEnd,
  onContextMenu,
  onVideoTimeUpdate,
}) => {
  const imageRef = useRef<Konva.Image>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const [videoReady, setVideoReady] = useState(false);

  // 初始化影片元素
  useEffect(() => {
    const video = document.createElement('video');
    video.src = layer.src;
    video.crossOrigin = 'anonymous';
    video.muted = layer.muted;
    video.volume = layer.volume;
    video.loop = layer.loop;
    video.playbackRate = layer.playbackRate;
    video.playsInline = true;

    video.onloadeddata = () => {
      setVideoReady(true);
      if (imageRef.current) {
        imageRef.current.image(video);
        imageRef.current.getLayer()?.batchDraw();
      }
    };

    videoRef.current = video;

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      video.pause();
      video.src = '';
      videoRef.current = null;
    };
  }, [layer.src]);

  // 處理播放/暫停狀態
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoReady) return;

    if (layer.isPlaying) {
      video.play().catch(console.error);
      // 開始動畫更新
      const animate = () => {
        if (imageRef.current) {
          imageRef.current.getLayer()?.batchDraw();
        }
        if (video.currentTime !== undefined) {
          onVideoTimeUpdate?.(video.currentTime);
        }
        animationRef.current = requestAnimationFrame(animate);
      };
      animate();
    } else {
      video.pause();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [layer.isPlaying, videoReady, onVideoTimeUpdate]);

  // 同步音量、靜音等屬性
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = layer.muted;
    video.volume = layer.volume;
    video.loop = layer.loop;
    video.playbackRate = layer.playbackRate;
  }, [layer.muted, layer.volume, layer.loop, layer.playbackRate]);

  // 同步播放時間（當外部跳轉時）
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoReady) return;

    if (Math.abs(video.currentTime - layer.currentTime) > 0.5) {
      video.currentTime = layer.currentTime;
    }
  }, [layer.currentTime, videoReady]);

  if (!videoReady || !videoRef.current) {
    // 顯示縮圖作為佔位符
    return null;
  }

  return (
    <Image
      ref={imageRef}
      image={videoRef.current}
      id={layer.id}
      name="video-layer"
      x={layer.x}
      y={layer.y}
      width={layer.width}
      height={layer.height}
      rotation={layer.rotation}
      opacity={layer.opacity}
      draggable={isDraggable}
      onClick={onClick}
      onTap={onClick as unknown as (e: Konva.KonvaEventObject<TouchEvent>) => void}
      onDragEnd={onDragEnd}
      onTransformEnd={onTransformEnd}
      onContextMenu={onContextMenu}
    />
  );
};
