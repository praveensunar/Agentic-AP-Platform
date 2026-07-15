import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useNotificationStore } from '../store/useNotificationStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { playNotificationSound } from '../utils/audio';
import type { InvoiceStatusUpdate, Notification } from '../types';

const BACKEND_SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:5000';

export function useSocket() {
  const socketConnectionRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    // Establish the Socket.IO connection to the backend
    const socketConnection = io(BACKEND_SOCKET_URL, { transports: ['websocket'] });
    socketConnectionRef.current = socketConnection;

    socketConnection.on('connect', () => {
      console.log('[Socket] Connected with ID:', socketConnection.id);
    });

    socketConnection.on('disconnect', () => {
      console.log('[Socket] Disconnected from server');
    });

    // When an invoice status changes, refresh the invoice list and dashboard data
    socketConnection.on('invoice:status_update', (statusUpdate: InvoiceStatusUpdate) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-dashboard'] });
      console.log(`[Socket] Invoice ${statusUpdate.invoiceNumber} → ${statusUpdate.status}`);
    });

    // When a new notification arrives, add it to the global notification store
    socketConnection.on('notification:new', (incomingNotification: Notification) => {
      addNotification(incomingNotification);
      
      // Play sound chime if enabled in settings store
      if (useSettingsStore.getState().soundNotifications) {
        playNotificationSound();
      }
    });

    // Clean up the socket connection when the component unmounts
    return () => {
      socketConnection.disconnect();
    };
  }, [queryClient, addNotification]);

  return socketConnectionRef.current;
}
