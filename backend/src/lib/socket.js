import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

// userId -> socketId
const userSocketMap = {};

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  const userId = socket.handshake.query.userId;

  if (userId) {
    userSocketMap[userId] = socket.id;
  }

  // ✅ send online users
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    for (const user in userSocketMap) {
      if (userSocketMap[user] === socket.id) {
        delete userSocketMap[user];
        break;
      }
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { app, server };