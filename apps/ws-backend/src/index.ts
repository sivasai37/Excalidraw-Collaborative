import { WebSocket, WebSocketServer } from 'ws';
import jwt from "jsonwebtoken";
import { JWT_SECRET } from '@repo/backendcommon/config';
import { prismaClient } from "@repo/db/client";

// Dynamically resolve port from env (PORT or parsed from NEXT_PUBLIC_WS_URL)
const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8081";
const match = wsUrl.match(/:(\d+)/);
const portStr = match?.[1];
const PORT = process.env.PORT || process.env.WS_PORT
  ? parseInt(String(process.env.PORT || process.env.WS_PORT), 10)
  : (portStr ? parseInt(portStr, 10) : 8081);

const wss = new WebSocketServer({ port: PORT });

interface User {
  ws: WebSocket;
  rooms: number[];
  userId: string;
}

const users: User[] = [];

function checkUser(token: string): string | null {
  try {
    console.log("Verifying token:", token ? token.substring(0, 15) + "..." : "empty");
    console.log("Using JWT_SECRET:", JWT_SECRET ? JWT_SECRET.substring(0, 5) + "..." : "empty");
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (!decoded || typeof decoded === 'string' || !decoded.userId) {
      console.log("Token verification failed: invalid payload structure", decoded);
      return null;
    }

    console.log("Token verified successfully for user:", decoded.userId);
    return String(decoded.userId);
  } catch (e) {
    console.error("Token verification failed with error:", e);
    return null;
  }
}

wss.on('connection', function connection(ws, request) {
  const url = request.url;
  console.log("WebSocket connection attempt received. URL:", url);
  if (!url) {
    console.log("Connection rejected: missing URL");
    return;
  }

  const queryParams = new URLSearchParams(url.split('?')[1]);
  const token = queryParams.get('token') || "";
  if (!token) {
    console.log("Connection rejected: missing token in query parameters");
    try { ws.close(); } catch {}
    return;
  }
  const userId = checkUser(token);

  if (userId == null) {
    console.log("Connection rejected: invalid token/user verification");
    try { ws.close(); } catch {}
    return;
  }

  users.push({ userId, rooms: [], ws });

  ws.on('message', async function message(data) {
    let parsedData: any = null;
    try {
      if (typeof data !== 'string') parsedData = JSON.parse(data.toString());
      else parsedData = JSON.parse(data);
    } catch (e) {
      console.error('Invalid message payload', e);
      return;
    }

    if (parsedData.type === 'join_room') {
      const roomId = Number(parsedData.roomId);
      if (Number.isNaN(roomId)) return;
      const room = await prismaClient.room.findUnique({ where: { id: roomId } });
      if (!room) {
        ws.send(JSON.stringify({ type: 'error', message: 'Room not found', roomId }));
        return;
      }
      const user = users.find(x => x.ws === ws);
      if (!user) return;
      if (!user.rooms.includes(roomId)) user.rooms.push(roomId);

      // send existing strokes and texts
      try {
        const strokes = await prismaClient.pencilStroke.findMany({ where: { roomId } });
        const texts = await prismaClient.textItem.findMany({ where: { roomId } });
        ws.send(JSON.stringify({ type: 'init_pencil', strokes }));
        ws.send(JSON.stringify({ type: 'init_text', texts }));
      } catch (e) {
        console.error('Error loading room data', e);
      }
    }

    if (parsedData.type === 'leave_room') {
      const roomId = Number(parsedData.roomId);
      const user = users.find(x => x.ws === ws);
      if (!user) return;
      user.rooms = user.rooms.filter(x => x !== roomId);
    }

    console.log('message received', parsedData);

    if (parsedData.type === 'chat') {
      const roomId = Number(parsedData.roomId);
      const message = parsedData.message;
      try {
        await prismaClient.chat.create({ data: { roomId: Number(roomId), message, userId } });
      } catch (e) {
        console.error('Failed to persist chat', e);
      }

      users.forEach(user => {
        if (user.rooms.includes(roomId)) {
          try { user.ws.send(JSON.stringify({ type: 'chat', message, roomId })); } catch (e) {}
        }
      });
    }

    if (parsedData.type === 'pencil') {
      const roomId = Number(parsedData.roomId);
      const stroke = parsedData.stroke;
      try {
        const created = await prismaClient.pencilStroke.create({ data: { roomId, userId, pathData: JSON.stringify(stroke.path), color: stroke.color || '#000', width: stroke.width || 2 } });
        users.forEach(user => {
          if (user.rooms.includes(roomId)) {
            try { user.ws.send(JSON.stringify({ type: 'pencil', stroke: { ...stroke, id: created.id }, roomId })); } catch (e) {}
          }
        });
      } catch (e) {
        console.error('Failed to persist pencil stroke', e);
      }
    }

    if (parsedData.type === 'text') {
      const roomId = Number(parsedData.roomId);
      const text = parsedData.text;
      try {
        const created = await prismaClient.textItem.create({ data: { roomId, userId, text: text.value, x: text.x, y: text.y, color: text.color || '#000', fontSize: text.fontSize || 14 } });
        users.forEach(user => {
          if (user.rooms.includes(roomId)) {
            try { user.ws.send(JSON.stringify({ type: 'text', text: { ...text, id: created.id }, roomId })); } catch (e) {}
          }
        });
      } catch (e) {
        console.error('Failed to persist text item', e);
      }
    }
  });

  ws.on('close', () => {
    const idx = users.findIndex(u => u.ws === ws);
    if (idx !== -1) users.splice(idx, 1);
  });
});

console.log(`WebSocket server running on port ${PORT}`);
