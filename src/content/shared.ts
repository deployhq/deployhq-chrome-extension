import type { Project } from '@/shared/types';

// Inject styles programmatically (avoids @crxjs/vite-plugin CSS manifest bug)
const STYLES = `
.deployhq-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #fff;
  background-color: #006fc7;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 6px;
  cursor: pointer;
  line-height: 20px;
  white-space: nowrap;
  transition: background-color 0.15s;
}
.deployhq-btn:hover {
  background-color: #0059a1;
}
.deployhq-btn svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}
.deployhq-toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 12px 16px;
  background: #1f2937;
  color: #fff;
  border-radius: 8px;
  font-size: 13px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  z-index: 99999;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: deployhq-slide-in 0.3s ease-out;
}
.deployhq-toast--success {
  background: #059669;
}
.deployhq-toast--error {
  background: #dc2626;
}
@keyframes deployhq-slide-in {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
`;

function injectStyles() {
  if (document.getElementById('deployhq-injected-styles')) return;
  const style = document.createElement('style');
  style.id = 'deployhq-injected-styles';
  style.textContent = STYLES;
  document.head.appendChild(style);
}

injectStyles();

const DEPLOY_ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/></svg>`;

export function createDeployButton(onClick: () => void): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.className = 'deployhq-btn';
  btn.innerHTML = `${DEPLOY_ICON_SVG} Deploy with DeployHQ`;
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  });
  return btn;
}

export function showToast(message: string, type: 'success' | 'error' = 'success') {
  // Remove existing toasts
  document.querySelectorAll('.deployhq-toast').forEach((el) => el.remove());

  const toast = document.createElement('div');
  toast.className = `deployhq-toast deployhq-toast--${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 4000);
}

export function normalizeRepoUrl(url: string): string {
  return url
    .replace(/^https?:\/\//, '')
    .replace(/^git@/, '')
    .replace(/\.git$/, '')
    .replace('github.com:', 'github.com/')
    .replace('gitlab.com:', 'gitlab.com/')
    .replace('bitbucket.org:', 'bitbucket.org/')
    .toLowerCase()
    .replace(/\/$/, '');
}

export async function findMatchingProject(repoUrl: string): Promise<Project | null> {
  try {
    const normalizedTarget = normalizeRepoUrl(repoUrl);

    // Get credentials from storage
    const result = await chrome.storage.local.get('deployhq_credentials');
    const creds = result.deployhq_credentials;
    if (!creds) return null;

    // Fetch projects directly (content scripts can't use the api module's state)
    const response = await fetch(`https://${creds.accountSubdomain}.deployhq.com/projects.json`, {
      headers: {
        Authorization: `Basic ${btoa(`${creds.email}:${creds.apiKey}`)}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) return null;
    const projects = (await response.json()) as Project[];

    return projects.find((p) => {
      if (!p.repository?.url) return false;
      return normalizeRepoUrl(p.repository.url) === normalizedTarget;
    }) ?? null;
  } catch {
    return null;
  }
}

export function openExtensionPopup(permalink: string, branch?: string, revision?: string) {
  // Send message to background to open popup with deploy form
  chrome.runtime.sendMessage({
    type: 'OPEN_DEPLOY',
    permalink,
    branch,
    revision,
  });

  // Store deploy intent so popup can read it
  chrome.storage.local.set({
    deployhq_deploy_intent: {
      permalink,
      branch,
      revision,
      timestamp: Date.now(),
    },
  });
}
