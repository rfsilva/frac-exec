/**
 * Octane REST API client
 * Usa apenas a API REST oficial do ALM Octane.
 * Autenticação via cookie de sessão (padrão do Octane).
 */

import fetch from 'node-fetch';

export class OctaneClient {
  constructor(config) {
    this.baseUrl   = config.url.replace(/\/$/, '');
    this.ssId      = config.sharedSpaceId;
    this.wsId      = config.workspaceId;
    this.username  = config.username;
    this.password  = config.password;
    this.cookie    = null;
  }

  get apiBase() {
    return `${this.baseUrl}/api/shared_spaces/${this.ssId}/workspaces/${this.wsId}`;
  }

  // ── Autenticação ────────────────────────────────────────────────────────────

  async authenticate() {
    const resp = await fetch(`${this.baseUrl}/authentication/sign_in`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ user: this.username, password: this.password }),
    });

    if (!resp.ok) {
      throw new Error(`Octane auth failed: ${resp.status} ${resp.statusText}`);
    }

    const setCookie = resp.headers.get('set-cookie');
    if (!setCookie) throw new Error('Octane auth: no session cookie returned');

    // Octane retorna OCTANE_USER e LWSSO_COOKIE_KEY no mesmo header, separados por ", "
    // Cada segmento tem a forma: NAME=VALUE; atributos
    // Precisamos de ambos os valores para autenticar chamadas subsequentes.
    this.cookie = setCookie
      .split(/,\s*(?=[A-Z_]+=)/)   // divide só onde começa um novo cookie (NOME=)
      .map(seg => seg.split(';')[0].trim())
      .join('; ');
    return true;
  }

  async ensureAuth() {
    if (!this.cookie) await this.authenticate();
  }

  // ── HTTP helpers ────────────────────────────────────────────────────────────

  async get(path, params = {}) {
    await this.ensureAuth();
    const qs = new URLSearchParams(params).toString();
    const url = `${this.apiBase}${path}${qs ? '?' + qs : ''}`;

    const resp = await fetch(url, {
      headers: { Cookie: this.cookie, Accept: 'application/json' },
    });

    if (resp.status === 401) {
      // Sessão expirou — re-autentica e tenta uma vez mais
      this.cookie = null;
      await this.authenticate();
      return this.get(path, params);
    }

    const data = await resp.json();
    if (!resp.ok) throw new Error(data.description || JSON.stringify(data));
    return data;
  }

  async post(path, body) {
    await this.ensureAuth();
    const resp = await fetch(`${this.apiBase}${path}`, {
      method:  'POST',
      headers: {
        Cookie:         this.cookie,
        'Content-Type': 'application/json',
        Accept:         'application/json',
      },
      body: JSON.stringify({ data: Array.isArray(body) ? body : [body] }),
    });

    if (resp.status === 401) {
      this.cookie = null;
      await this.authenticate();
      return this.post(path, body);
    }

    const data = await resp.json();
    if (!resp.ok) {
      const err = data.errors?.[0]?.description || data.description || JSON.stringify(data);
      throw new Error(err);
    }
    return data;
  }

  async patch(path, body) {
    await this.ensureAuth();
    const resp = await fetch(`${this.apiBase}${path}`, {
      method:  'PATCH',
      headers: {
        Cookie:         this.cookie,
        'Content-Type': 'application/json',
        Accept:         'application/json',
      },
      body: JSON.stringify({ data: Array.isArray(body) ? body : [body] }),
    });

    if (resp.status === 401) {
      this.cookie = null;
      await this.authenticate();
      return this.patch(path, body);
    }

    const data = await resp.json();
    if (!resp.ok) {
      const err = data.errors?.[0]?.description || data.description || JSON.stringify(data);
      throw new Error(err);
    }
    return data;
  }

  // ── Entidades ───────────────────────────────────────────────────────────────

  async listEpics(query, limit = 50) {
    const params = { limit, fields: 'id,name,description' };
    if (query) params.query = `"name='*${query}*'"`;
    return this.get('/epics', params);
  }

  async getEpic(id) {
    return this.get(`/epics/${id}`);
  }

  async listFeatures(query, limit = 50) {
    const params = { limit, fields: 'id,name,description,parent' };
    if (query) params.query = `"name='*${query}*'"`;
    return this.get('/features', params);
  }

  async getFeature(id) {
    return this.get(`/features/${id}`, { fields: 'id,name,description,parent' });
  }

  async listStories(query, limit = 50) {
    const params = { limit, fields: 'id,name,description,parent,phase,story_points' };
    if (query) params.query = `"name='*${query}*'"`;
    return this.get('/stories', params);
  }

  async getStory(id) {
    return this.get(`/stories/${id}`, { fields: 'id,name,description,parent,phase,story_points' });
  }

  async updateStory(id, fields) {
    // Busca version_stamp atual para evitar conflito de concorrência
    const current = await this.get(`/stories/${id}`, { fields: 'id,version_stamp' });
    return this.patch(`/stories/${id}`, { ...fields, id, version_stamp: current.version_stamp });
  }

  async listTests(query, limit = 50) {
    const params = { limit, fields: 'id,name,subtype,covered_content' };
    if (query) params.query = `"name='*${query}*'"`;
    return this.get('/tests', params);
  }

  async getTest(id) {
    return this.get(`/tests/${id}`, { fields: 'id,name,subtype,description,covered_content' });
  }

  async createManualTest(name, description, storyId) {
    const body = { name, description: description || '' };
    if (storyId) {
      body.covered_content = { data: [{ type: 'story', id: String(storyId) }] };
    }
    return this.post('/manual_tests', body);
  }

  async listTestSuites(query, limit = 50) {
    const params = { limit, fields: 'id,name,description' };
    if (query) params.query = `"name='*${query}*'"`;
    return this.get('/test_suites', params);
  }

  async listDefects(query, limit = 50) {
    const params = { limit, fields: 'id,name,description,severity,phase,parent' };
    if (query) params.query = `"name='*${query}*'"`;
    return this.get('/defects', params);
  }

  async uploadAttachment(ownerId, fileName, content, mimeType = 'text/plain', ownerType = 'work_item') {
    await this.ensureAuth();

    // ownerType='work_item' para defects/stories; 'run' para manual_runs
    const ownerField = ownerType === 'run' ? 'owner_run' : 'owner_work_item';
    const entity     = { name: fileName, [ownerField]: { type: ownerType, id: String(ownerId) } };
    const boundary = `WebKitFormBoundary${Date.now()}`;
    const fileData = typeof content === 'string' ? Buffer.from(content) : content;

    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="entity"; filename="blob"\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(entity)}\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="content"; filename="${fileName}"\r\nContent-Type: ${mimeType}\r\n\r\n`),
      fileData,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    const url  = `${this.apiBase}/attachments?fields=name,size,author,last_modified,description,creation_time,${ownerField}`;
    const resp = await fetch(url, {
      method:  'POST',
      headers: { Cookie: this.cookie, 'Content-Type': `multipart/form-data; boundary=${boundary}` },
      body,
    });
    if (resp.status === 401) {
      this.cookie = null;
      await this.authenticate();
      return this.uploadAttachment(ownerId, fileName, content, mimeType, ownerType);
    }
    const data = await resp.json();
    if (!resp.ok) {
      const err = data.errors?.[0]?.description || data.description || JSON.stringify(data);
      throw new Error(err);
    }
    return data;
  }

  async createRun(testId, status, name, duration) {
    // status: 'passed' | 'failed' | 'skipped' | 'blocked'
    const statusId = `list_node.run_native_status.${status}`;
    const body = {
      name:  name || `Run - ${new Date().toISOString().slice(0,10)}`,
      test:  { type: 'test_manual', id: String(testId) },
      native_status: { type: 'list_node', id: statusId },
    };
    if (duration !== undefined) body.duration = duration;
    return this.post('/manual_runs', body);
  }

  async createDefect(name, description, severity, storyId) {
    const body = { name, description: description || '' };
    if (severity) body.severity = { id: `list_node.severity.${severity}`, type: 'list_node' };
    if (storyId) body.parent = { type: 'story', id: String(storyId) };
    return this.post('/defects', body);
  }

  async getWorkspaceInfo() {
    await this.ensureAuth();
    const ss = await fetch(
      `${this.baseUrl}/api/shared_spaces/${this.ssId}`,
      { headers: { Cookie: this.cookie, Accept: 'application/json' } }
    ).then(r => r.json());
    return { shared_space: ss, workspace_id: this.wsId, base_url: this.baseUrl };
  }
}
