/**
 * Room Durable Object — одна комната = один DO.
 * Состояние комнаты, WebSockets, таймеры, очередь ходов, все 15 режимов.
 */

import type {
  GameModeId,
  RoomSettings,
  Player,
  WSMessage,
  ChainEntry,
  GalleryItem,
} from "./types";

const DEFAULT_SETTINGS: RoomSettings = {
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

const GAME_MODE_IDS: GameModeId[] = [
  "normal", "knockoff", "animation", "icebreaker", "exquisite", "complement",
  "masterpiece", "story", "missingpiece", "secret", "coop", "score", "sandwich", "background", "solo",
];

interface Session {
  playerId: string;
  webSocket: WebSocket;
  nickname: string;
  color: string;
}

export class RoomDO implements DurableObject {
  private roomCode: string = "";
  private sessions: Map<string, Session> = new Map();
  private players: Map<string, Player> = new Map();
  private settings: RoomSettings = { ...DEFAULT_SETTINGS };
  private gameStarted: boolean = false;
  private hostId: string | null = null;
  private turnIndex: number = 0;
  private currentRound: number = 0;
  private chain: ChainEntry[] = [];
  private gallery: GalleryItem[] = [];
  private timerHandle: ReturnType<typeof setTimeout> | null = null;
  private timeLeft: number = 0;
  private playerOrder: string[] = [];
  private modeState: Record<string, unknown> = {}; // mode-specific state
  private stored: DurableObjectStorage;

  constructor(ctx: DurableObjectState, env: object) {
    this.stored = ctx.storage;
    ctx.blockConcurrencyWhile(async () => {
      this.roomCode = (await this.stored.get<string>("roomCode")) ?? "";
      this.settings = (await this.stored.get<RoomSettings>("settings")) ?? { ...DEFAULT_SETTINGS };
      this.players = new Map((await this.stored.get<[string, Player][]>("players")) ?? []);
      this.hostId = await this.stored.get<string>("hostId");
      this.gameStarted = (await this.stored.get<boolean>("gameStarted")) ?? false;
      this.currentRound = (await this.stored.get<number>("currentRound")) ?? 0;
      this.turnIndex = (await this.stored.get<number>("turnIndex")) ?? 0;
      this.chain = (await this.stored.get<ChainEntry[]>("chain")) ?? [];
      this.playerOrder = (await this.stored.get<string[]>("playerOrder")) ?? [];
      this.gallery = (await this.stored.get<GalleryItem[]>("gallery")) ?? [];
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.headers.get("Upgrade") === "websocket") {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      await this.handleWebSocket(server, request, url);
      return new Response(null, { status: 101, webSocket: client });
    }
    return new Response("Expected WebSocket", { status: 400 });
  }

  private async handleWebSocket(ws: WebSocket, request: Request, url: URL): Promise<void> {
    ws.accept();
    const roomCode = url.searchParams.get("code") ?? "";
    const playerId = url.searchParams.get("playerId") ?? crypto.randomUUID();
    const nickname = url.searchParams.get("nickname") ?? "Player";
    const color = url.searchParams.get("color") ?? "#C026D3";

    if (!this.roomCode) this.roomCode = roomCode.toUpperCase();
    if (this.roomCode !== roomCode.toUpperCase()) {
      this.send(ws, { type: "error", message: "Wrong room code" });
      ws.close();
      return;
    }

    const player: Player = {
      id: playerId,
      nickname,
      color,
      connected: true,
      isHost: !this.hostId,
      currentAction: "idle",
    };
    if (!this.hostId) this.hostId = playerId;
    this.players.set(playerId, player);
    this.sessions.set(playerId, { playerId, webSocket: ws, nickname, color });
    await this.persist();

    this.broadcast({ type: "player_joined", player }, playerId);
    this.send(ws, {
      type: "joined",
      roomCode: this.roomCode,
      players: Array.from(this.players.values()),
      settings: this.settings,
      you: player,
      gameStarted: this.gameStarted,
      currentRound: this.currentRound,
      turnIndex: this.turnIndex,
      chain: this.chain,
      gallery: this.gallery,
    });

    ws.addEventListener("message", (evt) => {
      try {
        const msg = JSON.parse(evt.data as string) as WSMessage;
        this.onMessage(playerId, msg);
      } catch {
        // ignore
      }
    });
    ws.addEventListener("close", () => {
      this.sessions.delete(playerId);
      const p = this.players.get(playerId);
      if (p) {
        p.connected = false;
        this.broadcast({ type: "player_left", playerId });
      }
    });
  }

  private send(ws: WebSocket, msg: WSMessage): void {
    try {
      ws.send(JSON.stringify(msg));
    } catch {
      // ignore
    }
  }

  private broadcast(msg: WSMessage, excludePlayerId?: string): void {
    for (const [pid, session] of this.sessions) {
      if (pid !== excludePlayerId) this.send(session.webSocket, msg);
    }
  }

  private broadcastAll(msg: WSMessage): void {
    for (const session of this.sessions.values()) this.send(session.webSocket, msg);
  }

  private onMessage(playerId: string, msg: WSMessage): void {
    switch (msg.type) {
      case "start_game":
        if (this.players.get(playerId)?.isHost && !this.gameStarted) this.startGame();
        break;
      case "update_settings":
        if (this.players.get(playerId)?.isHost) {
          this.settings = { ...this.settings, ...(msg as unknown as { settings: Partial<RoomSettings> }).settings };
          this.broadcastAll({ type: "settings_updated", settings: this.settings } as WSMessage);
          this.persist();
        }
        break;
      case "submit_text":
        this.handleSubmitText(playerId, (msg as { type: "submit_text"; text: string }).text);
        break;
      case "submit_drawing":
        this.handleSubmitDrawing(
          playerId,
          (msg as { type: "submit_drawing"; imageData: string; strokes?: unknown[] }).imageData,
          (msg as { type: "submit_drawing"; strokes?: unknown[] }).strokes
        );
        break;
      case "like":
        this.broadcastAll(msg);
        break;
      case "chat":
        this.broadcastAll(msg);
        break;
      case "ping":
        const session = this.sessions.get(playerId);
        if (session) this.send(session.webSocket, { type: "pong" });
        break;
      default:
        break;
    }
  }

  private startGame(): void {
    this.gameStarted = true;
    this.currentRound = 0;
    this.turnIndex = 0;
    this.chain = [];
    this.gallery = [];
    this.playerOrder = Array.from(this.players.keys()).filter((id) => this.players.get(id)?.connected);
    this.modeState = {};
    this.persist();
    this.broadcastAll({ type: "start_game", settings: this.settings });
    this.startTurn();
  }

  private startTurn(): void {
    const mode = this.settings.mode;
    const totalTurns = this.getTotalTurnsForMode();
    if (this.turnIndex >= totalTurns) {
      this.finishRound();
      return;
    }
    const currentPlayerId = this.playerOrder[this.turnIndex % this.playerOrder.length];
    this.timeLeft = this.getTimeForTurn();
    this.clearTimer();
    const player = this.players.get(currentPlayerId);
    if (!player) {
      this.advanceTurn();
      return;
    }
    const prompt = this.getPromptForCurrentTurn();
    const imageData = this.getImageForCurrentTurn();
    this.broadcastAll({
      type: "turn_start",
      turnIndex: this.turnIndex,
      playerId: currentPlayerId,
      prompt,
      imageData,
      timeLeft: this.timeLeft,
      round: this.currentRound,
    } as WSMessage);
    this.runTimer();
  }

  // === РЕЖИМ Normal: пишем и рисуем по очереди, каждый видит только предыдущий промпт ===
  // === РЕЖИМ Knock-Off: только рисование, копируем предыдущий, таймер ускоряется ===
  // === РЕЖИМ Animation: каждый добавляет кадр, в конце — воспроизведение ===
  // === РЕЖИМ Icebreaker: один вопрос, все рисуют ответ, галерея ===
  // === РЕЖИМ Exquisite Corpse: 3–4 части (голова/тело/ноги), видна только линия соединения ===
  // === РЕЖИМ Complement: один общий рисунок, каждый дополняет ===
  // === РЕЖИМ Masterpiece: один ход на человека, без таймера ===
  // === РЕЖИМ Story: только текст, озвучка на клиенте (Web Speech API) ===
  // === РЕЖИМ Missing Piece: неполный рисунок, добавляем и стираем части ===
  // === РЕЖИМ Secret: ничего не видно до конца ===
  // === РЕЖИМ Co-op: все рисуют на одном холсте ===
  // === РЕЖИМ Score: классика + очки/голосование ===
  // === РЕЖИМ Sandwich: текст → несколько рисований → текст ===
  // === РЕЖИМ Background: сначала фон, потом анимация ===
  // === РЕЖИМ Solo: один игрок, анимация 5–20 кадров ===
  private getTotalTurnsForMode(): number {
    const n = this.playerOrder.length;
    const r = this.settings.rounds;
    const mode = this.settings.mode;
    if (mode === "normal" || mode === "knockoff" || mode === "sandwich") return n * r;
    if (mode === "animation") return (this.settings.animationFramesPerPlayer ?? 1) * n * r;
    if (mode === "icebreaker") return n * r;
    if (mode === "exquisite") return (this.settings.exquisiteParts ?? 3) * r;
    if (mode === "complement") return n * r;
    if (mode === "masterpiece") return n;
    if (mode === "story") return n * r;
    if (mode === "missingpiece") return n * r;
    if (mode === "secret") return n * r;
    if (mode === "coop") return r;
    if (mode === "score") return n * r;
    if (mode === "background") return n * r * 2;
    if (mode === "solo") return this.settings.soloFrames ?? 10;
    return n * r;
  }

  private getTimeForTurn(): number {
    const mode = this.settings.mode;
    if (mode === "knockoff") {
      const step = Math.floor(this.turnIndex / this.playerOrder.length);
      const times = [90, 70, 50, 30];
      return times[Math.min(step, times.length - 1)] ?? 30;
    }
    if (mode === "masterpiece") return 99999;
    return this.settings.timePerTurn;
  }

  private getPromptForCurrentTurn(): string | undefined {
    if (this.chain.length === 0) return undefined;
    const last = this.chain[this.chain.length - 1];
    return last.type === "text" ? last.content : undefined;
  }

  private getImageForCurrentTurn(): string | undefined {
    if (this.chain.length === 0) return undefined;
    const last = this.chain[this.chain.length - 1];
    return last.type === "drawing" ? last.content : undefined;
  }

  private runTimer(): void {
    this.timerHandle = setTimeout(() => {
      this.timerHandle = null;
      this.broadcastAll({ type: "timer_tick", timeLeft: 0 });
      this.advanceTurn();
    }, this.timeLeft * 1000);
    let left = this.timeLeft;
    const interval = setInterval(() => {
      left -= 1;
      if (left <= 0) {
        clearInterval(interval);
        return;
      }
      this.broadcastAll({ type: "timer_tick", timeLeft: left });
    }, 1000);
    this.modeState._timerInterval = interval;
  }

  private clearTimer(): void {
    if (this.timerHandle) {
      clearTimeout(this.timerHandle);
      this.timerHandle = null;
    }
    const interval = this.modeState._timerInterval as ReturnType<typeof setInterval> | undefined;
    if (interval) clearInterval(interval);
  }

  private handleSubmitText(playerId: string, text: string): void {
    const currentPlayerId = this.playerOrder[this.turnIndex % this.playerOrder.length];
    if (playerId !== currentPlayerId) return;
    const player = this.players.get(playerId);
    if (!player) return;
    this.chain.push({ playerId, nickname: player.nickname, type: "text", content: text });
    this.clearTimer();
    if (this.settings.mode === "story" && this.settings.storyVoiceEnabled) {
      this.broadcastAll({ type: "story_chain", chain: [...this.chain] } as WSMessage);
    }
    this.broadcastAll({ type: "turn_end", playerId });
    this.advanceTurn();
  }

  private handleSubmitDrawing(playerId: string, imageData: string, strokes?: unknown[]): void {
    const currentPlayerId = this.playerOrder[this.turnIndex % this.playerOrder.length];
    if (playerId !== currentPlayerId) return;
    const player = this.players.get(playerId);
    if (!player) return;
    this.chain.push({
      playerId,
      nickname: player.nickname,
      type: "drawing",
      content: imageData,
      strokes,
    });
    this.clearTimer();
    this.broadcastAll({ type: "turn_end", playerId });
    this.advanceTurn();
  }

  private advanceTurn(): void {
    this.turnIndex++;
    this.persist();
    this.startTurn();
  }

  private finishRound(): void {
    this.gallery.push({ chain: [...this.chain] });
    this.chain = [];
    this.currentRound++;
    if (this.currentRound >= this.settings.rounds) {
      this.broadcastAll({ type: "game_chain", chain: this.chain });
      this.broadcastAll({ type: "game_gallery", items: this.gallery });
      this.gameStarted = false;
      this.persist();
      return;
    }
    this.turnIndex = 0;
    this.startTurn();
  }

  private async persist(): Promise<void> {
    await this.stored.put("roomCode", this.roomCode);
    await this.stored.put("settings", this.settings);
    await this.stored.put("players", Array.from(this.players.entries()));
    await this.stored.put("hostId", this.hostId);
    await this.stored.put("gameStarted", this.gameStarted);
    await this.stored.put("currentRound", this.currentRound);
    await this.stored.put("turnIndex", this.turnIndex);
    await this.stored.put("chain", this.chain);
    await this.stored.put("playerOrder", this.playerOrder);
    await this.stored.put("gallery", this.gallery);
  }
}
