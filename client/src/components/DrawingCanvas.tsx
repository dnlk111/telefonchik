import { useRef, useCallback, useEffect } from "react";
import { Stage, Layer, Line } from "react-konva";

export interface Stroke {
  points: number[];
  color: string;
  width: number;
  tool: "brush" | "eraser";
}

const PRESET_COLORS = ["#000000", "#C026D3", "#FF00AA", "#00FFAA", "#FFFFFF"];

interface DrawingCanvasProps {
  width: number;
  height: number;
  strokes: Stroke[];
  onChangeStrokes: (strokes: Stroke[]) => void;
  color: string;
  strokeWidth: number;
  tool: "brush" | "eraser";
  drawingPresets?: string[];
  disabled?: boolean;
  backgroundImage?: string;
  canvasRef?: React.MutableRefObject<{ getDataURL: () => string } | null>;
}

export function DrawingCanvas({
  width,
  height,
  strokes,
  onChangeStrokes,
  color,
  strokeWidth,
  tool,
  drawingPresets = PRESET_COLORS,
  disabled,
  canvasRef,
}: DrawingCanvasProps) {
  const stageRef = useRef<{ toDataURL?: (o?: object) => string } | null>(null);
  const isDrawing = useRef(false);
  const lastLine = useRef<number[]>([]);

  useEffect(() => {
    if (canvasRef) {
      canvasRef.current = {
        getDataURL: () => stageRef.current?.toDataURL?.({ pixelRatio: 2 }) ?? "",
      };
      return () => {
        canvasRef.current = null;
      };
    }
  }, [canvasRef]);

  const handleMouseDown = useCallback(
    (e: { target: { getStage: () => { getPointerPosition: () => { x: number; y: number } | null } | null } }) => {
      if (disabled) return;
      isDrawing.current = true;
      const pos = e.target.getStage()?.getPointerPosition();
      if (!pos) return;
      const newLine = [pos.x, pos.y];
      lastLine.current = newLine;
      const newStroke: Stroke = {
        points: [...newLine],
        color: tool === "eraser" ? "#1F1633" : color,
        width: tool === "eraser" ? strokeWidth * 3 : strokeWidth,
        tool,
      };
      onChangeStrokes([...strokes, newStroke]);
    },
    [disabled, color, strokeWidth, tool, strokes, onChangeStrokes]
  );

  const handleMouseMove = useCallback(
    (e: { target: { getStage: () => { getPointerPosition: () => { x: number; y: number } | null } | null } }) => {
      if (!isDrawing.current || disabled) return;
      const pos = e.target.getStage()?.getPointerPosition();
      if (!pos) return;
      lastLine.current = lastLine.current.concat([pos.x, pos.y]);
      const updated = [...strokes];
      const last = updated[updated.length - 1];
      if (last) last.points = [...lastLine.current];
      onChangeStrokes(updated);
    },
    [disabled, strokes, onChangeStrokes]
  );

  const handleMouseUp = useCallback(() => {
    isDrawing.current = false;
  }, []);

  const handleTouchStart = useCallback(
    (e: { evt: { preventDefault: () => void; touches: TouchList }; target: { getStage: () => { getPointerPosition: () => { x: number; y: number } | null } | null } }) => {
      e.evt.preventDefault();
      const touch = e.evt.touches[0];
      if (!touch || disabled) return;
      const stage = e.target.getStage();
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;
      isDrawing.current = true;
      lastLine.current = [pos.x, pos.y];
      const newStroke: Stroke = {
        points: [pos.x, pos.y],
        color: tool === "eraser" ? "#1F1633" : color,
        width: tool === "eraser" ? strokeWidth * 3 : strokeWidth,
        tool,
      };
      onChangeStrokes([...strokes, newStroke]);
    },
    [disabled, color, strokeWidth, tool, strokes, onChangeStrokes]
  );

  const handleTouchMove = useCallback(
    (e: { evt: { preventDefault: () => void; touches: TouchList }; target: { getStage: () => { getPointerPosition: () => { x: number; y: number } | null } | null } }) => {
      e.evt.preventDefault();
      if (!isDrawing.current || disabled) return;
      const touch = e.evt.touches[0];
      if (!touch) return;
      const stage = e.target.getStage();
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;
      lastLine.current = lastLine.current.concat([pos.x, pos.y]);
      const updated = [...strokes];
      const last = updated[updated.length - 1];
      if (last) last.points = [...lastLine.current];
      onChangeStrokes(updated);
    },
    [disabled, strokes, onChangeStrokes]
  );

  const handleTouchEnd = useCallback(() => {
    isDrawing.current = false;
  }, []);

  return (
    <div className="relative rounded-xl overflow-hidden bg-bg-start border border-white/10">
      <Stage
        ref={(ref) => {
          (stageRef as React.MutableRefObject<{ toDataURL?: (o?: object) => string } | null>).current = ref;
        }}
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: "none" }}
      >
        <Layer>
          {strokes.map((stroke, i) => (
            <Line
              key={i}
              points={stroke.points}
              stroke={stroke.color}
              strokeWidth={stroke.width}
              lineCap="round"
              lineJoin="round"
              listening={false}
            />
          ))}
        </Layer>
      </Stage>
      <div className="absolute bottom-2 left-2 flex gap-1">
        {drawingPresets.slice(0, 5).map((c) => (
          <div
            key={c}
            className="w-6 h-6 rounded-full border border-white/30"
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    </div>
  );
}
