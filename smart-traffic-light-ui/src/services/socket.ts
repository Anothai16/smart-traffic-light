// src/services/socket.ts

import { io } from 'socket.io-client';

// Get the URL from the environment variable
const VITE_SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_SERVER_URL;
// console.log('Socket Server URL:', VITE_SOCKET_SERVER_URL);
// Use the environment variable for the socket connection
export const socket = io(VITE_SOCKET_SERVER_URL as string);