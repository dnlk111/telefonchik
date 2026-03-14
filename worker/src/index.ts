/**
 * Telefonchik — Cloudflare Worker
 * WebSocket upgrade to Durable Object (RoomDO) by room code.
 */

export { RoomDO } from "./RoomDO";

export interface Env {
  ROOMS: DurableObjectNamespace;
}

function parseRoomCode(pathname: string): string | null {
  const match = pathname.match(/^\/room\/([A-Z0-9]{5})$/i);
  return match ? match[1].toUpperCase() : null;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    if (url.pathname.startsWith("/room/")) {
      const roomCode = parseRoomCode(url.pathname);
      if (!roomCode) {
        return new Response(JSON.stringify({ error: "Invalid room code" }), { status: 400 });
      }
      const id = env.ROOMS.idFromName(roomCode);
      const stub = env.ROOMS.get(id);
      return stub.fetch(request);
    }
    return new Response("Not Found", { status: 404 });
  },
};
