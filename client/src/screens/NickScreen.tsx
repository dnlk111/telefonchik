import { useState } from "react";
import type { UserState } from "../App";
import { IconLogo, IconDone } from "../components/Icons";

const AVATAR_COLORS = [
  "#C026D3", "#FF00AA", "#00FFAA", "#FFAA00", "#00AAFF",
  "#AA00FF", "#FF4444", "#44FF44", "#4444FF", "#FF8844",
];

interface NickScreenProps {
  user: UserState;
  onSave: (u: Partial<UserState>) => void;
  onNext: () => void;
}

export function NickScreen({ user, onSave, onNext }: NickScreenProps) {
  const [nickname, setNickname] = useState(user.nickname);
  const [color, setColor] = useState(user.color);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nickname.trim() || "Player";
    onSave({ nickname: trimmed, color });
    onNext();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <IconLogo size={64} className="mb-4 drop-shadow-[0_0_12px_rgba(192,38,211,0.6)]" />
      <h1 className="text-4xl md:text-5xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-neon-purple to-neon-pink">
        ТЕЛЕФОНЧИК
      </h1>
      <p className="text-white/80 text-lg mb-8 flex items-center gap-2">
        <span className="inline-block w-5 h-5 rounded bg-neon-green/30 border border-neon-green" />
        Рисуй и угадывай
      </p>
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
        <div>
          <label className="block text-sm font-medium text-white/90 mb-2">Твой ник</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value.slice(0, 20))}
            placeholder="Player"
            className="w-full px-4 py-3 rounded-btn bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-neon-purple focus:border-transparent"
            maxLength={20}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white/90 mb-2">Цвет аватарки</label>
          <div className="flex flex-wrap gap-2">
            {AVATAR_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="w-10 h-10 rounded-full border-2 transition-all btn-press"
                style={{
                  backgroundColor: c,
                  borderColor: color === c ? "#fff" : "transparent",
                  boxShadow: color === c ? "0 0 12px " + c : "none",
                }}
              />
            ))}
          </div>
        </div>
        <button
          type="submit"
          className="w-full py-3 rounded-btn bg-neon-purple text-white font-bold text-lg btn-press btn-glow hover:bg-neon-pink transition-all flex items-center justify-center gap-2"
        >
          <IconDone size={22} />
          Продолжить
        </button>
      </form>
    </div>
  );
}
