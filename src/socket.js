// src/socket.js
import { io } from "socket.io-client";

const backend = import.meta.env.VITE_BACKEND;
export const socket = io(backend, {
  withCredentials: true,
  autoConnect: false, // We’ll connect manually after login
});
