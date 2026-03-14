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
  const wsState = useRoomWs(ws, user.playerId);
  const players = wsState.players.length > 0 ? wsState.players : (initialState?.players ?? []);
  const settings = wsState.settings ?? initialState?.settings ?? null;
  const { turn, send, isMyTurn, gallery, chain } = wsState;
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

  const drawOnlyModes = ["knockoff", "animation", "complement", "masterpiece", "exquisite", "coop", "sandwich", "background", "solo"];
  const needsDrawing =
    turn &&
    isMyTurn &&
    (turn.prompt !== undefined ||
      (settings?.mode === "normal" && turn.turnIndex % 2 === 1) ||
      (settings?.mode && drawOnlyModes.includes(settings.mode)));
  const needsText =
    turn &&
    isMyTurn &&
    (settings?.mode === "story" ||
      turn.imageData !== undefined ||
      (settings?.mode === "normal" && turn.turnIndex % 2 === 0) ||
      (turn.turnIndex === 0 && turn.prompt === undefined && turn.imageData === undefined));

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
  const [canvasSize, setCanvasSize] = useState({ w: CANVAS_W, h: CANVAS_H });
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const maxW = Math.min(rect.width || CANVAS_W, CANVAS_W);
      const maxH = Math.min(rect.height || CANVAS_H, CANVAS_H);
      if (square) {
        const s = Math.min(maxW, maxH, CANVAS_W, CANVAS_H);
        setCanvasSize({ w: s, h: s });
      } else {
        const ratio = CANVAS_W / CANVAS_H;
        let w = maxW,
          h = maxW / ratio;
        if (h > maxH) {
          h = maxH;
          w = maxH * ratio;
        }
        setCanvasSize({ w: Math.max(200, w), h: Math.max(150, h) });
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [square, needsDrawing]);
  const w = canvasSize.w;
  const h = canvasSize.h;

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

        <main className="flex-1 flex flex-col md:flex-row gap-4 p-4 overflow-auto min-h-0">
          <div className="flex flex-col md:flex-row gap-4 flex-1 min-w-0">
            {!turn && (
              <div className="flex-1 flex items-center justify-center text-white/60">
                <p>Ожидание начала хода...</p>
              </div>
            )}
            {turn && !needsDrawing && !needsText && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-6">
                <p className="text-white/80 text-lg">
                  Сейчас ходит{" "}
                  <span className="text-neon-purple font-bold">
                    {players.find((x) => x.id === turn.playerId)?.nickname ?? "игрок"}
                  </span>
                </p>
                {turn.prompt && (
                  <p className="text-white/60 max-w-md">Задание: {turn.prompt}</p>
                )}
                <p className="text-white/40 text-sm">Ждите или следите за таймером</p>
              </div>
            )}
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
                <div ref={containerRef} className="flex-1 min-w-0 flex flex-col items-center min-h-[200px] w-full">
                  {turn?.prompt && (
                    <p className="text-white/90 text-lg mb-2 p-2 rounded-lg bg-white/5 w-full max-w-2xl">
                      Нарисуй: {turn.prompt}
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
              <div className="flex-1 flex flex-col items-center justify-center p-4 w-full max-w-2xl">
                {turn?.prompt && (
                  <p className="text-white/90 text-lg mb-2 p-3 rounded-lg bg-white/5 w-full">
                    Предыдущее: {turn.prompt}
                  </p>
                )}
                {turn?.imageData && (
                  <>
                    <p className="text-white/80 text-sm mb-2">Опиши этот рисунок словами:</p>
                    <img
                      src={turn.imageData}
                      alt="Рисунок"
                      className="max-w-full rounded-xl border border-white/10 mb-4 max-h-64 object-contain"
                    />
                  </>
                )}
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={turn?.imageData ? "Опиши рисунок..." : "Напиши предложение (первый ход)..."}
                  className="w-full min-h-[120px] px-4 py-3 rounded-btn bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-neon-purple resize-none"
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
