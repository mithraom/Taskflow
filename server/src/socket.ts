import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";

let io: SocketIOServer;

const boardPresence: Record<string, Map<string, string>> = {};

function broadcastPresence(boardId: string) {
  const names = Array.from(boardPresence[boardId]?.values() || []);
  io.to(`board:${boardId}`).emit("presence:update", names);
}

export function initSocket(httpServer: HTTPServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join-board", ({ boardId, userName }: { boardId: string; userName: string }) => {
      socket.join(`board:${boardId}`);
      socket.data.boardId = boardId;
      socket.data.userName = userName;

      if (!boardPresence[boardId]) boardPresence[boardId] = new Map();
      boardPresence[boardId].set(socket.id, userName);

      broadcastPresence(boardId);
      console.log(`Socket ${socket.id} (${userName}) joined board:${boardId}`);
    });

    socket.on("leave-board", (boardId: string) => {
      socket.leave(`board:${boardId}`);
      if (boardPresence[boardId]) {
        boardPresence[boardId].delete(socket.id);
        broadcastPresence(boardId);
      }
    });

    socket.on("disconnect", () => {
      const boardId = socket.data.boardId;
      if (boardId && boardPresence[boardId]) {
        boardPresence[boardId].delete(socket.id);
        broadcastPresence(boardId);
      }
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
}