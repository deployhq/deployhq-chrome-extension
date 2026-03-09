import type { Credentials } from './types';

const CREDENTIALS_KEY = 'deployhq_credentials';
const SETTINGS_KEY = 'deployhq_settings';

export interface Settings {
  pollIntervalSeconds: number;
  notificationsEnabled: boolean;
  gitPlatformIntegration: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  pollIntervalSeconds: 60,
  notificationsEnabled: true,
  gitPlatformIntegration: true,
};

export async function getCredentials(): Promise<Credentials | null> {
  const result = await chrome.storage.local.get(CREDENTIALS_KEY);
  return result[CREDENTIALS_KEY] ?? null;
}

export async function saveCredentials(credentials: Credentials): Promise<void> {
  await chrome.storage.local.set({ [CREDENTIALS_KEY]: credentials });
}

export async function clearCredentials(): Promise<void> {
  await chrome.storage.local.remove(CREDENTIALS_KEY);
}

export async function getSettings(): Promise<Settings> {
  const result = await chrome.storage.local.get(SETTINGS_KEY);
  return { ...DEFAULT_SETTINGS, ...result[SETTINGS_KEY] };
}

export async function saveSettings(settings: Partial<Settings>): Promise<void> {
  const current = await getSettings();
  await chrome.storage.local.set({
    [SETTINGS_KEY]: { ...current, ...settings },
  });
}
