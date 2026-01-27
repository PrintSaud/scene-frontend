import { io } from "socket.io-client";
import { backend } from "./config";

// Make sure backend is "https://backend.scenesa.com"
export const socket = io(backend, {
  withCredentials: true,
  autoConnect: false,
  transports: ["websocket"], // ✅ Force websocket
});
