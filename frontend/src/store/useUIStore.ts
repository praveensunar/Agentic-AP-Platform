import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  notificationDrawerOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  toggleNotificationDrawer: () => void;
  setNotificationDrawerOpen: (isOpen: boolean) => void;
}

export const useUIStore = create<UIState>((setState) => ({
  sidebarOpen: true,
  notificationDrawerOpen: false,

  toggleSidebar: () =>
    setState((currentState) => ({ sidebarOpen: !currentState.sidebarOpen })),

  setSidebarOpen: (isOpen) =>
    setState({ sidebarOpen: isOpen }),

  toggleNotificationDrawer: () =>
    setState((currentState) => ({
      notificationDrawerOpen: !currentState.notificationDrawerOpen,
    })),

  setNotificationDrawerOpen: (isOpen) =>
    setState({ notificationDrawerOpen: isOpen }),
}));
