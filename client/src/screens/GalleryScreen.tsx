import type { GalleryItem, ChainEntry } from "../types/game";
import { IconGallery, IconPlayAgain } from "../components/Icons";

interface GalleryScreenProps {
  items: unknown[];
  onPlayAgain: () => void;
}

export function GalleryScreen({ items, onPlayAgain }: GalleryScreenProps) {
  const list = items as GalleryItem[];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-purple to-neon-pink mb-2 flex items-center gap-3">
          <IconGallery size={40} className="text-neon-purple drop-shadow-[0_0_8px_rgba(192,38,211,0.5)]" />
          Галерея
        </h1>
        <p className="text-white/70 mb-8">Цепочки и рисунки раунда</p>
        <div className="space-y-8">
          {list.map((item, roundIndex) => (
            <div key={roundIndex} className="rounded-2xl bg-white/5 border border-white/10 p-6">
              {item.round !== undefined && (
                <h2 className="text-lg font-bold text-white/90 mb-4">Раунд {item.round + 1}</h2>
              )}
              {item.chain && item.chain.length > 0 && (
                <div className="space-y-4">
                  {(item.chain as ChainEntry[]).map((entry, i) => (
                    <div key={i} className="flex flex-col gap-2">
                      <span className="text-sm text-neon-purple font-medium">{entry.nickname}</span>
                      {entry.type === "text" ? (
                        <p className="text-white/90 p-2 rounded-lg bg-white/5">{entry.content}</p>
                      ) : (
                        <img
                          src={entry.content}
                          alt={`Рисунок ${entry.nickname}`}
                          className="max-w-full rounded-xl border border-white/10 max-h-80 object-contain"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
              {item.drawings && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {item.drawings.map((d, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <span className="text-sm text-white/70">{d.nickname}</span>
                      <img
                        src={d.imageData}
                        alt={d.nickname}
                        className="rounded-xl border border-white/10 w-full aspect-square object-contain bg-bg-start"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-8 flex gap-4">
          <button
            type="button"
            onClick={onPlayAgain}
            className="px-6 py-3 rounded-btn bg-neon-green text-black font-bold btn-press flex items-center gap-2 hover:shadow-glowGreen"
          >
            <IconPlayAgain size={24} />
            Сыграть ещё раз
          </button>
        </div>
      </div>
    </div>
  );
}
