/**
 * Простой Node.js сервер: статика + WebSocket комнаты.
 * Деплой на Railway / Render / любой Node-хостинг — один проект, один URL.
 */
import express from "express";
import { WebSocketServer } from "ws";
import { createServer } from "http";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

const app = express();
const server = createServer(app);

// Статика (собранный клиент)
const clientDist = join(__dirname, "..", "client", "dist");
app.use(express.static(clientDist));
app.get("*", (req, res) => {
  res.sendFile(join(clientDist, "index.html"));
});

// --- Комнаты в памяти (логика как в RoomDO) ---
const rooms = new Map();

const DEFAULT_SETTINGS = {
  mode: "normal",
  timePerTurn: 60,
  rounds: 3,
  maxPlayers: 8,
  hideActions: false,
  likesEnabled: true,
  autoPlayAnimation: true,
  squareCanvas: false,
  storyVoiceEnabled: true,
  knockOffStartTime: 90,
  animationFramesPerPlayer: 1,
  animationPlaybackSpeed: 1,
  exquisiteParts: 3,
  missingPieceEraseCount: 1,
  soloFrames: 10,
};

function getTotalTurns(settings, playerOrder) {
  const n = playerOrder.length;
  const r = settings.rounds;
  const mode = settings.mode;
  if (mode === "normal" || mode === "knockoff" || mode === "sandwich") return n * r;
  if (mode === "animation") return (settings.animationFramesPerPlayer ?? 1) * n * r;
  if (mode === "icebreaker") return n * r;
  if (mode === "exquisite") return (settings.exquisiteParts ?? 3) * r;
  if (mode === "complement") return n * r;
  if (mode === "masterpiece") return n;
  if (mode === "story") return n * r;
  if (mode === "missingpiece") return n * r;
  if (mode === "secret") return n * r;
  if (mode === "coop") return r;
  if (mode === "score") return n * r;
  if (mode === "background") return n * r * 2;
  if (mode === "solo") return settings.soloFrames ?? 10;
  return n * r;
}

function getTimeForTurn(settings, turnIndex, playerOrder) {
  const mode = settings.mode;
  if (mode === "knockoff") {
    const step = Math.floor(turnIndex / playerOrder.length);
    const times = [90, 70, 50, 30];
    return times[Math.min(step, times.length - 1)] ?? 30;
  }
  if (mode === "masterpiece") return 99999;
  return settings.timePerTurn;
}

function getRoom(roomCode) {
  const code = roomCode.toUpperCase();
  if (!rooms.has(code)) {
    rooms.set(code, {
      roomCode: code,
      sessions: new Map(),
      players: new Map(),
      settings: { ...DEFAULT_SETTINGS },
      gameStarted: false,
      hostId: null,
      turnIndex: 0,
      currentRound: 0,
      chain: [],
      gallery: [],
      timerHandle: null,
      timeLeft: 0,
      playerOrder: [],
      modeState: {},
    });
  }
  return rooms.get(code);
}

function send(ws, msg) {
  try {
    if (ws.readyState === 1) ws.send(JSON.stringify(msg));
  } catch (_) {}
}

function broadcast(room, msg, excludePlayerId) {
  for (const [pid, session] of room.sessions) {
    if (pid !== excludePlayerId) send(session.ws, msg);
  }
}

function broadcastAll(room, msg) {
  for (const session of room.sessions.values()) send(session.ws, msg);
}

function clearTimer(room) {
  if (room.timerHandle) {
    clearTimeout(room.timerHandle);
    room.timerHandle = null;
  }
  if (room.modeState._timerInterval) {
    clearInterval(room.modeState._timerInterval);
    room.modeState._timerInterval = null;
  }
}

function startTurn(room) {
  const totalTurns = getTotalTurns(room.settings, room.playerOrder);
  if (room.turnIndex >= totalTurns) {
    finishRound(room);
    return;
  }
  const currentPlayerId = room.playerOrder[room.turnIndex % room.playerOrder.length];
  room.timeLeft = getTimeForTurn(room.settings, room.turnIndex, room.playerOrder);
  clearTimer(room);
  const player = room.players.get(currentPlayerId);
  if (!player) {
    room.turnIndex++;
    startTurn(room);
    return;
  }
  const prompt = room.chain.length ? (room.chain[room.chain.length - 1].type === "text" ? room.chain[room.chain.length - 1].content : undefined) : undefined;
  const imageData = room.chain.length ? (room.chain[room.chain.length - 1].type === "drawing" ? room.chain[room.chain.length - 1].content : undefined) : undefined;
  broadcastAll(room, {
    type: "turn_start",
    turnIndex: room.turnIndex,
    playerId: currentPlayerId,
    prompt,
    imageData,
    timeLeft: room.timeLeft,
    round: room.currentRound,
  });
  room.timerHandle = setTimeout(() => {
    room.timerHandle = null;
    broadcastAll(room, { type: "timer_tick", timeLeft: 0 });
    room.turnIndex++;
    startTurn(room);
  }, room.timeLeft * 1000);
  let left = room.timeLeft;
  room.modeState._timerInterval = setInterval(() => {
    left--;
    if (left <= 0) return;
    broadcastAll(room, { type: "timer_tick", timeLeft: left });
  }, 1000);
}

