// src/services/socket.ts
import { io } from 'socket.io-client';

// สร้าง instance การเชื่อมต่อเพียงครั้งเดียว
export const socket = io('http://localhost:3000');