const socketIo = require('socket.io');
require('dotenv').config();

const frontUrl = process.env.FRONT;

const setupSocket = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: frontUrl,
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    },
    transports: ['websocket']
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    socket.on('registerUser', (userId) => {
      socket.join(userId); // เก็บ Socket ตาม userId
      console.log('User registered:', userId);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  io.on('connect_error', (error) => {
    console.error('Connection error:', error);
  });

  return io; // คืนค่า io เพื่อให้ใช้งานได้ในที่อื่น
};

module.exports = setupSocket;