function finishRound(room) {
  room.gallery.push({ chain: [...room.chain] });
  room.chain = [];
  room.currentRound++;
  if (room.currentRound >= room.settings.rounds) {
    broadcastAll(room, { type: "game_chain", chain: room.chain });
    broadcastAll(room, { type: "game_gallery", items: room.gallery });
    room.gameStarted = false;
    return;
  }
  room.turnIndex = 0;
  startTurn(room);
}

function startGame(room) {
  room.gameStarted = true;
  room.currentRound = 0;
  room.turnIndex = 0;
  room.chain = [];
  room.gallery = [];
  room.playerOrder = Array.from(room.players.keys()).filter((id) => room.players.get(id)?.connected);
  room.modeState = {};
  broadcastAll(room, { type: "start_game", settings: room.settings });
  startTurn(room);
}

function onMessage(room, playerId, msg) {
  switch (msg.type) {
    case "start_game":
      if (room.players.get(playerId)?.isHost && !room.gameStarted) startGame(room);
      break;
    case "update_settings":
      if (room.players.get(playerId)?.isHost && msg.settings) {
        room.settings = { ...room.settings, ...msg.settings };
        broadcastAll(room, { type: "settings_updated", settings: room.settings });
      }
      break;
    case "submit_text": {
      const currentPlayerId = room.playerOrder[room.turnIndex % room.playerOrder.length];
      if (playerId !== currentPlayerId) return;
      const player = room.players.get(playerId);
      if (!player) return;
      room.chain.push({ playerId, nickname: player.nickname, type: "text", content: msg.text });
      clearTimer(room);
      if (room.settings.mode === "story" && room.settings.storyVoiceEnabled) {
        broadcastAll(room, { type: "story_chain", chain: [...room.chain] });
      }
      broadcastAll(room, { type: "turn_end", playerId });
      room.turnIndex++;
      startTurn(room);
      break;
    }
    case "submit_drawing": {
      const currentPlayerId = room.playerOrder[room.turnIndex % room.playerOrder.length];
      if (playerId !== currentPlayerId) return;
      const player = room.players.get(playerId);
      if (!player) return;
      room.chain.push({
        playerId,
        nickname: player.nickname,
        type: "drawing",
        content: msg.imageData,
        strokes: msg.strokes,
      });
      clearTimer(room);
      broadcastAll(room, { type: "turn_end", playerId });
      room.turnIndex++;
      startTurn(room);
      break;
    }
    case "like":
    case "chat":
      broadcastAll(room, msg);
      break;
    case "ping": {
      const session = room.sessions.get(playerId);
      if (session) send(session.ws, { type: "pong" });
      break;
    }
    default:
      break;
  }
}

// WebSocket сервер
const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (request, socket, head) => {
  const url = new URL(request.url || "", `http://${request.headers.host}`);
  const path = url.pathname;
  const match = path.match(/^\/room\/([A-Z0-9]{5})$/i);
  if (!match) {
    socket.destroy();
    return;
  }
  const roomCode = match[1].toUpperCase();
  wss.handleUpgrade(request, socket, head, (ws) => {
    const params = url.searchParams;
    const playerId = params.get("playerId") || crypto.randomUUID();
    const nickname = params.get("nickname") || "Player";
    const color = params.get("color") || "#C026D3";

    const room = getRoom(roomCode);

    const player = {
      id: playerId,
      nickname,
      color: color.startsWith("#") ? color : "#" + color,
      connected: true,
      isHost: !room.hostId,
      currentAction: "idle",
    };
    if (!room.hostId) room.hostId = playerId;
    room.players.set(playerId, player);
    room.sessions.set(playerId, { playerId, ws, nickname, color: player.color });

    broadcast(room, { type: "player_joined", player }, playerId);
    send(ws, {
      type: "joined",
      roomCode: room.roomCode,
      players: Array.from(room.players.values()),
      settings: room.settings,
      you: player,
      gameStarted: room.gameStarted,
      currentRound: room.currentRound,
      turnIndex: room.turnIndex,
      chain: room.chain,
      gallery: room.gallery,
    });

    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());
        onMessage(room, playerId, msg);
      } catch (_) {}
    });
    ws.on("close", () => {
      room.sessions.delete(playerId);
      const p = room.players.get(playerId);
      if (p) {
        p.connected = false;
        broadcast(room, { type: "player_left", playerId });
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`Телефончик: http://localhost:${PORT}`);
});
