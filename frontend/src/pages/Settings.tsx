import { Settings as SettingsIcon, Bell, Palette, Info } from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';
import { cn } from '../lib/utils';

interface ToggleSwitchProps {
  isEnabled: boolean;
  onToggle: () => void;
  switchLabel: string;
  switchDescription: string;
}

function ToggleSwitch({ isEnabled, onToggle, switchLabel, switchDescription }: ToggleSwitchProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-border/40 last:border-0">
      <div>
        <p className="text-white text-sm font-medium">{switchLabel}</p>
        <p className="text-muted text-xs mt-0.5">{switchDescription}</p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none focus:ring-2 focus:ring-accent/50',
          isEnabled ? 'bg-accent' : 'bg-slate-300 dark:bg-border'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out',
            isEnabled ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  );
}

export default function Settings() {
  const {
    invoiceUploadAlerts,
    processingAlerts,
    approvalAlerts,
    failureAlerts,
    vendorAlerts,
    autoRefreshEnabled,
    soundNotifications,
    compactTableView,
    setSetting,
  } = useSettingsStore();

  const settingsSections = [
    {
      sectionTitle: 'Notification Preferences',
      sectionIcon: Bell,
      sectionColor: 'text-accent',
      sectionBgColor: 'bg-accent/10',
      toggleItems: [
        {
          toggleLabel:       'Invoice Upload Alerts',
          toggleDescription: 'Get notified when a new invoice is uploaded',
          isEnabled:         invoiceUploadAlerts,
          onToggle:          () => setSetting('invoiceUploadAlerts', !invoiceUploadAlerts),
        },
        {
          toggleLabel:       'Processing Status Alerts',
          toggleDescription: 'Receive updates at each processing step',
          isEnabled:         processingAlerts,
          onToggle:          () => setSetting('processingAlerts', !processingAlerts),
        },
        {
          toggleLabel:       'Approval Alerts',
          toggleDescription: 'Notify when an invoice is approved',
          isEnabled:         approvalAlerts,
          onToggle:          () => setSetting('approvalAlerts', !approvalAlerts),
        },
        {
          toggleLabel:       'Failure Alerts',
          toggleDescription: 'Notify when an invoice fails processing',
          isEnabled:         failureAlerts,
          onToggle:          () => setSetting('failureAlerts', !failureAlerts),
        },
        {
          toggleLabel:       'Vendor Activity Alerts',
          toggleDescription: 'Notify when vendors are created or updated',
          isEnabled:         vendorAlerts,
          onToggle:          () => setSetting('vendorAlerts', !vendorAlerts),
        },
      ],
    },
    {
      sectionTitle: 'Display Preferences',
      sectionIcon: Palette,
      sectionColor: 'text-purple-400',
      sectionBgColor: 'bg-purple-500/10',
      toggleItems: [
        {
          toggleLabel:       'Auto-Refresh Data',
          toggleDescription: 'Automatically refresh tables and charts every 30 seconds',
          isEnabled:         autoRefreshEnabled,
          onToggle:          () => setSetting('autoRefreshEnabled', !autoRefreshEnabled),
        },
        {
          toggleLabel:       'Sound Notifications',
          toggleDescription: 'Play a sound when new notifications arrive',
          isEnabled:         soundNotifications,
          onToggle:          () => setSetting('soundNotifications', !soundNotifications),
        },
        {
          toggleLabel:       'Compact Table View',
          toggleDescription: 'Show more rows with reduced row height',
          isEnabled:         compactTableView,
          onToggle:          () => setSetting('compactTableView', !compactTableView),
        },
      ],
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
          <SettingsIcon size={20} className="text-accent" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Settings</h2>
          <p className="text-muted text-sm">Configure your AP platform preferences</p>
        </div>
      </div>

      {/* Settings Sections */}
      {settingsSections.map((section) => {
        const SectionIcon = section.sectionIcon;
        return (
          <div key={section.sectionTitle} className="glass-card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', section.sectionBgColor)}>
                <SectionIcon size={16} className={section.sectionColor} />
              </div>
              <h3 className="section-title">{section.sectionTitle}</h3>
            </div>
            <div>
              {section.toggleItems.map((toggleItem) => (
                <ToggleSwitch
                  key={toggleItem.toggleLabel}
                  isEnabled={toggleItem.isEnabled}
                  onToggle={toggleItem.onToggle}
                  switchLabel={toggleItem.toggleLabel}
                  switchDescription={toggleItem.toggleDescription}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* System Info Card */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500/10">
            <Info size={16} className="text-blue-400" />
          </div>
          <h3 className="section-title">System Information</h3>
        </div>
        {[
          { infoLabel: 'Platform',    infoValue: 'Agentic AP Platform'   },
          { infoLabel: 'Version',     infoValue: '1.0.0'                 },
          { infoLabel: 'Backend',     infoValue: 'Node.js + Express.js'  },
          { infoLabel: 'Database',    infoValue: 'MongoDB + Mongoose'    },
          { infoLabel: 'Real-time',   infoValue: 'Socket.IO'             },
          { infoLabel: 'Frontend',    infoValue: 'React + TypeScript'    },
        ].map(({ infoLabel, infoValue }) => (
          <div key={infoLabel} className="flex justify-between text-sm border-b border-border/40 py-3 last:border-0">
            <span className="text-muted">{infoLabel}</span>
            <span className="text-white font-medium">{infoValue}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
