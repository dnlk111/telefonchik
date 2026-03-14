import { useState } from "react";
import type { RoomSettings } from "../types/game";
import { IconSettings, IconDone, IconBack } from "../components/Icons";

interface AdvancedSettingsModalProps {
  settings: RoomSettings;
  onSave: (s: Partial<RoomSettings>) => void;
  onClose: () => void;
}

export function AdvancedSettingsModal({ settings, onSave, onClose }: AdvancedSettingsModalProps) {
  const [local, setLocal] = useState(settings);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div
        className="bg-bg-end rounded-2xl border border-white/20 p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <IconSettings size={24} className="text-neon-purple" />
          Расширенные настройки
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/80 mb-1">Время на ход (сек)</label>
            <input
              type="number"
              min={30}
              max={180}
              value={local.timePerTurn}
              onChange={(e) => setLocal((s) => ({ ...s, timePerTurn: +e.target.value }))}
              className="w-full px-3 py-2 rounded-btn bg-white/10 border border-white/20 text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-white/80 mb-1">Количество раундов</label>
            <input
              type="number"
              min={1}
              max={10}
              value={local.rounds}
              onChange={(e) => setLocal((s) => ({ ...s, rounds: +e.target.value }))}
              className="w-full px-3 py-2 rounded-btn bg-white/10 border border-white/20 text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-white/80 mb-1">Макс. игроков</label>
            <input
              type="number"
              min={2}
              max={16}
              value={local.maxPlayers}
              onChange={(e) => setLocal((s) => ({ ...s, maxPlayers: +e.target.value }))}
              className="w-full px-3 py-2 rounded-btn bg-white/10 border border-white/20 text-white"
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={local.hideActions}
              onChange={(e) => setLocal((s) => ({ ...s, hideActions: e.target.checked }))}
              className="rounded"
            />
            <span className="text-sm text-white/80">Скрывать действия</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={local.likesEnabled}
              onChange={(e) => setLocal((s) => ({ ...s, likesEnabled: e.target.checked }))}
              className="rounded"
            />
            <span className="text-sm text-white/80">Лайки</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={local.autoPlayAnimation}
              onChange={(e) => setLocal((s) => ({ ...s, autoPlayAnimation: e.target.checked }))}
              className="rounded"
            />
            <span className="text-sm text-white/80">Автопроигрывание анимации</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={local.squareCanvas}
              onChange={(e) => setLocal((s) => ({ ...s, squareCanvas: e.target.checked }))}
              className="rounded"
            />
            <span className="text-sm text-white/80">Квадратный холст</span>
          </label>
          {local.mode === "story" && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={local.storyVoiceEnabled ?? true}
                onChange={(e) => setLocal((s) => ({ ...s, storyVoiceEnabled: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm text-white/80">Озвучка истории (Web Speech)</span>
            </label>
          )}
          {local.mode === "knockoff" && (
            <div>
              <label className="block text-sm text-white/80 mb-1">Стартовое время (сек)</label>
              <input
                type="number"
                min={30}
                max={120}
                value={local.knockOffStartTime ?? 90}
                onChange={(e) => setLocal((s) => ({ ...s, knockOffStartTime: +e.target.value }))}
                className="w-full px-3 py-2 rounded-btn bg-white/10 border border-white/20 text-white"
              />
            </div>
          )}
          {local.mode === "animation" && (
            <>
              <div>
                <label className="block text-sm text-white/80 mb-1">Кадров на игрока</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={local.animationFramesPerPlayer ?? 1}
                  onChange={(e) => setLocal((s) => ({ ...s, animationFramesPerPlayer: +e.target.value }))}
                  className="w-full px-3 py-2 rounded-btn bg-white/10 border border-white/20 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-white/80 mb-1">Скорость воспроизведения</label>
                <input
                  type="number"
                  min={0.5}
                  max={3}
                  step={0.25}
                  value={local.animationPlaybackSpeed ?? 1}
                  onChange={(e) => setLocal((s) => ({ ...s, animationPlaybackSpeed: +e.target.value }))}
                  className="w-full px-3 py-2 rounded-btn bg-white/10 border border-white/20 text-white"
                />
              </div>
            </>
          )}
          {local.mode === "exquisite" && (
            <div>
              <label className="block text-sm text-white/80 mb-1">Частей (3 или 4)</label>
              <input
                type="number"
                min={3}
                max={4}
                value={local.exquisiteParts ?? 3}
                onChange={(e) => setLocal((s) => ({ ...s, exquisiteParts: +e.target.value }))}
                className="w-full px-3 py-2 rounded-btn bg-white/10 border border-white/20 text-white"
              />
            </div>
          )}
          {local.mode === "missingpiece" && (
            <div>
              <label className="block text-sm text-white/80 mb-1">Частей стирать за ход</label>
              <input
                type="number"
                min={1}
                max={3}
                value={local.missingPieceEraseCount ?? 1}
                onChange={(e) => setLocal((s) => ({ ...s, missingPieceEraseCount: +e.target.value }))}
                className="w-full px-3 py-2 rounded-btn bg-white/10 border border-white/20 text-white"
              />
            </div>
          )}
          {local.mode === "solo" && (
            <div>
              <label className="block text-sm text-white/80 mb-1">Кадров анимации (5–20)</label>
              <input
                type="number"
                min={5}
                max={20}
                value={local.soloFrames ?? 10}
                onChange={(e) => setLocal((s) => ({ ...s, soloFrames: +e.target.value }))}
                className="w-full px-3 py-2 rounded-btn bg-white/10 border border-white/20 text-white"
              />
            </div>
          )}
        </div>
        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={() => onSave(local)}
            className="flex-1 py-3 rounded-btn bg-neon-purple text-white font-bold btn-press flex items-center justify-center gap-2"
          >
            <IconDone size={20} />
            Сохранить
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-btn bg-white/10 text-white flex items-center gap-2"
          >
            <IconBack size={18} />
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}
