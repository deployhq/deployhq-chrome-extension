import type { Project } from '@/shared/types';

// Inject styles programmatically (avoids @crxjs/vite-plugin CSS manifest bug)
const STYLES = `
.deployhq-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 12px;
  font-size: 12px;
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #fff;
  background-color: #5740cf;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 6px;
  cursor: pointer;
  line-height: 20px;
  white-space: nowrap;
  transition: background-color 0.15s;
  text-decoration: none;
}
.deployhq-btn:hover {
  background-color: #4f3fa2;
}
.deployhq-btn--secondary {
  background-color: transparent;
  color: #5740cf;
  border: 1px solid #5740cf;
}
.deployhq-btn--secondary:hover {
  background-color: #f3f1ff;
}
.deployhq-btn svg {
  width: 16px;
  height: 16px;
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

const LINK_ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>`;

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

export interface ConnectButtonOptions {
  platform?: 'github' | 'gitlab' | 'bitbucket';
  repoOwner?: string;
  repoName?: string;
}

export async function createConnectButton(options?: ConnectButtonOptions): Promise<HTMLAnchorElement> {
  const creds = await chrome.storage.local.get('deployhq_credentials');
  const subdomain = creds.deployhq_credentials?.accountSubdomain ?? 'app';
  const link = document.createElement('a');
  link.className = 'deployhq-btn deployhq-btn--secondary';
  link.innerHTML = `${LINK_ICON_SVG} Connect to DeployHQ`;

  const url = new URL(`https://${subdomain}.deployhq.com/projects/new`);
  if (options?.repoName) {
    url.searchParams.set('name', options.repoName);
  }
  if (options?.platform) {
    url.searchParams.set('scm', options.platform);
  }
  if (options?.repoOwner && options?.repoName) {
    url.searchParams.set('repo', `${options.repoOwner}/${options.repoName}`);
  }

  link.href = url.toString();
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  return link;
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
    const response = await chrome.runtime.sendMessage({ type: 'FIND_PROJECT', repoUrl });
    return response?.project ?? null;
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
