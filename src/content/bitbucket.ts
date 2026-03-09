import { createDeployButton, createConnectButton, findMatchingProject, showToast, openExtensionPopup } from './shared';
import type { Project } from '@/shared/types';

const BUTTON_ID = 'deployhq-bitbucket-btn';
let cachedProject: Project | null = null;
let lastCheckedUrl = '';
let injecting = false;

async function init() {
  const settings = await chrome.storage.local.get('deployhq_settings');
  if (settings.deployhq_settings?.gitPlatformIntegration === false) return;

  const creds = await chrome.storage.local.get('deployhq_credentials');
  if (!creds.deployhq_credentials) return;

  injectButton();

  const observer = new MutationObserver(() => {
    if (!document.getElementById(BUTTON_ID) && !injecting) {
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
  // Source browsing: /workspace/repo/src/...
  const srcMatch = path.match(/^\/([^/]+)\/([^/]+)\/src\//);
  // Repo main page: /workspace/repo or /workspace/repo/
  const repoMatch = !prMatch && !branchMatch && !srcMatch ? path.match(/^\/([^/]+)\/([^/]+)\/?$/) : null;

  if (!prMatch && !branchMatch && !srcMatch && !repoMatch) return;
  if (document.getElementById(BUTTON_ID) || injecting) return;

  injecting = true;

  try {
    const workspace = prMatch?.[1] ?? branchMatch?.[1] ?? srcMatch?.[1] ?? repoMatch?.[1];
    const repo = prMatch?.[2] ?? branchMatch?.[2] ?? srcMatch?.[2] ?? repoMatch?.[2];
    if (!workspace || !repo) return;

    const repoUrl = `bitbucket.org/${workspace}/${repo}`;

    if (lastCheckedUrl !== repoUrl) {
      cachedProject = await findMatchingProject(repoUrl);
      lastCheckedUrl = repoUrl;
    }

    if (document.getElementById(BUTTON_ID)) return;

    let btnElement: HTMLElement;

    if (cachedProject) {
      const project = cachedProject;

      let branch: string | undefined;
      if (branchMatch) {
        branch = branchMatch[3];
      }

      const btn = createDeployButton(() => {
        openExtensionPopup(project.permalink, branch);
        showToast('Opening deploy form...');
      });
      btnElement = btn;
    } else {
      btnElement = await createConnectButton({ platform: 'bitbucket', repoOwner: workspace, repoName: repo });
    }

    if (document.getElementById(BUTTON_ID)) return;

    btnElement.id = BUTTON_ID;

    // Try multiple injection strategies in order of preference
    const strategies: Array<{ selector: string; position: 'prepend' | 'append' | 'before' }> = [
      // PR page header
      { selector: '[data-testid="pr-header-actions"]', position: 'prepend' },
      // Source/content actions bar
      { selector: '[data-testid="content-header-actions"]', position: 'append' },
      // Clone button area
      { selector: '[data-testid="clone-button"]', position: 'before' },
      // Breadcrumb header
      { selector: '[data-testid="repo-header"]', position: 'append' },
      // File browser header row
      { selector: '[data-testid="file-tree-header"]', position: 'prepend' },
      // Any action bar in the content area
      { selector: '[data-testid="content-header"] > div', position: 'append' },
      // Bitbucket navigation bar
      { selector: 'nav[aria-label="Repository navigation"]', position: 'append' },
      // Generic header within main
      { selector: '[role="main"] header', position: 'append' },
      // Last resort: top of main content
      { selector: '[role="main"]', position: 'prepend' },
    ];

    for (const { selector, position } of strategies) {
      const target = document.querySelector(selector);
      if (!target) continue;

      btnElement.style.margin = '8px';
      if (position === 'prepend') {
        target.prepend(btnElement);
      } else if (position === 'append') {
        target.appendChild(btnElement);
      } else if (position === 'before' && target.parentElement) {
        target.parentElement.insertBefore(btnElement, target);
      }
      return;
    }
  } finally {
    injecting = false;
  }
}

init();
