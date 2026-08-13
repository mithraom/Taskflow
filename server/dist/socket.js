"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = initSocket;
exports.getIO = getIO;
const socket_io_1 = require("socket.io");
let io;
const boardPresence = {};
function broadcastPresence(boardId) {
    const names = Array.from(boardPresence[boardId]?.values() || []);
    io.to(`board:${boardId}`).emit("presence:update", names);
}
function initSocket(httpServer) {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: "*",
        },
    });
    io.on("connection", (socket) => {
        console.log("Client connected:", socket.id);
        socket.on("join-board", ({ boardId, userName }) => {
            socket.join(`board:${boardId}`);
            socket.data.boardId = boardId;
            socket.data.userName = userName;
            if (!boardPresence[boardId])
                boardPresence[boardId] = new Map();
            boardPresence[boardId].set(socket.id, userName);
            broadcastPresence(boardId);
            console.log(`Socket ${socket.id} (${userName}) joined board:${boardId}`);
        });
        socket.on("leave-board", (boardId) => {
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
function getIO() {
    if (!io) {
        throw new Error("Socket.io not initialized");
    }
    return io;
}
