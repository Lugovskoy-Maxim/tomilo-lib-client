/**
 * Singleton WebSocket (Socket.IO) для уведомлений.
 * Открывается при первом подписчике; закрывается когда подписчиков не остаётся.
 * События: unread_count, progress (опыт/уровень/достижения), notification (новое уведомление).
 */
import { io, Socket } from "socket.io-client";
import { AUTH_TOKEN_KEY } from "@/store/api/baseQueryWithReauth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
const NOTIFICATIONS_NS = `${API_BASE.replace(/\/$/, "")}/notifications`;

export type NotificationsSocketEvent = {
  count?: number;
  connected?: boolean;
};

/** Событие прогресса с сервера (тосты опыта, уровня, достижений) */
export type ProgressSocketEvent =
  | { type: "exp_gain"; amount: number; reason: string }
  | {
      type: "level_up";
      oldLevel: number;
      newLevel: number;
      oldRank: { rank: number; stars: number; name: string; minLevel: number };
      newRank: { rank: number; stars: number; name: string; minLevel: number };
    }
  | { type: "achievement"; achievement: Record<string, unknown> };

/** Новое уведомление (комментарий, новая глава и т.д.) */
export type NotificationSocketEvent = {
  _id: string;
  type: string;
  title: string;
  message: string;
  titleId?: string;
  chapterId?: string;
  metadata?: Record<string, unknown>;
};

type Listener = (event: NotificationsSocketEvent) => void;
type ProgressListener = (event: ProgressSocketEvent) => void;
type NotificationListener = (event: NotificationSocketEvent) => void;

let socket: Socket | null = null;
let refCount = 0;
const listeners = new Set<Listener>();
const progressListeners = new Set<ProgressListener>();
const notificationListeners = new Set<NotificationListener>();

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

function createSocket(): Socket {
  const token = getToken();
  const newSocket = io(NOTIFICATIONS_NS, {
    transports: ["websocket", "polling"],
    auth: token ? { token } : {},
    withCredentials: true,
  });

  newSocket.on("connect", () => {
    notifyListeners({ connected: true });
  });

  newSocket.on("disconnect", () => {
    notifyListeners({ connected: false });
  });

  newSocket.on("unread_count", (payload: { count?: number }) => {
    const count = typeof payload?.count === "number" ? payload.count : undefined;
    if (count !== undefined) notifyListeners({ count });
  });

  newSocket.on("progress", (payload: ProgressSocketEvent) => {
    if (payload && typeof payload === "object" && payload.type) {
      progressListeners.forEach(l => {
        try {
          l(payload);
        } catch (e) {
          console.warn("[notificationsSocket] progress listener error:", e);
        }
      });
    }
  });

  newSocket.on("notification", (payload: NotificationSocketEvent) => {
    if (payload && typeof payload === "object" && payload._id != null) {
      notificationListeners.forEach(l => {
        try {
          l(payload);
        } catch (e) {
          console.warn("[notificationsSocket] notification listener error:", e);
        }
      });
    }
  });

  return newSocket;
}

function notifyListeners(event: NotificationsSocketEvent) {
  listeners.forEach(l => {
    try {
      l(event);
    } catch (e) {
      console.warn("[notificationsSocket] listener error:", e);
    }
  });
}

function acquireSocket(): void {
  refCount += 1;
  if (refCount === 1) {
    socket = createSocket();
  }
}

function releaseSocket(): void {
  refCount = Math.max(0, refCount - 1);
  if (refCount === 0 && socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

/**
 * Подписаться на события сокета уведомлений (unread_count, connected).
 * @returns функция отписки
 */
export function subscribeNotifications(listener: Listener): () => void {
  listeners.add(listener);
  acquireSocket();
  if (socket?.connected) listener({ connected: true });

  return () => {
    listeners.delete(listener);
    releaseSocket();
  };
}

/**
 * Подписаться на события прогресса (опыт, уровень, достижения) для тостов.
 * @returns функция отписки
 */
export function subscribeProgress(listener: ProgressListener): () => void {
  progressListeners.add(listener);
  acquireSocket();

  return () => {
    progressListeners.delete(listener);
    releaseSocket();
  };
}

/**
 * Подписаться на новые уведомления (комментарий, новая глава и т.д.) в реальном времени.
 * @returns функция отписки
 */
export function subscribeNotification(listener: NotificationListener): () => void {
  notificationListeners.add(listener);
  acquireSocket();

  return () => {
    notificationListeners.delete(listener);
    releaseSocket();
  };
}

export function isNotificationsSocketConnected(): boolean {
  return Boolean(socket?.connected);
}

/**
 * Переподключить сокет с актуальным токеном (вызывать после логина, чтобы получать progress/notification).
 */
export function reconnectNotificationsSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  if (refCount > 0) {
    socket = createSocket();
  }
}
