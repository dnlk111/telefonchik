import { useEffect, useState, useCallback } from "react";
import type { WSMessage, Player, RoomSettings } from "../types/game";

export interface TurnState {
  turnIndex: number;
  playerId: string;
  prompt?: string;
  imageData?: string;
  timeLeft: number;
  round?: number;
}

export function useRoomWs(ws: WebSocket | null, myPlayerId: string) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [settings, setSettings] = useState<RoomSettings | null>(null);
  const [turn, setTurn] = useState<TurnState | null>(null);
  const [chain, setChain] = useState<unknown[]>([]);
  const [gallery, setGallery] = useState<unknown[]>([]);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(
    (msg: object) => {
      if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
    },
    [ws]
  );

  useEffect(() => {
    if (!ws) return;
    const onMessage = (ev: MessageEvent) => {
      const msg = JSON.parse(ev.data) as WSMessage;
      switch (msg.type) {
        case "joined":
          setPlayers(msg.players);
          setSettings(msg.settings);
          if (msg.chain) setChain(msg.chain);
          if (msg.gallery) setGallery(msg.gallery);
          break;
        case "player_joined":
          setPlayers((prev) => {
            const has = prev.some((p) => p.id === msg.player.id);
            if (has) return prev.map((p) => (p.id === msg.player.id ? msg.player : p));
            return [...prev, msg.player];
          });
          break;
        case "player_left":
          setPlayers((prev) => prev.filter((p) => p.id !== msg.playerId));
          break;
        case "start_game":
          setSettings(msg.settings);
          break;
        case "turn_start":
          setTurn({
            turnIndex: msg.turnIndex,
            playerId: msg.playerId,
            prompt: msg.prompt,
            imageData: msg.imageData,
            timeLeft: msg.timeLeft,
            round: msg.round,
          });
          break;
        case "turn_end":
          setTurn((t) => (t?.playerId === msg.playerId ? null : t));
          break;
        case "timer_tick":
          setTurn((t) => (t ? { ...t, timeLeft: msg.timeLeft } : null));
          break;
        case "game_chain":
          setChain(msg.chain);
          break;
        case "story_chain":
          setChain(msg.chain);
          break;
        case "game_gallery":
          setGallery(msg.items);
          setTurn(null);
          break;
        case "settings_updated":
          setSettings(msg.settings);
          break;
        case "error":
          setError(msg.message);
          break;
        default:
          break;
      }
    };
    ws.addEventListener("message", onMessage);
    ws.addEventListener("close", () => setError("Соединение закрыто"));
    return () => {
      ws.removeEventListener("message", onMessage);
    };
  }, [ws]);

  return {
    players,
    settings,
    turn,
    chain,
    gallery,
    error,
    send,
    isMyTurn: turn?.playerId === myPlayerId,
  };
}
