import { io } from "socket.io-client";

// Defaults to the deployed backend; override locally with VITE_SERVER_URL=http://localhost:3001
const SERVER_URL = import.meta.env.VITE_SERVER_URL || "https://call-break-claude.onrender.com";

export const socket = io(SERVER_URL, { autoConnect: true });

export function emitAsync(event, payload = {}) {
  return new Promise((resolve, reject) => {
    socket.emit(event, payload, (res) => {
      if (res?.ok) resolve(res);
      else reject(new Error(res?.error || "Unknown error"));
    });
  });
}
