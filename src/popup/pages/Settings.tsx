import { useState, useEffect } from 'react';
import type { AppView } from '@/shared/types';
import { getSettings, saveSettings, clearCredentials, type Settings as SettingsType, type ThemePreference } from '@/shared/storage';
import { api } from '@/shared/api';

interface SettingsProps {
  onNavigate: (view: AppView) => void;
  theme: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
}

export default function Settings({ onNavigate, theme, onThemeChange }: SettingsProps) {
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
      <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Settings</h2>

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

      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          Theme
        </label>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {(['light', 'system', 'dark'] as const).map((option) => (
            <button
              key={option}
              onClick={() => onThemeChange(option)}
              className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-colors ${
                theme === option
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {option === 'light' && 'Light'}
              {option === 'dark' && 'Dark'}
              {option === 'system' && 'System'}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          Poll interval (seconds)
        </label>
        <select
          value={settings.pollIntervalSeconds}
          onChange={async (e) => {
            const val = Number(e.target.value);
            setSettings({ ...settings, pollIntervalSeconds: val });
            await saveSettings({ pollIntervalSeconds: val });
          }}
          className="w-full text-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-deployhq-500 bg-white dark:bg-gray-800 dark:text-gray-100"
        >
          <option value={30}>30 seconds</option>
          <option value={60}>1 minute</option>
          <option value={120}>2 minutes</option>
          <option value={300}>5 minutes</option>
        </select>
      </div>

      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium py-2 border border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700 rounded-lg transition-colors"
        >
          Disconnect account
        </button>
      </div>

      <p className="text-center text-xs text-gray-400 dark:text-gray-500 pt-2">
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
            checked ? 'bg-deployhq-600' : 'bg-gray-300 dark:bg-gray-600'
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
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      </div>
    </label>
  );
}
