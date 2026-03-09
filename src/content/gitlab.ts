import { createDeployButton, findMatchingProject, showToast, openExtensionPopup } from './shared';
import type { Project } from '@/shared/types';

const BUTTON_ID = 'deployhq-gitlab-btn';
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

  // MR page: /group/project/-/merge_requests/123
  const mrMatch = path.match(/^\/(.+?)\/-\/merge_requests\/(\d+)/);
  // Branch page: /group/project/-/tree/branch
  const branchMatch = path.match(/^\/(.+?)\/-\/tree\/(.+)/);

  if (!mrMatch && !branchMatch) return;
  if (document.getElementById(BUTTON_ID)) return;

  const projectPath = mrMatch?.[1] ?? branchMatch?.[1];
  if (!projectPath) return;

  const repoUrl = `gitlab.com/${projectPath}`;

  if (lastCheckedUrl !== repoUrl) {
    cachedProject = await findMatchingProject(repoUrl);
    lastCheckedUrl = repoUrl;
  }

  if (!cachedProject) return;
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
  btn.id = BUTTON_ID;

  // GitLab MR page - inject in header actions
  if (mrMatch) {
    const header = document.querySelector('.detail-page-header-actions, .merge-request-details .gl-display-flex');
    if (header) {
      header.prepend(btn);
      return;
    }
  }

  // Branch page - inject near actions
  const treeControls = document.querySelector('.tree-controls, .repo-breadcrumb');
  if (treeControls) {
    treeControls.appendChild(btn);
  }
}

init();
