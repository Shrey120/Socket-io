import { createServer } from "http";
import express from "express";
import { Server } from "socket.io";
import cors from "cors";
const app = express();
const server = createServer(app);
app.use(cors());
app.get("/", (req, res) => {
  res.send("Server is running");
});
const io = new Server(server, {
  wssEngine: ["ws", "wss"],
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  },
  transports: ["websocket", "polling"], // Add 'polling' as a fallback transport
  allowEIO3: true,
});

const socketMap = {};

io.on("connection", (socket) => {
  console.log("a user connected");
  const userId = socket.handshake.query.userId;
  if (userId) {
    socketMap[userId] = socket;
    console.log(`User ${userId} connected to socketId ${socket.id}`);
  }

  io.emit("getOnlineUsers", Object.keys(socketMap)); // send online users to all clients

  socket.on("sendNotification", (data) => {
    const { senderName, receiverId } = data;
    const receiverSocket = socketMap[receiverId];
    if (receiverSocket) {
      receiverSocket.emit("getNotification", {
        message: `${senderName} sent you a friend request`,
      });
    } else {
      console.log("Receiver not connected:", receiverId);
    }
  });

  socket.on("messageSent", (data) => {
    const { message, receiverId, senderId } = data;
    const receiverSocket = socketMap[receiverId];
    if (receiverSocket) {
      receiverSocket.emit("recieveMessage", {
        message: message,
        senderId: senderId,
      });
    } else {
      console.log("Receiver not connected:", receiverId);
    }
  });

  socket.on("disconnect", () => {
    if (userId) {
      delete socketMap[userId];
      console.log(`User ${userId} disconnected`);
      io.emit("getOnlineUsers", Object.keys(socketMap));
    }
  });
});

server.listen(5000, () => {
  console.log(`Socket.io server running on http://localhost:${5000}`);
});

export default io;
