import { useEffect, useState, useRef } from "react";
import { getRoomWsUrl } from "../lib/ws";
import { GAME_MODES } from "../types/game";
import type { UserState } from "../App";
import type { Player, RoomSettings, WSMessage } from "../types/game";
import { AdvancedSettingsModal } from "../components/AdvancedSettingsModal";
import { IconLogo, IconCopy, IconUsers, IconSettings, IconPlay, IconBack } from "../components/Icons";

interface LobbyScreenProps {
  user: UserState;
  roomCode: string;
  onBack: () => void;
  onGameStart: (ws: WebSocket, state: LobbyState) => void;
}

export interface LobbyState {
  roomCode: string;
  players: Player[];
  settings: RoomSettings;
  you: Player;
  isHost: boolean;
}

export function LobbyScreen({ user, roomCode, onBack, onGameStart }: LobbyScreenProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [settings, setSettings] = useState<RoomSettings | null>(null);
  const [you, setYou] = useState<Player | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const stateRef = useRef<{ players: Player[]; you: Player | null }>({ players: [], you: null });
  stateRef.current = { players, you };

  useEffect(() => {
    const url = getRoomWsUrl(roomCode, user.playerId, user.nickname, user.color);
    const socket = new WebSocket(url);
    setWs(socket);

    socket.onmessage = (ev) => {
      const msg = JSON.parse(ev.data) as WSMessage;
      if (msg.type === "joined") {
        setPlayers(msg.players);
        setSettings(msg.settings);
        setYou(msg.you);
      } else if (msg.type === "player_joined") {
        setPlayers((prev) => {
          const has = prev.some((p) => p.id === msg.player.id);
          if (has) return prev.map((p) => (p.id === msg.player.id ? msg.player : p));
          return [...prev, msg.player];
        });
      } else if (msg.type === "player_left") {
        setPlayers((prev) => prev.filter((p) => p.id !== msg.playerId));
      } else if (msg.type === "start_game") {
        setSettings(msg.settings);
        const { players: p, you: u } = stateRef.current;
        onGameStart(socket, {
          roomCode,
          players: p,
          settings: msg.settings,
          you: u!,
          isHost: u?.isHost ?? false,
        });
      } else if (msg.type === "settings_updated") {
        setSettings(msg.settings);
      } else if (msg.type === "error") {
        setError(msg.message);
      }
    };

    socket.onerror = () => setError("Ошибка подключения");
    socket.onclose = () => {
      if (!socket.CLOSED) setError("Соединение закрыто");
    };

    return () => {
      if (socket.readyState === WebSocket.OPEN) socket.close();
    };
  }, [roomCode, user.playerId, user.nickname, user.color]);

  const updateSettings = (next: Partial<RoomSettings>) => {
    if (!ws || ws.readyState !== WebSocket.OPEN || !you?.isHost) return;
    const newSettings = { ...settings!, ...next } as RoomSettings;
    setSettings(newSettings);
    ws.send(JSON.stringify({ type: "update_settings", settings: next }));
  };

  const startGame = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN || !you?.isHost) return;
    ws.send(JSON.stringify({ type: "start_game" }));
  };

  const currentMode = GAME_MODES.find((m) => m.id === settings?.mode);

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-6">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <IconLogo size={32} className="drop-shadow-[0_0_8px_rgba(192,38,211,0.5)]" />
          <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-purple to-neon-pink">
            ТЕЛЕФОНЧИК
          </span>
        </div>
        <button onClick={onBack} className="text-white/80 hover:text-white text-sm flex items-center gap-1">
          <IconBack size={18} />
          Выйти
        </button>
      </header>

      <div className="flex flex-col md:flex-row gap-6 flex-1">
        <div className="flex-1">
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <p className="text-white/60 text-sm mb-2">Код комнаты</p>
            <div className="flex items-center gap-3">
              <span className="text-4xl md:text-5xl font-bold tracking-widest text-white">
                {roomCode}
              </span>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(roomCode)}
                className="px-3 py-2 rounded-btn bg-white/10 hover:bg-white/20 text-sm flex items-center gap-2"
              >
                <IconCopy size={18} />
                Копировать
              </button>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <IconUsers size={22} className="text-neon-purple" />
              Игроки ({players.length})
            </h2>
            <ul className="space-y-2">
              {players.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 py-2 px-3 rounded-btn bg-white/5"
                >
                  <div
                    className="w-8 h-8 rounded-full flex-shrink-0"
                    style={{ backgroundColor: p.color }}
                  />
                  <span className={p.connected ? "text-white" : "text-white/50"}>
                    {p.nickname}
                    {p.isHost && " (хост)"}
                  </span>
                  {!p.connected && <span className="text-white/40 text-sm">— вышел</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="w-full md:w-80 flex flex-col gap-4">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <h2 className="font-bold mb-2">Режим</h2>
            <p className="text-white/80 text-sm mb-2">{currentMode?.name ?? settings?.mode}</p>
            <p className="text-white/60 text-xs mb-3">{currentMode?.description}</p>
            {you?.isHost && (
              <>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(true)}
                  className="w-full py-2 rounded-btn bg-white/10 hover:bg-white/20 text-sm mb-2 flex items-center justify-center gap-2"
                >
                  <IconSettings size={18} />
                  Расширенные настройки
                </button>
                <select
                  value={settings?.mode ?? "normal"}
                  onChange={(e) => updateSettings({ mode: e.target.value as RoomSettings["mode"] })}
                  className="w-full px-3 py-2 rounded-btn bg-white/10 border border-white/20 text-white text-sm"
                >
                  {GAME_MODES.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {you?.isHost && (
            <button
              type="button"
              onClick={startGame}
              disabled={players.length < 2}
              className="w-full py-4 rounded-btn bg-neon-green text-black font-bold btn-press disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <IconPlay size={24} />
              Начать игру
            </button>
          )}
        </div>
      </div>

      {showAdvanced && settings && (
        <AdvancedSettingsModal
          settings={settings}
          onSave={(next) => {
            updateSettings(next);
            setShowAdvanced(false);
          }}
          onClose={() => setShowAdvanced(false)}
        />
      )}
    </div>
  );
}
