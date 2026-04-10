import { api } from '@/shared/api';
import { getCredentials, getSettings } from '@/shared/storage';
import { POLL_ALARM_NAME, STATUS_COLORS } from '@/shared/constants';
import type { DeploymentStatus } from '@/shared/types';

// Track deployment states to detect changes
const lastKnownStatuses: Record<string, DeploymentStatus> = {};

// Setup polling alarm on install
chrome.runtime.onInstalled.addListener(() => {
  setupPolling();
});

// Re-setup on startup
chrome.runtime.onStartup.addListener(() => {
  setupPolling();
});

// Handle alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === POLL_ALARM_NAME) {
    pollDeployments();
  }
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'POLL_NOW') {
    pollDeployments().then(() => sendResponse({ ok: true }));
    return true;
  }
  if (message.type === 'REFRESH_SETTINGS') {
    setupPolling();
    sendResponse({ ok: true });
  }
  if (message.type === 'FIND_PROJECT') {
    findProjectForRepo(message.repoUrl).then((project) => sendResponse({ project }));
    return true;
  }
  if (message.type === 'OPEN_DEPLOY') {
    const popupUrl = chrome.runtime.getURL('popup.html');
    chrome.windows.create({
      url: popupUrl,
      type: 'popup',
      width: 400,
      height: 550,
    });
    sendResponse({ ok: true });
  }
});

async function setupPolling() {
  const creds = await getCredentials();
  if (!creds) {
    chrome.alarms.clear(POLL_ALARM_NAME);
    updateBadge('disconnected');
    return;
  }

  const settings = await getSettings();
  const intervalMinutes = Math.max(settings.pollIntervalSeconds / 60, 0.5); // Min 30s

  chrome.alarms.create(POLL_ALARM_NAME, {
    periodInMinutes: intervalMinutes,
  });

  // Initial poll
  pollDeployments();
}

async function pollDeployments() {
  const creds = await getCredentials();
  if (!creds) {
    updateBadge('disconnected');
    return;
  }

  try {
    const projects = await api.listProjects();

    let hasRunning = false;
    let hasFailed = false;

    // Check latest deployment for each project (just first 10 projects to limit API calls)
    const projectsToCheck = projects.slice(0, 10);

    for (const project of projectsToCheck) {
      try {
        const deps = await api.listDeployments(project.permalink, 1);
        if (deps.records.length === 0) continue;

        const latest = deps.records[0];
        const key = `${project.permalink}:${latest.identifier}`;
        const previousStatus = lastKnownStatuses[key];

        if (latest.status === 'running' || latest.status === 'pending') {
          hasRunning = true;
        }
        if (latest.status === 'failed') {
          hasFailed = true;
        }

        // Notify on status change, or on first sight of a terminal status
        if (previousStatus !== latest.status) {
          if (previousStatus || latest.status === 'completed' || latest.status === 'failed') {
            await notifyStatusChange(project.name, latest.status);
          }
        }

        lastKnownStatuses[key] = latest.status;
      } catch {
        // Skip individual project errors
      }
    }

    // Update badge based on aggregate status
    if (hasRunning) {
      updateBadge('running');
    } else if (hasFailed) {
      updateBadge('failed');
    } else {
      // Show green checkmark briefly then clear
      updateBadge('completed');
      setTimeout(() => updateBadge('ok'), 5000);
    }
  } catch {
    updateBadge('error');
  }
}

function updateBadge(state: 'ok' | 'running' | 'failed' | 'error' | 'disconnected' | 'completed') {
  switch (state) {
    case 'running':
      chrome.action.setBadgeText({ text: '▶' });
      chrome.action.setBadgeBackgroundColor({ color: STATUS_COLORS.running });
      break;
    case 'completed':
      chrome.action.setBadgeText({ text: '✓' });
      chrome.action.setBadgeBackgroundColor({ color: STATUS_COLORS.completed });
      break;
    case 'failed':
      chrome.action.setBadgeText({ text: '!' });
      chrome.action.setBadgeBackgroundColor({ color: STATUS_COLORS.failed });
      break;
    case 'error':
      chrome.action.setBadgeText({ text: '?' });
      chrome.action.setBadgeBackgroundColor({ color: '#6b7280' });
      break;
    case 'disconnected':
      chrome.action.setBadgeText({ text: '' });
      break;
    case 'ok':
    default:
      chrome.action.setBadgeText({ text: '' });
      break;
  }
}

async function findProjectForRepo(repoUrl: string) {
  try {
    const projects = await api.listProjects();
    const normalizedTarget = repoUrl
      .replace(/^https?:\/\//, '')
      .replace(/^git@/, '')
      .replace(/\.git$/, '')
      .replace('github.com:', 'github.com/')
      .replace('gitlab.com:', 'gitlab.com/')
      .replace('bitbucket.org:', 'bitbucket.org/')
      .toLowerCase()
      .replace(/\/$/, '');

    return projects.find((p) => {
      if (!p.repository?.url) return false;
      const normalized = p.repository.url
        .replace(/^https?:\/\//, '')
        .replace(/^git@/, '')
        .replace(/\.git$/, '')
        .replace('github.com:', 'github.com/')
        .replace('gitlab.com:', 'gitlab.com/')
        .replace('bitbucket.org:', 'bitbucket.org/')
        .toLowerCase()
        .replace(/\/$/, '');
      return normalized === normalizedTarget;
    }) ?? null;
  } catch {
    return null;
  }
}

async function notifyStatusChange(
  projectName: string,
  status: DeploymentStatus
) {
  const settings = await getSettings();
  if (!settings.notificationsEnabled) return;

  const titles: Record<string, string> = {
    completed: 'Deployment Completed',
    failed: 'Deployment Failed',
    running: 'Deployment Started',
  };

  const title = titles[status];
  if (!title) return;

  chrome.notifications.create({
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icons/icon-128.png'),
    title,
    message: `${projectName} - deployment ${status}`,
  });
}
