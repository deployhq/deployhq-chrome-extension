import { createDeployButton, createConnectButton, findMatchingProject, showToast, openExtensionPopup } from './shared';
import type { Project } from '@/shared/types';

const BUTTON_ID = 'deployhq-github-btn';
let cachedProject: Project | null = null;
let lastCheckedUrl = '';
let injecting = false;

async function init() {
  const settings = await chrome.storage.local.get('deployhq_settings');
  if (settings.deployhq_settings?.gitPlatformIntegration === false) return;

  const creds = await chrome.storage.local.get('deployhq_credentials');
  if (!creds.deployhq_credentials) return;

  injectButton();

  // Re-inject on SPA navigation (GitHub uses Turbo)
  const observer = new MutationObserver(() => {
    if (!document.getElementById(BUTTON_ID) && !injecting) {
      injectButton();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

async function injectButton() {
  const path = window.location.pathname;

  const prMatch = path.match(/^\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  const branchMatch = path.match(/^\/([^/]+)\/([^/]+)\/tree\/(.+)/);
  const repoMatch = path.match(/^\/([^/]+)\/([^/]+)\/?$/);

  if (!prMatch && !branchMatch && !repoMatch) return;
  if (document.getElementById(BUTTON_ID) || injecting) return;

  injecting = true;

  try {
    const repoOwner = prMatch?.[1] ?? branchMatch?.[1] ?? repoMatch?.[1] ?? '';
    const repoName = prMatch?.[2] ?? branchMatch?.[2] ?? repoMatch?.[2] ?? '';
    const repoUrl = `github.com/${repoOwner}/${repoName}`;

    if (lastCheckedUrl !== repoUrl) {
      cachedProject = await findMatchingProject(repoUrl);
      lastCheckedUrl = repoUrl;
    }

    // Double-check after async work
    if (document.getElementById(BUTTON_ID)) return;

    let btnElement: HTMLElement;

    if (cachedProject) {
      const project = cachedProject;
      let branch: string | undefined;
      if (prMatch) {
        const branchEl = document.querySelector('.head-ref a, .head-ref span');
        branch = branchEl?.textContent?.trim();
      } else if (branchMatch) {
        branch = branchMatch[3];
      }

      btnElement = createDeployButton(() => {
        openExtensionPopup(project.permalink, branch);
        showToast('Opening deploy form...');
      });
    } else {
      btnElement = await createConnectButton({ platform: 'github', repoOwner, repoName });
    }

    // Final duplicate check before inserting
    if (document.getElementById(BUTTON_ID)) return;

    btnElement.id = BUTTON_ID;

    // PR page
    if (prMatch) {
      const actionsContainer =
        document.querySelector('.gh-header-actions') ??
        document.querySelector('[class*="header-actions"]');
      if (actionsContainer) {
        actionsContainer.prepend(btnElement);
        return;
      }
    }

    // Repo/branch page - inject in the header actions row
    const repoHeaderActions = document.querySelector('.pagehead-actions');
    if (repoHeaderActions) {
      const li = document.createElement('li');
      li.appendChild(btnElement);
      repoHeaderActions.prepend(li);
      return;
    }

    // Fallback: before file list
    const repoContent =
      document.querySelector('.repository-content') ??
      document.querySelector('[data-turbo-frame="repo-content-turbo-frame"]');

    if (repoContent) {
      btnElement.style.margin = '8px 16px';
      repoContent.prepend(btnElement);
    }
  } finally {
    injecting = false;
  }
}

init();
