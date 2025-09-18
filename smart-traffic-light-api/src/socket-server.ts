// src/socket-server.ts

import { createServer } from 'http';
import { Server } from 'socket.io';

const server = createServer();
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // ดักฟังเหตุการณ์จากผู้ส่ง
    socket.on('traffic_mode_change', (data) => {
        // ส่งต่อ (broadcast) ข้อมูลไปยัง Client ทุกคน ยกเว้นผู้ส่ง
        socket.broadcast.emit('traffic_mode_change', data);
        console.log(`Server broadcasted 'traffic_mode_change' event from ${data.senderId}`);
    });

    // ดักฟังเหตุการณ์จากผู้ส่ง
    socket.on('traffic_time_change', (data) => {
        // ส่งต่อ (broadcast) ข้อมูลไปยัง Client ทุกคน ยกเว้นผู้ส่ง
        socket.broadcast.emit('traffic_time_change', data);
        console.log(`Server broadcasted 'traffic_time_change' event from ${data.senderId}`);
    });

    socket.on('disconnect', (reason) => {
        console.log(`User disconnected: ${socket.id}, reason: ${reason}`);
    });
});

server.listen(3000, () => {
  console.log('Socket.IO server listening on http://localhost:3000');
});

export { io };