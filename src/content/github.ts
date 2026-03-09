import { createDeployButton, findMatchingProject, showToast, openExtensionPopup } from './shared';
import type { Project } from '@/shared/types';

const BUTTON_ID = 'deployhq-github-btn';
let cachedProject: Project | null = null;
let lastCheckedUrl = '';

async function init() {
  // Check if integration is enabled
  const settings = await chrome.storage.local.get('deployhq_settings');
  if (settings.deployhq_settings?.gitPlatformIntegration === false) return;

  // Check if we have credentials
  const creds = await chrome.storage.local.get('deployhq_credentials');
  if (!creds.deployhq_credentials) return;

  injectButton();

  // Re-inject on navigation (GitHub uses SPA)
  const observer = new MutationObserver(() => {
    if (!document.getElementById(BUTTON_ID)) {
      injectButton();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

async function injectButton() {
  // Only inject on relevant pages
  const path = window.location.pathname;

  // PR page: /owner/repo/pull/123
  const prMatch = path.match(/^\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  // Branch page: /owner/repo/tree/branch
  const branchMatch = path.match(/^\/([^/]+)\/([^/]+)\/tree\/(.+)/);
  // Main repo page: /owner/repo
  const repoMatch = path.match(/^\/([^/]+)\/([^/]+)\/?$/);

  if (!prMatch && !branchMatch && !repoMatch) return;

  // Don't duplicate
  if (document.getElementById(BUTTON_ID)) return;

  const repoUrl = `github.com/${prMatch?.[1] ?? branchMatch?.[1] ?? repoMatch?.[1]}/${prMatch?.[2] ?? branchMatch?.[2] ?? repoMatch?.[2]}`;

  // Cache project lookup per repo
  if (lastCheckedUrl !== repoUrl) {
    cachedProject = await findMatchingProject(repoUrl);
    lastCheckedUrl = repoUrl;
  }

  if (!cachedProject) return;

  const project = cachedProject;

  // Determine branch context
  let branch: string | undefined;
  if (prMatch) {
    // Try to get branch from PR page
    const branchEl = document.querySelector('.head-ref a, .head-ref span');
    branch = branchEl?.textContent?.trim();
  } else if (branchMatch) {
    branch = branchMatch[3];
  }

  const btn = createDeployButton(() => {
    openExtensionPopup(project.permalink, branch);
    showToast('Opening deploy form...');
  });
  btn.id = BUTTON_ID;

  // Find injection point
  if (prMatch) {
    // PR page - inject in the PR header actions area
    const actionsContainer =
      document.querySelector('.gh-header-actions') ??
      document.querySelector('[class*="header-actions"]');
    if (actionsContainer) {
      actionsContainer.prepend(btn);
      return;
    }
  }

  // Repo/branch page - inject near the "Code" button
  const codeButton =
    document.querySelector('[data-hotkey=".,t"]')?.parentElement ??
    document.querySelector('.file-navigation') ??
    document.querySelector('[class*="file-navigation"]');

  if (codeButton?.parentElement) {
    codeButton.parentElement.insertBefore(btn, codeButton.nextSibling);
  }
}

init();
