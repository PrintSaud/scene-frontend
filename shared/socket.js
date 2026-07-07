import { io } from "socket.io-client";
import { backend } from "./config";

export const socket = io(backend, {
  withCredentials: true,
  autoConnect: false,
  transports: ["websocket"], // ✅ works for RN + web
});
