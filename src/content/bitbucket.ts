import { createDeployButton, findMatchingProject, showToast, openExtensionPopup } from './shared';
import type { Project } from '@/shared/types';

const BUTTON_ID = 'deployhq-bitbucket-btn';
let cachedProject: Project | null = null;
let lastCheckedUrl = '';

async function init() {
  const settings = await chrome.storage.local.get('deployhq_settings');
  if (settings.deployhq_settings?.gitPlatformIntegration === false) return;

  const creds = await chrome.storage.local.get('deployhq_credentials');
  if (!creds.deployhq_credentials) return;

  injectButton();

  const observer = new MutationObserver(() => {
    if (!document.getElementById(BUTTON_ID)) {
      injectButton();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

async function injectButton() {
  const path = window.location.pathname;

  // PR page: /workspace/repo/pull-requests/123
  const prMatch = path.match(/^\/([^/]+)\/([^/]+)\/pull-requests\/(\d+)/);
  // Branch page: /workspace/repo/branch/branchname
  const branchMatch = path.match(/^\/([^/]+)\/([^/]+)\/branch\/(.+)/);

  if (!prMatch && !branchMatch) return;
  if (document.getElementById(BUTTON_ID)) return;

  const workspace = prMatch?.[1] ?? branchMatch?.[1];
  const repo = prMatch?.[2] ?? branchMatch?.[2];
  if (!workspace || !repo) return;

  const repoUrl = `bitbucket.org/${workspace}/${repo}`;

  if (lastCheckedUrl !== repoUrl) {
    cachedProject = await findMatchingProject(repoUrl);
    lastCheckedUrl = repoUrl;
  }

  if (!cachedProject) return;
  const project = cachedProject;

  let branch: string | undefined;
  if (branchMatch) {
    branch = branchMatch[3];
  }

  const btn = createDeployButton(() => {
    openExtensionPopup(project.permalink, branch);
    showToast('Opening deploy form...');
  });
  btn.id = BUTTON_ID;

  // Bitbucket PR page
  if (prMatch) {
    const header = document.querySelector('[data-testid="pr-header-actions"]');
    if (header) {
      header.prepend(btn);
      return;
    }
  }

  // Branch page - inject near source actions
  const sourceActions = document.querySelector('[data-testid="content-header-actions"]');
  if (sourceActions) {
    sourceActions.appendChild(btn);
  }
}

init();
