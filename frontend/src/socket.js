import { io } from "socket.io-client";

// Point this at your deployed backend URL in production
const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

export const socket = io(SERVER_URL, { autoConnect: true });

// Promise-wrapped emit — mirrors the ack-callback pattern used on the server
export function emitAsync(event, payload = {}) {
  return new Promise((resolve, reject) => {
    socket.emit(event, payload, (res) => {
      if (res?.ok) resolve(res);
      else reject(new Error(res?.error || "Unknown error"));
    });
  });
}
