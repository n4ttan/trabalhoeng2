import { io } from 'socket.io-client';
import { obterToken } from './authApi';

let socket = null;
const listeners = new Set();

export function obterSocket() {
  const token = obterToken();
  if (!token) {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    return null;
  }

  if (!socket || !socket.connected) {
    socket = io('http://localhost:3000', {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('🔌 Conectado ao servidor WebSocket via Socket.IO');
    });

    socket.on('nova_notificacao', (notificacao) => {
      console.log('🔔 Nova notificação recebida em tempo real:', notificacao);
      listeners.forEach((callback) => {
        try {
          callback(notificacao);
        } catch (e) {
          console.error('Erro no listener de notificação:', e);
        }
      });
    });

    socket.on('connect_error', (err) => {
      console.warn('Aviso de conexão WebSocket:', err.message);
    });
  }

  return socket;
}

export function assinarNotificacoes(callback) {
  listeners.add(callback);
  obterSocket();

  return () => {
    listeners.delete(callback);
  };
}

export function desconectarSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
