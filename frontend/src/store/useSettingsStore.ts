import { create } from 'zustand';

interface SettingsState {
  invoiceUploadAlerts: boolean;
  processingAlerts: boolean;
  approvalAlerts: boolean;
  failureAlerts: boolean;
  vendorAlerts: boolean;
  autoRefreshEnabled: boolean;
  soundNotifications: boolean;
  compactTableView: boolean;
  
  setSetting: (key: keyof Omit<SettingsState, 'setSetting'>, value: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => {
  // Load from localStorage with defaults
  const getStored = (key: string, defaultValue: boolean): boolean => {
    const stored = localStorage.getItem(`setting_${key}`);
    return stored !== null ? stored === 'true' : defaultValue;
  };

  return {
    invoiceUploadAlerts: getStored('invoiceUploadAlerts', true),
    processingAlerts: getStored('processingAlerts', true),
    approvalAlerts: getStored('approvalAlerts', true),
    failureAlerts: getStored('failureAlerts', true),
    vendorAlerts: getStored('vendorAlerts', false),
    autoRefreshEnabled: getStored('autoRefreshEnabled', true),
    soundNotifications: getStored('soundNotifications', false),
    compactTableView: getStored('compactTableView', false),

    setSetting: (key, value) => {
      localStorage.setItem(`setting_${key}`, String(value));
      set({ [key]: value } as any);
    },
  };
});
