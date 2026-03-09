import { createDeployButton, createConnectButton, findMatchingProject, showToast, openExtensionPopup } from './shared';
import type { Project } from '@/shared/types';

const BUTTON_ID = 'deployhq-gitlab-btn';
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

  // MR page: /group/project/-/merge_requests/123
  const mrMatch = path.match(/^\/(.+?)\/-\/merge_requests\/(\d+)/);
  // Branch page: /group/project/-/tree/branch
  const branchMatch = path.match(/^\/(.+?)\/-\/tree\/(.+)/);
  // Repo main page: /group/project (no /- segment)
  const repoMatch = !mrMatch && !branchMatch ? path.match(/^\/([^-][^\s]*?)(?:\/-)?$/) : null;

  if (!mrMatch && !branchMatch && !repoMatch) return;
  if (document.getElementById(BUTTON_ID) || injecting) return;

  injecting = true;

  try {
    const projectPath = mrMatch?.[1] ?? branchMatch?.[1] ?? repoMatch?.[1];
    if (!projectPath) return;

    // Filter out non-project paths (settings, explore, etc.)
    if (projectPath.split('/').length < 2) return;

    const pathParts = projectPath.split('/');
    const repoName = pathParts[pathParts.length - 1];
    const repoOwner = pathParts.slice(0, -1).join('/');
    const repoUrl = `gitlab.com/${projectPath}`;

    if (lastCheckedUrl !== repoUrl) {
      cachedProject = await findMatchingProject(repoUrl);
      lastCheckedUrl = repoUrl;
    }

    if (document.getElementById(BUTTON_ID)) return;

    let btnElement: HTMLElement;

    if (cachedProject) {
      const project = cachedProject;

      let branch: string | undefined;
      if (mrMatch) {
        const branchEl = document.querySelector('.ref-container .ref-name');
        branch = branchEl?.textContent?.trim();
      } else if (branchMatch) {
        branch = branchMatch[2];
      }

      const btn = createDeployButton(() => {
        openExtensionPopup(project.permalink, branch);
        showToast('Opening deploy form...');
      });
      btnElement = btn;
    } else {
      btnElement = await createConnectButton({ platform: 'gitlab', repoOwner, repoName });
    }

    if (document.getElementById(BUTTON_ID)) return;

    btnElement.id = BUTTON_ID;

    // GitLab MR page - inject in header actions
    if (mrMatch) {
      const header = document.querySelector('.detail-page-header-actions, .merge-request-details .gl-display-flex');
      if (header) {
        header.prepend(btnElement);
        return;
      }
    }

    // Branch/tree page - inject near actions
    const treeControls = document.querySelector('.tree-controls');
    if (treeControls) {
      treeControls.appendChild(btnElement);
      return;
    }

    // Repo page - inject before the file list area
    const lastCommit = document.querySelector('.project-last-commit, [data-testid="last-commit"]');
    if (lastCommit) {
      btnElement.style.margin = '0 0 12px 0';
      lastCommit.parentElement?.insertBefore(btnElement, lastCommit);
      return;
    }

    // Fallback - inject after the repo header
    const repoHeader = document.querySelector('.project-repo-buttons, .file-holder, .blob-content-holder');
    if (repoHeader) {
      btnElement.style.margin = '8px 0';
      repoHeader.parentElement?.insertBefore(btnElement, repoHeader);
    }
  } finally {
    injecting = false;
  }
}

init();
