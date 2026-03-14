// Sync with worker/src/types.ts

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
  timePerTurn: number;
  rounds: number;
  maxPlayers: number;
  hideActions: boolean;
  likesEnabled: boolean;
  autoPlayAnimation: boolean;
  squareCanvas: boolean;
  storyVoiceEnabled?: boolean;
  knockOffStartTime?: number;
  animationFramesPerPlayer?: number;
  animationPlaybackSpeed?: number;
  exquisiteParts?: number;
  missingPieceEraseCount?: number;
  soloFrames?: number;
  [key: string]: unknown;
}

export interface Player {
  id: string;
  nickname: string;
  color: string;
  connected: boolean;
  isHost?: boolean;
  currentAction?: "idle" | "drawing" | "writing" | "waiting";
}

export type WSMessage =
  | { type: "join"; playerId: string; nickname: string; color: string }
  | {
      type: "joined";
      roomCode: string;
      players: Player[];
      settings: RoomSettings;
      you: Player;
      gameStarted?: boolean;
      currentRound?: number;
      turnIndex?: number;
      chain?: ChainEntry[];
      gallery?: GalleryItem[];
    }
  | { type: "player_joined"; player: Player }
  | { type: "player_left"; playerId: string }
  | { type: "start_game"; settings: RoomSettings }
  | {
      type: "turn_start";
      turnIndex: number;
      playerId: string;
      prompt?: string;
      imageData?: string;
      timeLeft: number;
      round?: number;
    }
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
  | { type: "settings_updated"; settings: RoomSettings };

export interface ChainEntry {
  playerId: string;
  nickname: string;
  type: "text" | "drawing";
  content: string;
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

export const GAME_MODES: { id: GameModeId; name: string; description: string }[] = [
  { id: "normal", name: "Normal", description: "The basis of it all! Write and draw alternatively until you reach the last turn." },
  { id: "knockoff", name: "Knock-Off", description: "Keep yourself focused! Try to replicate the drawings while the clock gets faster." },
  { id: "animation", name: "Animation", description: "It's time to animate! Create new animations in a collaborative way." },
  { id: "icebreaker", name: "Icebreaker", description: "Play with just one sentence! Ask questions and have fun with others' drawings." },
  { id: "exquisite", name: "Exquisite Corpse", description: "Create surrealist characters connected by the top of the drawings." },
  { id: "complement", name: "Complement", description: "Complete the sketch! Start with basic line and see the other players' interpretation." },
  { id: "masterpiece", name: "Masterpiece", description: "Create a piece of art! Play in a single turn with no time limit." },
  { id: "story", name: "Story", description: "Write a narrative using only the previous sentence as a reference." },
  { id: "missingpiece", name: "Missing Piece", description: "Imagine you're putting up a puzzle that will always have a piece missing." },
  { id: "secret", name: "Secret", description: "All the actions are a mystery! Drawings and sentences are hidden during the game." },
  { id: "coop", name: "Co-op", description: "Create together! Starting from a sentence, add touch to your drawings!" },
  { id: "score", name: "Score", description: "Classic mode with a scoring system." },
  { id: "sandwich", name: "Sandwich", description: "Text → several drawing turns → text again." },
  { id: "background", name: "Background", description: "Background enhances the now-classic Animation mode." },
  { id: "solo", name: "Solo", description: "You are creating your very own animation." },
];
