import { IconBrush, IconEraser, IconUndo, IconClear } from "./Icons";

const COLORS = [
  "#000000", "#FFFFFF", "#C026D3", "#FF00AA", "#00FFAA", "#FFAA00", "#00AAFF",
  "#AA00FF", "#FF4444", "#44FF44", "#4444FF",
];

interface DrawingToolbarProps {
  color: string;
  strokeWidth: number;
  tool: "brush" | "eraser";
  onColorChange: (c: string) => void;
  onStrokeWidthChange: (w: number) => void;
  onToolChange: (t: "brush" | "eraser") => void;
  onUndo: () => void;
  onClear: () => void;
  canUndo: boolean;
  canClear: boolean;
  drawingPresets?: string[];
}

export function DrawingToolbar({
  color,
  strokeWidth,
  tool,
  onColorChange,
  onStrokeWidthChange,
  onToolChange,
  onUndo,
  onClear,
  canUndo,
  canClear,
  drawingPresets = [],
}: DrawingToolbarProps) {
  const presets = drawingPresets.length >= 5 ? drawingPresets.slice(0, 5) : COLORS.slice(0, 5);
  return (
    <div className="flex flex-col gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => onToolChange("brush")}
          className={`px-3 py-2 rounded-btn text-sm font-medium transition-all btn-press flex items-center gap-2 ${tool === "brush" ? "bg-neon-purple text-white" : "bg-white/10 text-white/80"}`}
        >
          <IconBrush size={18} />
          Кисть
        </button>
        <button
          type="button"
          onClick={() => onToolChange("eraser")}
          className={`px-3 py-2 rounded-btn text-sm font-medium transition-all btn-press flex items-center gap-2 ${tool === "eraser" ? "bg-neon-purple text-white" : "bg-white/10 text-white/80"}`}
        >
          <IconEraser size={18} />
          Ластик
        </button>
      </div>
      <div>
        <p className="text-white/70 text-xs mb-1">Цвет (presets с прошлого хода)</p>
        <div className="flex gap-2 flex-wrap">
          {presets.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onColorChange(c)}
              className="w-8 h-8 rounded-full border-2 transition-all btn-press"
              style={{
                backgroundColor: c,
                borderColor: color === c ? "#fff" : "transparent",
                boxShadow: color === c ? "0 0 10px " + c : "none",
              }}
            />
          ))}
        </div>
        <p className="text-white/70 text-xs mt-2 mb-1">Все цвета</p>
        <div className="flex gap-1 flex-wrap">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onColorChange(c)}
              className="w-6 h-6 rounded border border-white/20"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <div>
        <label className="text-white/70 text-xs">Толщина: {strokeWidth}</label>
        <input
          type="range"
          min={2}
          max={30}
          value={strokeWidth}
          onChange={(e) => onStrokeWidthChange(+e.target.value)}
          className="w-full accent-neon-purple"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="px-3 py-2 rounded-btn bg-white/10 text-white/80 text-sm disabled:opacity-50 btn-press flex items-center gap-2"
        >
          <IconUndo size={16} />
          Отмена
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={!canClear}
          className="px-3 py-2 rounded-btn bg-white/10 text-red-400/80 text-sm disabled:opacity-50 btn-press flex items-center gap-2"
        >
          <IconClear size={16} />
          Очистить
        </button>
      </div>
    </div>
  );
}
