import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
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
      queryClient.invalidateQueries({ queryKey: ['invoice', statusUpdate.invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-dashboard'] });
      console.log(`[Socket] Invoice ${statusUpdate.invoiceNumber} → ${statusUpdate.status}`);

      // Handle progressive toast notifications for invoices
      const settings = useSettingsStore.getState();
      let shouldAlert = false;
      
      if (statusUpdate.status === 'Processing') {
        shouldAlert = settings.invoiceUploadAlerts;
      } else if (['OCR Complete', 'Extraction Complete'].includes(statusUpdate.status)) {
        shouldAlert = settings.processingAlerts;
      } else if (['Approved', 'Human Review'].includes(statusUpdate.status)) {
        shouldAlert = settings.approvalAlerts;
      } else if (statusUpdate.status === 'Failed') {
        shouldAlert = settings.failureAlerts;
      }

      if (shouldAlert) {
        // Play sound chime only for major events (Start / End) to prevent sound spam
        const isIntermediate = ['OCR Complete', 'Extraction Complete'].includes(statusUpdate.status);
        if (!isIntermediate && settings.soundNotifications) {
          playNotificationSound();
        }

        // Render progressive toast in-place by grouping on invoiceId
        if (statusUpdate.status === 'Failed') {
          toast.error(`Invoice ${statusUpdate.invoiceNumber} processing failed`, { id: statusUpdate.invoiceId });
        } else if (statusUpdate.status === 'Approved') {
          toast.success(`Invoice ${statusUpdate.invoiceNumber} approved successfully`, { id: statusUpdate.invoiceId });
        } else if (statusUpdate.status === 'Human Review') {
          toast.success(`Invoice ${statusUpdate.invoiceNumber} requires human review`, { id: statusUpdate.invoiceId, icon: '📝' });
        } else {
          let stepMsg = `Processing invoice ${statusUpdate.invoiceNumber}...`;
          if (statusUpdate.status === 'OCR Complete') {
            stepMsg = `Running OCR on ${statusUpdate.invoiceNumber}...`;
          } else if (statusUpdate.status === 'Extraction Complete') {
            stepMsg = `Extracting fields from ${statusUpdate.invoiceNumber}...`;
          }
          toast.loading(stepMsg, { id: statusUpdate.invoiceId });
        }
      }
    });

    // When a new notification arrives, add it to the global notification store
    socketConnection.on('notification:new', (incomingNotification: Notification) => {
      addNotification(incomingNotification);
      
      const settings = useSettingsStore.getState();
      let shouldAlert = false;
      
      // Do NOT trigger separate toast popups here for invoice pipeline status updates,
      // as they are already handled progressively above using the invoiceId.
      if (incomingNotification.type === 'invoice') {
        return;
      } else if (incomingNotification.type === 'alert') {
        shouldAlert = settings.failureAlerts;
      } else if (incomingNotification.type === 'vendor') {
        shouldAlert = settings.vendorAlerts;
      } else {
        shouldAlert = true; // Default for system notifications
      }

      if (shouldAlert) {
        // Display toast alert
        if (incomingNotification.type === 'alert') {
          toast.error(`${incomingNotification.title}: ${incomingNotification.message}`, { id: incomingNotification._id });
        } else {
          toast.success(`${incomingNotification.title}: ${incomingNotification.message}`, { id: incomingNotification._id });
        }
        
        // Play sound chime if enabled in settings store
        if (settings.soundNotifications) {
          playNotificationSound();
        }
      }
    });

    // Clean up the socket connection when the component unmounts
    return () => {
      socketConnection.disconnect();
    };
  }, [queryClient, addNotification]);

  return socketConnectionRef.current;
}
