const WS_BASE =
  import.meta.env.VITE_WS_URL ||
  (typeof location !== "undefined"
    ? `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}`
    : "ws://localhost:5173");

export function getRoomWsUrl(roomCode: string, playerId: string, nickname: string, color: string): string {
  const params = new URLSearchParams({
    code: roomCode,
    playerId,
    nickname,
    color: color.replace("#", ""),
  });
  return `${WS_BASE}/room/${roomCode}?${params.toString()}`;
}
