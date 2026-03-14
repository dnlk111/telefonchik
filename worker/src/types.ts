// Shared types for Worker + Client (keep in sync with client/src/types/game.ts where needed)

export type GameModeId =
  | "normal"
  | "knockoff"
  | "animation"
  | "icebreaker"
  | "exquisite"
  | "complement"
  | "masterpiece"
  | "story"
  | "missingpiece"
  | "secret"
  | "coop"
  | "score"
  | "sandwich"
  | "background"
  | "solo";

export interface RoomSettings {
  mode: GameModeId;
  timePerTurn: number; // 30-180 sec
  rounds: number; // 1-10
  maxPlayers: number;
  hideActions: boolean;
  likesEnabled: boolean;
  autoPlayAnimation: boolean;
  squareCanvas: boolean;
  storyVoiceEnabled?: boolean;
  // Mode-specific
  knockOffStartTime?: number;
  animationFramesPerPlayer?: number;
  animationPlaybackSpeed?: number;
  exquisiteParts?: number; // 3 or 4
  missingPieceEraseCount?: number;
  soloFrames?: number;
  [key: string]: unknown;
}

export interface Player {
  id: string;
  nickname: string;
  color: string; // hex
  connected: boolean;
  isHost?: boolean;
  currentAction?: "idle" | "drawing" | "writing" | "waiting";
}

export type WSMessage =
  | { type: "join"; playerId: string; nickname: string; color: string }
  | { type: "joined"; roomCode: string; players: Player[]; settings: RoomSettings; you: Player }
  | { type: "player_joined"; player: Player }
  | { type: "player_left"; playerId: string }
  | { type: "start_game"; settings: RoomSettings }
  | { type: "turn_start"; turnIndex: number; playerId: string; prompt?: string; imageData?: string; timeLeft: number }
  | { type: "submit_text"; playerId: string; text: string }
  | { type: "submit_drawing"; playerId: string; imageData: string; strokes?: unknown[] }
  | { type: "turn_end"; playerId: string }
  | { type: "timer_tick"; timeLeft: number }
  | { type: "game_chain"; chain: ChainEntry[] }
  | { type: "story_chain"; chain: ChainEntry[] }
  | { type: "game_gallery"; items: GalleryItem[] }
  | { type: "like"; targetPlayerId: string; fromPlayerId: string }
  | { type: "chat"; playerId: string; text: string }
  | { type: "error"; message: string }
  | { type: "ping" }
  | { type: "pong" }
  | { type: "update_settings"; settings: Partial<RoomSettings> };

export interface ChainEntry {
  playerId: string;
  nickname: string;
  type: "text" | "drawing";
  content: string; // text or base64 image
  strokes?: unknown[];
}

export interface GalleryItem {
  round?: number;
  chain?: ChainEntry[];
  question?: string;
  drawings?: { playerId: string; nickname: string; imageData: string }[];
  animationFrames?: string[];
  playbackSpeed?: number;
}
