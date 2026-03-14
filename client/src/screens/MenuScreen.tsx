import { useState } from "react";
import type { UserState } from "../App";
import { IconLogo, IconCreateRoom, IconJoin, IconBack } from "../components/Icons";

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

interface MenuScreenProps {
  user: UserState;
  onBack: () => void;
  onCreateRoom: (code: string) => void;
  onJoinRoom: (code: string) => void;
}

export function MenuScreen({ user, onBack, onCreateRoom, onJoinRoom }: MenuScreenProps) {
  const [joinCode, setJoinCode] = useState("");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="flex items-center gap-3 mb-8">
        <div
          className="w-12 h-12 rounded-full flex-shrink-0 border-2 border-white/20"
          style={{ backgroundColor: user.color }}
        />
        <span className="text-xl font-bold">{user.nickname}</span>
        <button
          type="button"
          onClick={onBack}
          className="ml-4 text-white/70 hover:text-white text-sm flex items-center gap-1"
        >
          <IconBack size={18} />
          Сменить
        </button>
      </div>
      <IconLogo size={56} className="mb-4 drop-shadow-[0_0_10px_rgba(192,38,211,0.5)]" />
      <h1 className="text-3xl font-bold mb-8">ТЕЛЕФОНЧИК</h1>
      <div className="w-full max-w-sm space-y-4">
        <button
          type="button"
          onClick={() => onCreateRoom(generateRoomCode())}
          className="w-full py-4 rounded-btn bg-neon-purple text-white font-bold text-lg btn-press btn-glow hover:bg-neon-pink transition-all flex items-center justify-center gap-3"
        >
          <IconCreateRoom size={28} />
          Создать комнату
        </button>
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/20" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-transparent text-white/60">или</span>
          </div>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 5))}
            placeholder="Код комнаты"
            className="flex-1 px-4 py-3 rounded-btn bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-neon-purple uppercase"
            maxLength={5}
          />
          <button
            type="button"
            onClick={() => joinCode.length === 5 && onJoinRoom(joinCode)}
            disabled={joinCode.length !== 5}
            className="px-6 py-3 rounded-btn bg-neon-green text-black font-bold btn-press disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-glowGreen flex items-center gap-2"
          >
            <IconJoin size={20} />
            Войти
          </button>
        </div>
      </div>
    </div>
  );
}
