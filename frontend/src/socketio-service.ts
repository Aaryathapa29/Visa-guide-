import { io, Socket } from 'socket.io-client';

const SOCKETIO_SERVER_URL = import.meta.env.VITE_SOCKETIO_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKETIO_SERVER_URL, {
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
  socket.on('new_notification', callback);
};

export const offNewNotification = (callback: (notification: any) => void) => {
  const socket = getSocket();
  socket.off('new_notification', callback);
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
