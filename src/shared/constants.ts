export const POLL_ALARM_NAME = 'deployhq-poll';
export const DEFAULT_POLL_INTERVAL_MINUTES = 1;

export const DEPLOYHQ_DASHBOARD_URL = 'https://www.deployhq.com/app';

export const STATUS_COLORS = {
  completed: '#22c55e',
  failed: '#ef4444',
  running: '#3b82f6',
  pending: '#f59e0b',
  cancelled: '#6b7280',
  preview_pending: '#8b5cf6',
} as const;

export const STATUS_LABELS = {
  completed: 'Completed',
  failed: 'Failed',
  running: 'Running',
  pending: 'Pending',
  cancelled: 'Cancelled',
  preview_pending: 'Preview',
} as const;

export const PROTOCOL_LABELS: Record<string, string> = {
  ssh: 'SSH/SFTP',
  ftp: 'FTP',
  ftps: 'FTPS',
  s3: 'Amazon S3',
  rackspace: 'Rackspace',
  s3_compatible: 'S3 Compatible',
  shopify: 'Shopify',
  digital_ocean: 'DigitalOcean',
  shell: 'Shell',
  netlify: 'Netlify',
  heroku: 'Heroku',
  elastic_beanstalk: 'AWS EB',
};

export const EVENT_LABELS: Record<string, string> = {
  deploy_completed: 'Deploy Completed',
  deploy_failed: 'Deploy Failed',
  deploy_started: 'Deploy Started',
  deploy_running: 'Deploy Running',
  deploy_pending: 'Deploy Pending',
  deploy_queued: 'Deploy Queued',
  deploy_cancelled: 'Deploy Cancelled',
};

