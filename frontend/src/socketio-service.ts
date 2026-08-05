import { io, Socket } from 'socket.io-client';
import API from './api';

const SOCKETIO_SERVER_URL = import.meta.env.VITE_SOCKETIO_URL || 'http://localhost:8003';
// If the Socket.IO server needs a different port, set VITE_SOCKETIO_URL in frontend/.env.

let socket: Socket | null = null;
const queuedListeners: Array<{ event: string; callback: (...args: any[]) => void }> = [];
const snapshotCallbacks: Array<(payload: any) => void> = [];
const newNotificationWrappers = new Map<Function, (...args: any[]) => void>();
const notificationsReadWrappers = new Map<Function, (...args: any[]) => void>();
let authSucceeded = false;
let latestSnapshot: any = null;

function getStoredToken() {
  if (typeof window === 'undefined') {
    return '';
  }

  return (
    window.localStorage.getItem('access_token') ||
    window.localStorage.getItem('accessToken') ||
    window.localStorage.getItem('token') ||
    window.sessionStorage.getItem('access_token') ||
    window.sessionStorage.getItem('accessToken') ||
    window.sessionStorage.getItem('token') ||
    ''
  );
}

const createSocket = (): Socket => {
  if (socket) {
    return socket;
  }

  const token = getStoredToken();
  const socketQuery = token ? { token } : undefined;

  socket = io(SOCKETIO_SERVER_URL, {
    // Force websocket-only transport to avoid HTTP long-polling
    transports: ['websocket'],
    withCredentials: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    query: socketQuery,
  });

  socket.on('connect', () => {
    console.log('Connected to Socket.IO server');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket.IO connection error:', error);
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from Socket.IO server');
  });

  socket.on('new_notification', (payload) => {
    try {
      console.debug('[socketio] new_notification:', payload);
    } catch (e) {
      console.debug('[socketio] new_notification (unserializable payload)');
    }
  });

  socket.on('auth_success', () => {
    console.debug('[socketio] auth_success received, fetching notification snapshot');
    authSucceeded = true;
    fetchAndNotifySnapshot();
  });

  socket.on('auth_error', (err) => {
    console.warn('[socketio] auth_error:', err);
  });

  const deliveryEvents = ['new_notification', 'notifications_read'];
  deliveryEvents.forEach((event) => {
    const listeners = queuedListeners.filter((item) => item.event === event);
    listeners.forEach(({ callback }) => socket?.on(event, callback));
  });

  queuedListeners.forEach(({ event, callback }) => {
    if (!deliveryEvents.includes(event)) {
      socket?.on(event, callback);
    }
  });
  queuedListeners.length = 0;

  return socket;
};

export const getGlobalSocket = (): Socket => createSocket();

const getSocketIfInitialized = (): Socket | null => socket;

const addSocketListener = (event: string, callback: (...args: any[]) => void) => {
  const existingSocket = getSocketIfInitialized();

  if (existingSocket) {
    existingSocket.on(event, callback);
    return;
  }

  queuedListeners.push({ event, callback });
};

const removeSocketListener = (event: string, callback: (...args: any[]) => void) => {
  const existingSocket = getSocketIfInitialized();

  if (existingSocket) {
    existingSocket.off(event, callback);
    return;
  }

  const index = queuedListeners.findIndex((item) => item.event === event && item.callback === callback);
  if (index >= 0) {
    queuedListeners.splice(index, 1);
  }
};

async function fetchAndNotifySnapshot() {
  try {
    const resp = await API.get('notifications/');
    latestSnapshot = resp.data;
    snapshotCallbacks.forEach((cb) => {
      try {
        cb(resp.data);
      } catch (e) {
        console.error('[socketio] snapshot callback error:', e);
      }
    });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.debug('[socketio] failed to fetch notification snapshot:', errorMessage);
  }
}

export const authenticateSocket = (userId: number, role: string) => {
  if (!userId || !role) {
    console.warn('[socketio] authenticateSocket called without valid userId or role');
    return;
  }

  const socket = createSocket();
  socket.emit('authenticate', {
    user_id: userId,
    role,
  });
};

export const onNewNotification = (callback: (notification: any) => void) => {
  const wrapper = (payload: any) => {
    console.debug('[socketio] onNewNotification wrapper received payload:', payload);
    try {
      callback(payload);
    } catch (e) {
      console.error('[socketio] onNewNotification callback error:', e);
    }
  };

  newNotificationWrappers.set(callback, wrapper);
  addSocketListener('new_notification', wrapper);
};

export const offNewNotification = (callback: (notification: any) => void) => {
  const wrapper = newNotificationWrappers.get(callback);
  if (wrapper) {
    removeSocketListener('new_notification', wrapper);
    newNotificationWrappers.delete(callback);
  } else {
    removeSocketListener('new_notification', callback);
  }
};

export const onNotificationsSnapshot = (callback: (payload: any) => void) => {
  snapshotCallbacks.push(callback);
  if (authSucceeded && latestSnapshot) {
    try {
      callback(latestSnapshot);
    } catch (e) {
      console.error('[socketio] snapshot callback immediate delivery error:', e);
    }
  }
};

export const offNotificationsSnapshot = (callback: (payload: any) => void) => {
  const index = snapshotCallbacks.findIndex((cb) => cb === callback);
  if (index >= 0) {
    snapshotCallbacks.splice(index, 1);
  }
};

export const onNotificationsRead = (callback: (payload: any) => void) => {
  const wrapper = (payload: any) => {
    try {
      callback(payload);
    } catch (e) {
      console.error('[socketio] onNotificationsRead callback error:', e);
    }
  };

  notificationsReadWrappers.set(callback, wrapper);
  addSocketListener('notifications_read', wrapper);
};

export const offNotificationsRead = (callback: (payload: any) => void) => {
  const wrapper = notificationsReadWrappers.get(callback);
  if (wrapper) {
    removeSocketListener('notifications_read', wrapper);
    notificationsReadWrappers.delete(callback);
  } else {
    removeSocketListener('notifications_read', callback);
  }
};

export const emitNotificationsRead = (consultancyId: number) => {
  const socket = getSocketIfInitialized();
  if (!socket) {
    return;
  }

  socket.emit('mark_notifications_read', { consultancy_id: consultancyId });
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
