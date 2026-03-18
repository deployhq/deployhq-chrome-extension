import type {
  Credentials,
  Project,
  Server,
  ServerGroup,
  Deployment,
  CreateDeploymentParams,
  PaginatedResponse,
  ApiError,
} from './types';
import { getCredentials } from './storage';

class DeployHQApi {
  private credentials: Credentials | null = null;

  private async getBaseUrl(): Promise<string> {
    const creds = await this.ensureCredentials();
    return `https://${creds.accountSubdomain}.deployhq.com`;
  }

  private async ensureCredentials(): Promise<Credentials> {
    if (!this.credentials) {
      this.credentials = await getCredentials();
    }
    if (!this.credentials) {
      throw new ApiAuthError('Not authenticated. Please add your API key.');
    }
    return this.credentials;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const creds = await this.ensureCredentials();
    const baseUrl = await this.getBaseUrl();
    const authHeader = btoa(`${creds.email}:${creds.apiKey}`);

    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      credentials: 'omit',
      headers: {
        Authorization: `Basic ${authHeader}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-DeployHQ-Client': `deployhq-chrome-extension/${chrome.runtime.getManifest().version}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new ApiAuthError('Invalid credentials. Check your email and API key.');
      }
      if (response.status === 403) {
        const body = (await response.json()) as ApiError;
        throw new ApiAccessError(body.message ?? 'API access restricted.', body.upgrade_url);
      }
      const text = await response.text();
      let message = `Request failed (${response.status})`;
      try {
        const body = JSON.parse(text) as Record<string, unknown>;
        message = (body.error ?? body.message ?? body.errors ?? message) as string;
        if (typeof message === 'object') message = JSON.stringify(message);
      } catch { /* not JSON */
        message = text || message;
      }
      throw new ApiRequestError(message, response.status);
    }

    return response.json() as Promise<T>;
  }

  clearCache(): void {
    this.credentials = null;
  }

  // Projects
  async listProjects(): Promise<Project[]> {
    return this.request<Project[]>('/projects.json');
  }

  async getProject(permalink: string): Promise<Project> {
    return this.request<Project>(`/projects/${permalink}.json`);
  }

  // Servers
  async listServers(projectPermalink: string): Promise<Server[]> {
    return this.request<Server[]>(`/projects/${projectPermalink}/servers.json`);
  }

  // Server Groups
  async listServerGroups(projectPermalink: string): Promise<ServerGroup[]> {
    return this.request<ServerGroup[]>(`/projects/${projectPermalink}/server_groups.json`);
  }

  // Deployments
  async listDeployments(
    projectPermalink: string,
    page = 1
  ): Promise<PaginatedResponse<Deployment>> {
    const data = await this.request<PaginatedResponse<Deployment> | Deployment[]>(
      `/projects/${projectPermalink}/deployments.json?page=${page}`
    );
    // API may return a flat array or a paginated wrapper
    if (Array.isArray(data)) {
      return {
        pagination: { total: data.length, count: data.length, per_page: data.length, page: 1 },
        records: data,
      };
    }
    return data;
  }

  async getDeployment(projectPermalink: string, identifier: string): Promise<Deployment> {
    return this.request<Deployment>(
      `/projects/${projectPermalink}/deployments/${identifier}.json`
    );
  }

  async createDeployment(
    projectPermalink: string,
    params: CreateDeploymentParams
  ): Promise<Deployment> {
    const body = { deployment: params };
    return this.request<Deployment>(`/projects/${projectPermalink}/deployments.json`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // Repository
  async listBranches(projectPermalink: string): Promise<string[]> {
    const data = await this.request<Record<string, string> | { name: string }[] | string[]>(
      `/projects/${projectPermalink}/repository/branches.json`
    );
    if (Array.isArray(data)) {
      return data.map((b) => (typeof b === 'string' ? b : b.name));
    }
    // API returns { branchName: commitSha, ... }
    return Object.keys(data);
  }

  async getLatestRevision(
    projectPermalink: string,
    branch?: string
  ): Promise<{ ref: string; message: string }> {
    const query = branch ? `?branch=${encodeURIComponent(branch)}` : '';
    return this.request(`/projects/${projectPermalink}/repository/latest_revision.json${query}`);
  }

  // Validate credentials
  async validateCredentials(): Promise<boolean> {
    try {
      await this.listProjects();
      return true;
    } catch {
      return false;
    }
  }
}

export class ApiAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiAuthError';
  }
}

export class ApiAccessError extends Error {
  upgradeUrl?: string;
  constructor(message: string, upgradeUrl?: string) {
    super(message);
    this.name = 'ApiAccessError';
    this.upgradeUrl = upgradeUrl;
  }
}

export class ApiRequestError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
  }
}

export const api = new DeployHQApi();
