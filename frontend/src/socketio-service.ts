import { io, Socket } from 'socket.io-client';
import API from './api';

const SOCKETIO_SERVER_URL = import.meta.env.VITE_SOCKETIO_URL || 'http://localhost:8003';
// If the Socket.IO server needs a different port, set VITE_SOCKETIO_URL in frontend/.env.

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKETIO_SERVER_URL, {
      // allow polling fallback for environments where native websockets are blocked
      transports: ['polling', 'websocket'],
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
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

    // Debug: log any incoming new_notification events globally so we can verify delivery
    socket.on('new_notification', (payload) => {
      try {
        console.debug('[socketio] new_notification:', payload);
      } catch (e) {
        console.debug('[socketio] new_notification (unserializable payload)');
      }
    });

    // When authentication succeeds, fetch a snapshot of notifications from the API
    socket.on('auth_success', () => {
      console.debug('[socketio] auth_success received, fetching notification snapshot');
      fetchAndNotifySnapshot();
    });

    socket.on('auth_error', (err) => {
      console.warn('[socketio] auth_error:', err);
    });

    // expose a hook for components to receive the fetched snapshot
    const snapshotCallbacks: Array<(payload: any) => void> = [];
    // attach to socket so public registration helpers can access the same array
    // @ts-ignore
    socket.__snapshotCallbacks = snapshotCallbacks;

    async function fetchAndNotifySnapshot() {
      try {
        const resp = await API.get('notifications/');
        snapshotCallbacks.forEach((cb) => {
          try {
            cb(resp.data);
          } catch (e) {
            console.error('[socketio] snapshot callback error:', e);
          }
        });
      } catch (e) {
        console.debug('[socketio] failed to fetch notification snapshot:', e?.message || e);
      }
    }

    // public registration helpers are appended below once socket exists

  }

  return socket;
};

export const authenticateSocket = (userId: number, role: string) => {
  const socket = getSocket();
  socket.emit('authenticate', {
    user_id: userId,
    role: role,
  });
};

export const onNewNotification = (callback: (notification: any) => void) => {
  const socket = getSocket();
  socket.on('new_notification', (payload) => {
    console.debug('[socketio] onNewNotification wrapper received payload:', payload);
    try {
      callback(payload);
    } catch (e) {
      console.error('[socketio] onNewNotification callback error:', e);
    }
  });
};

export const offNewNotification = (callback: (notification: any) => void) => {
  const socket = getSocket();
  socket.off('new_notification', callback);
};

// snapshot registration helpers
export const onNotificationsSnapshot = (callback: (payload: any) => void) => {
  const socket = getSocket();
  // ensure we register against the in-scope snapshotCallbacks array
  // @ts-ignore - attach to socket instance for storage convenience
  socket.__snapshotCallbacks = socket.__snapshotCallbacks || [];
  socket.__snapshotCallbacks.push(callback);
};

export const offNotificationsSnapshot = (callback: (payload: any) => void) => {
  const socket = getSocket();
  // @ts-ignore
  if (socket.__snapshotCallbacks) {
    // @ts-ignore
    socket.__snapshotCallbacks = socket.__snapshotCallbacks.filter((cb: any) => cb !== callback);
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
