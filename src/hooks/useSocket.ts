import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "@/stores/useAuth";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const token = useAuth((s) => s.token);
  const refreshToken = useAuth((s) => s.refreshToken);

  useEffect(() => {
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
    });

    socket.on("token_expired", async () => {
      if (!refreshToken) {
        socket.disconnect();
        return;
      }
      try {
        const res = await fetch(`${SOCKET_URL}/api/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        const data = await res.json();
        const newToken = data?.tokens?.accessToken;
        if (newToken) {
          socket.emit("refresh_token", newToken);
        } else {
          socket.disconnect();
        }
      } catch {
        socket.disconnect();
      }
    });

    socket.on("token_refreshed", () => {
      // Token successfully refreshed on the server
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, refreshToken]);

  return socketRef;
}
