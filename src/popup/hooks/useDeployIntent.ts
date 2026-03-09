import { useEffect } from 'react';
import type { AppView } from '@/shared/types';

/**
 * Check if a deploy was triggered from a content script (GitHub/GitLab/Bitbucket).
 * If so, navigate directly to the deploy form.
 */
export function useDeployIntent(onNavigate: (view: AppView) => void) {
  useEffect(() => {
    chrome.storage.local.get('deployhq_deploy_intent').then((result) => {
      const intent = result.deployhq_deploy_intent;
      if (!intent) return;

      // Only use intent if it's less than 30 seconds old
      if (Date.now() - intent.timestamp > 30000) {
        chrome.storage.local.remove('deployhq_deploy_intent');
        return;
      }

      chrome.storage.local.remove('deployhq_deploy_intent');
      onNavigate({
        type: 'deploy',
        permalink: intent.permalink,
        branch: intent.branch,
        revision: intent.revision,
      });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
