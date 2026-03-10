import { io } from "socket.io-client";

export const SOCKET_URL = "https://rtk-chat-backend.onrender.com";

export const SOCKET_EVENTS = {
  join: "joinRoom",
  leave: "leaveRoom",
  send: "sendMessage",
  receive: "receiveMessage",
};

export function createSocket(token) {
  return io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 500,
  });
}
