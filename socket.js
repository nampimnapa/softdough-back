const socketIo = require('socket.io');

const setupSocket = (server) => {
    const io = socketIo(server, { cors: { origin: 'https://softdough.co', credentials: true } });

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

    return io; // คืนค่า io เพื่อให้ใช้งานได้ในที่อื่น
};

module.exports = setupSocket;