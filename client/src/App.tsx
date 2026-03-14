import { useState } from "react";
import { NickScreen } from "./screens/NickScreen";
import { MenuScreen } from "./screens/MenuScreen";
import { LobbyScreen, type LobbyState } from "./screens/LobbyScreen";
import { GameScreen } from "./screens/GameScreen";
import { GalleryScreen } from "./screens/GalleryScreen";

export type AppScreen = "nick" | "menu" | "lobby" | "game" | "gallery";

export interface UserState {
  playerId: string;
  nickname: string;
  color: string;
}

const STORAGE_KEY = "telefonchik_user";

function loadUser(): UserState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as UserState;
      return {
        playerId: parsed.playerId ?? crypto.randomUUID(),
        nickname: parsed.nickname ?? "Player",
        color: parsed.color ?? "#C026D3",
      };
    }
  } catch {
    // ignore
  }
  return {
    playerId: crypto.randomUUID(),
    nickname: "Player",
    color: "#C026D3",
  };
}

function saveUser(u: UserState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
}

export default function App() {
  const [user, setUser] = useState<UserState>(loadUser);
  const [screen, setScreen] = useState<AppScreen>("nick");
  const [roomCode, setRoomCode] = useState<string>("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [lobbyState, setLobbyState] = useState<LobbyState | null>(null);
  const [galleryItems, setGalleryItems] = useState<unknown[]>([]);

  const persistUser = (next: Partial<UserState>) => {
    const nextUser = { ...user, ...next };
    setUser(nextUser);
    saveUser(nextUser);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-start to-bg-end bg-noise relative text-white">
      {screen === "nick" && (
        <NickScreen
          user={user}
          onSave={persistUser}
          onNext={() => setScreen("menu")}
        />
      )}
      {screen === "menu" && (
        <MenuScreen
          user={user}
          onBack={() => setScreen("nick")}
          onCreateRoom={(code) => {
            setRoomCode(code);
            setScreen("lobby");
          }}
          onJoinRoom={(code) => {
            setRoomCode(code);
            setScreen("lobby");
          }}
        />
      )}
      {screen === "lobby" && (
        <LobbyScreen
          user={user}
          roomCode={roomCode}
          onBack={() => setScreen("menu")}
          onGameStart={(socket, state) => {
            setWs(socket);
            setLobbyState(state);
            setScreen("game");
          }}
        />
      )}
      {screen === "game" && ws && (
        <GameScreen
          user={user}
          ws={ws}
          initialState={lobbyState}
          onGallery={(items) => {
            setGalleryItems(items);
            setScreen("gallery");
          }}
          onLeave={() => {
            ws.close();
            setWs(null);
            setScreen("menu");
          }}
        />
      )}
      {screen === "gallery" && (
        <GalleryScreen
          items={galleryItems}
          onPlayAgain={() => setScreen("menu")}
        />
      )}
    </div>
  );
}
