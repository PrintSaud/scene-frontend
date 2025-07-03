// src/socket.js
import { io } from "socket.io-client";
import { backend } from "../config";
export const socket = io(backend, {
  withCredentials: true,
  autoConnect: false, // We’ll connect manually after login
});
