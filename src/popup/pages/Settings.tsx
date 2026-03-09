import { useState, useEffect } from 'react';
import type { AppView } from '@/shared/types';
import { getSettings, saveSettings, clearCredentials, type Settings as SettingsType } from '@/shared/storage';
import { api } from '@/shared/api';

interface SettingsProps {
  onNavigate: (view: AppView) => void;
}

export default function Settings({ onNavigate }: SettingsProps) {
  const [settings, setSettings] = useState<SettingsType | null>(null);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const handleToggle = async (key: keyof SettingsType, value: boolean) => {
    if (!settings) return;
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await saveSettings({ [key]: value });
  };

  const handleLogout = async () => {
    await clearCredentials();
    api.clearCache();
    onNavigate({ type: 'login' });
  };

  if (!settings) return null;

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-sm font-bold text-gray-900">Settings</h2>

      <div className="space-y-3">
        <ToggleRow
          label="Desktop notifications"
          description="Get notified when deployments complete or fail"
          checked={settings.notificationsEnabled}
          onChange={(v) => handleToggle('notificationsEnabled', v)}
        />

        <ToggleRow
          label="Git platform integration"
          description="Show deploy buttons on GitHub, GitLab, and Bitbucket"
          checked={settings.gitPlatformIntegration}
          onChange={(v) => handleToggle('gitPlatformIntegration', v)}
        />
      </div>

      <div className="pt-3 border-t border-gray-200">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Poll interval (seconds)
        </label>
        <select
          value={settings.pollIntervalSeconds}
          onChange={async (e) => {
            const val = Number(e.target.value);
            setSettings({ ...settings, pollIntervalSeconds: val });
            await saveSettings({ pollIntervalSeconds: val });
          }}
          className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deployhq-500 bg-white"
        >
          <option value={30}>30 seconds</option>
          <option value={60}>1 minute</option>
          <option value={120}>2 minutes</option>
          <option value={300}>5 minutes</option>
        </select>
      </div>

      <div className="pt-3 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full text-sm text-red-600 hover:text-red-800 font-medium py-2 border border-red-200 hover:border-red-300 rounded-lg transition-colors"
        >
          Disconnect account
        </button>
      </div>

      <p className="text-center text-xs text-gray-400 pt-2">
        DeployHQ Chrome Extension v1.0.0
      </p>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <div className="pt-0.5">
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => onChange(!checked)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            checked ? 'bg-deployhq-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
              checked ? 'translate-x-4' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </label>
  );
}
