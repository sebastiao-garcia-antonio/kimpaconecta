const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  // Mapeamento de utilizadores conectados (userId -> Set de socketIds)
  const connectedUsers = new Map();

  io.on("connection", (socket) => {
    console.log(`[Socket.IO] 🔌 Cliente ligado: ${socket.id}`);

    // Registo do utilizador no seu canal individual
    socket.on("join_user", (userId) => {
      if (userId) {
        const userRoom = `user_${userId}`;
        socket.join(userRoom);

        if (!connectedUsers.has(userId)) {
          connectedUsers.set(userId, new Set());
        }
        connectedUsers.get(userId).add(socket.id);

        console.log(`[Socket.IO] 👤 Utilizador #${userId} registado no canal ${userRoom}`);

        // Emitir estado online para o canal do próprio utilizador
        socket.emit("status_change", { online: true, userId });
      }
    });

    // Entrar numa sala de chat/grupo
    socket.on("join_room", (roomId) => {
      if (roomId) {
        const roomName = `room_${roomId}`;
        socket.join(roomName);
        console.log(`[Socket.IO] 💬 Socket ${socket.id} entrou na sala ${roomName}`);
      }
    });

    // Sair de uma sala de chat
    socket.on("leave_room", (roomId) => {
      if (roomId) {
        const roomName = `room_${roomId}`;
        socket.leave(roomName);
        console.log(`[Socket.IO] 🚪 Socket ${socket.id} saiu da sala ${roomName}`);
      }
    });

    // Transmissão de mensagem em tempo real numa sala
    socket.on("send_message", (data) => {
      const { roomId, message, senderId, senderName, idMensagem } = data;
      if (roomId) {
        const payload = {
          id: idMensagem || Date.now(),
          idGrupo: roomId,
          conteudo: message,
          idEmissor: senderId,
          emissorNome: senderName,
          criadoEm: new Date().toISOString(),
        };

        // Emitir para todos na sala exceto quem enviou
        socket.to(`room_${roomId}`).emit("new_message", payload);
      }
    });

    // Indicador "A escrever..."
    socket.on("typing", (data) => {
      const { roomId, userId, userName, isTyping } = data;
      if (roomId) {
        socket.to(`room_${roomId}`).emit("user_typing", {
          roomId,
          userId,
          userName,
          isTyping,
        });
      }
    });

    // Enviar notificação direta para um utilizador
    socket.on("send_notification", (data) => {
      const { targetUserId, title, message, type, priority } = data;
      if (targetUserId) {
        io.to(`user_${targetUserId}`).emit("new_notification", {
          id: Date.now(),
          titulo: title,
          mensagem: message,
          tipo: type || "sistema",
          prioridade: priority || "normal",
          criadoEm: new Date().toISOString(),
          lida: false,
        });
      }
    });

    socket.on("disconnect", () => {
      console.log(`[Socket.IO] ⚡ Cliente desligado: ${socket.id}`);
      for (const [userId, sockets] of connectedUsers.entries()) {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            connectedUsers.delete(userId);
          }
          break;
        }
      }
    });
  });

  // Disponibilizar a instância do Socket.IO globalmente no processo Node.js
  global.io = io;

  httpServer.listen(port, () => {
    console.log(`\n🚀 Servidor Kimpa Connect + Socket.IO a correr em http://${hostname}:${port}\n`);
  });
});
