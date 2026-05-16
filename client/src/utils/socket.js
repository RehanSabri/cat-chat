import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

const socket = io(SERVER_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000,
});

socket.on('connect', () => {
  console.log('[Socket] Connected:', socket.id);

  // If we just reconnected after a drop, try to restore the previous session
  const prevId = sessionStorage.getItem('prev_socket_id');
  if (prevId && prevId !== socket.id) {
    socket.emit('reconnect_restore', { prevSocketId: prevId });
  }
  sessionStorage.setItem('prev_socket_id', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('[Socket] Disconnected:', reason);
  // Keep prev_socket_id so the reconnect handler can reference it
});

socket.on('connect_error', (error) => {
  console.error('[Socket] Connection error:', error.message);
});

export default socket;
