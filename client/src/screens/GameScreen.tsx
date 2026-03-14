import { useState, useRef, useCallback, useEffect } from "react";
import { useRoomWs } from "../hooks/useRoomWs";
import { DrawingCanvas, type Stroke } from "../components/DrawingCanvas";
import { DrawingToolbar } from "../components/DrawingToolbar";
import { IconLogo, IconCopy, IconTimer, IconDone, IconLeave } from "../components/Icons";
import type { UserState } from "../App";
import type { LobbyState } from "./LobbyScreen";

const CANVAS_W = 800;
const CANVAS_H = 450;

interface GameScreenProps {
  user: UserState;
  ws: WebSocket;
  initialState: LobbyState | null;
  onGallery: (items: unknown[]) => void;
  onLeave: () => void;
}

export function GameScreen({ user, ws, initialState, onGallery, onLeave }: GameScreenProps) {
  const { players, settings, turn, send, isMyTurn, gallery, chain } = useRoomWs(ws, user.playerId);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const prevChainLengthRef = useRef(0);
  const [color, setColor] = useState("#C026D3");
  const [strokeWidth, setStrokeWidth] = useState(8);
  const [tool, setTool] = useState<"brush" | "eraser">("brush");
  const [textInput, setTextInput] = useState("");
  const canvasRef = useRef<{ getDataURL: () => string } | null>(null);
  const drawingPresets: string[] = [
    "#000000",
    "#C026D3",
    "#FF00AA",
    "#00FFAA",
    "#FFFFFF",
  ];

  const needsDrawing =
    turn &&
    isMyTurn &&
    (turn.prompt !== undefined ||
      settings?.mode === "knockoff" ||
      settings?.mode === "animation" ||
      settings?.mode === "complement" ||
      settings?.mode === "masterpiece" ||
      settings?.mode === "exquisite" ||
      settings?.mode === "coop" ||
      settings?.mode === "sandwich" ||
      settings?.mode === "background" ||
      settings?.mode === "solo");
  const needsText =
    turn &&
    isMyTurn &&
    (settings?.mode === "story" ||
      turn.imageData !== undefined ||
      (settings?.mode === "normal" && turn.turnIndex === 0));

  useEffect(() => {
    if (gallery && gallery.length > 0) onGallery(gallery);
  }, [gallery, onGallery]);

  useEffect(() => {
    if (settings?.mode !== "story" || !settings?.storyVoiceEnabled || !chain?.length) return;
    if (chain.length <= prevChainLengthRef.current) return;
    prevChainLengthRef.current = chain.length;
    const text = (chain as { type: string; content: string }[])
      .filter((e) => e.type === "text")
      .map((e) => e.content)
      .join(" ");
    if (!text) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ru-RU";
    speechSynthesis.speak(u);
  }, [chain, settings?.mode, settings?.storyVoiceEnabled]);

  const handleDoneDrawing = useCallback(() => {
    const dataUrl = canvasRef.current?.getDataURL?.();
    if (dataUrl) send({ type: "submit_drawing", playerId: user.playerId, imageData: dataUrl, strokes });
    setStrokes([]);
  }, [send, user.playerId, strokes]);

  const handleDoneText = useCallback(() => {
    if (textInput.trim()) send({ type: "submit_text", playerId: user.playerId, text: textInput.trim() });
    setTextInput("");
  }, [send, user.playerId, textInput]);

  const square = settings?.squareCanvas ?? false;
  const w = square ? Math.min(CANVAS_W, CANVAS_H) : CANVAS_W;
  const h = square ? Math.min(CANVAS_W, CANVAS_H) : CANVAS_H;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <IconLogo size={28} className="drop-shadow-[0_0_6px_rgba(192,38,211,0.5)]" />
          <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-purple to-neon-pink">
            ТЕЛЕФОНЧИК
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-3xl md:text-4xl font-bold tracking-widest text-white">
            {initialState?.roomCode ?? ""}
          </span>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(initialState?.roomCode ?? "")}
            className="px-2 py-1 rounded-btn bg-white/10 text-sm flex items-center gap-1"
          >
            <IconCopy size={16} />
            Копировать
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white/80">{user.nickname}</span>
          <div
            className="w-8 h-8 rounded-full border-2 border-white/20"
            style={{ backgroundColor: user.color }}
          />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-16 md:w-52 border-r border-white/10 overflow-y-auto flex flex-col items-center py-3 gap-2">
          {players.map((p) => (
            <div key={p.id} className="flex flex-col items-center gap-1">
              <div
                className="w-10 h-10 rounded-full flex-shrink-0"
                style={{ backgroundColor: p.color }}
              />
              <span className="text-xs text-white/80 truncate max-w-[120px]">{p.nickname}</span>
              {turn?.playerId === p.id && (
                <span className="text-xs text-neon-green">ходит</span>
              )}
            </div>
          ))}
        </aside>

        <main className="flex-1 flex flex-col md:flex-row gap-4 p-4 overflow-auto">
          <div className="flex flex-col md:flex-row gap-4 flex-1 min-w-0">
            {(needsDrawing || (turn && turn.imageData)) && (
              <>
                <DrawingToolbar
                  color={color}
                  strokeWidth={strokeWidth}
                  tool={tool}
                  onColorChange={setColor}
                  onStrokeWidthChange={setStrokeWidth}
                  onToolChange={setTool}
                  onUndo={() => setStrokes((s) => s.slice(0, -1))}
                  onClear={() => setStrokes([])}
                  canUndo={strokes.length > 0}
                  canClear={strokes.length > 0}
                  drawingPresets={drawingPresets}
                />
                <div className="flex-1 min-w-0 flex flex-col items-center">
                  {turn?.prompt && (
                    <p className="text-white/90 text-lg mb-2 p-2 rounded-lg bg-white/5">
                      {turn.prompt}
                    </p>
                  )}
                  {turn?.imageData && !isMyTurn && (
                    <img
                      src={turn.imageData}
                      alt="Предыдущий рисунок"
                      className="max-w-full rounded-xl border border-white/10 mb-2"
                      style={{ maxHeight: h }}
                    />
                  )}
                  {needsDrawing && (
                    <DrawingCanvas
                      width={w}
                      height={h}
                      strokes={strokes}
                      onChangeStrokes={setStrokes}
                      color={color}
                      strokeWidth={strokeWidth}
                      tool={tool}
                      drawingPresets={drawingPresets}
                      disabled={!isMyTurn}
                      canvasRef={canvasRef}
                    />
                  )}
                </div>
              </>
            )}
            {needsText && (
              <div className="flex-1 flex flex-col items-center justify-center p-4">
                {turn?.prompt && (
                  <p className="text-white/90 text-lg mb-4 p-3 rounded-lg bg-white/5">
                    Предыдущее: {turn.prompt}
                  </p>
                )}
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Напиши предложение..."
                  className="w-full max-w-md min-h-[120px] px-4 py-3 rounded-btn bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-neon-purple resize-none"
                  maxLength={200}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      <footer className="p-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <IconTimer size={28} className="text-neon-green" />
          <span className="text-2xl font-bold text-neon-green tabular-nums">
            {turn?.timeLeft ?? 0}
          </span>
          <span className="text-white/60">сек</span>
        </div>
        <div className="flex gap-3">
          {needsDrawing && (
            <button
              type="button"
              onClick={handleDoneDrawing}
              className="px-6 py-3 rounded-btn bg-neon-green text-black font-bold btn-press btn-glow flex items-center gap-2"
            >
              <IconDone size={22} />
              ГОТОВО
            </button>
          )}
          {needsText && (
            <button
              type="button"
              onClick={handleDoneText}
              disabled={!textInput.trim()}
              className="px-6 py-3 rounded-btn bg-neon-green text-black font-bold btn-press disabled:opacity-50 flex items-center gap-2"
            >
              <IconDone size={22} />
              ГОТОВО
            </button>
          )}
          <button
            type="button"
            onClick={onLeave}
            className="px-4 py-2 rounded-btn bg-white/10 text-white/80 hover:bg-white/20 flex items-center gap-2"
          >
            <IconLeave size={18} />
            Выйти
          </button>
        </div>
      </footer>
    </div>
  );
}
