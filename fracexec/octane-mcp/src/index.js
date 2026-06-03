/**
 * FracExec Octane MCP Server
 *
 * Expõe a API REST oficial do ALM Octane como ferramentas MCP.
 * Compatível com Claude Code (stdio transport).
 *
 * Configuração via variáveis de ambiente:
 *   OCTANE_URL, OCTANE_SHARED_SPACE_ID, OCTANE_WORKSPACE_ID,
 *   OCTANE_USERNAME, OCTANE_PASSWORD
 */

import { McpServer }           from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z }                   from 'zod';
import { OctaneClient }        from './octane-client.js';

// ── Configuração ──────────────────────────────────────────────────────────────

const config = {
  url:           process.env.OCTANE_URL           || 'http://localhost:8090',
  sharedSpaceId: process.env.OCTANE_SHARED_SPACE_ID || '1001',
  workspaceId:   process.env.OCTANE_WORKSPACE_ID    || '1003',
  username:      process.env.OCTANE_USERNAME        || 'sa@nga',
  password:      process.env.OCTANE_PASSWORD        || 'Welcome1',
};

const octane = new OctaneClient(config);
const server = new McpServer({ name: 'fracexec-octane', version: '1.0.0' });

// ── Helper ────────────────────────────────────────────────────────────────────

function formatList(result) {
  const items = result?.data || [];
  if (items.length === 0) return 'Nenhum item encontrado.';
  return items.map(item =>
    `[${item.id}] ${item.name || '(sem nome)'}`
    + (item.description ? `\n  ${String(item.description).replace(/<[^>]+>/g,'').substring(0,120)}` : '')
    + (item.parent ? `\n  Parent: ${item.parent?.name || item.parent?.id}` : '')
  ).join('\n\n');
}

// ── Tools — Workspace ─────────────────────────────────────────────────────────

server.tool(
  'octane_workspace_info',
  'Retorna informações do workspace FracExec configurado no Octane.',
  {},
  async () => {
    try {
      const info = await octane.getWorkspaceInfo();
      return {
        content: [{
          type: 'text',
          text: `Octane conectado:\n  URL: ${info.base_url}\n  Shared Space: ${info.shared_space?.name || config.sharedSpaceId}\n  Workspace ID: ${info.workspace_id}`,
        }],
      };
    } catch (e) {
      return { content: [{ type: 'text', text: `Erro: ${e.message}` }], isError: true };
    }
  }
);

// ── Tools — Épicos ────────────────────────────────────────────────────────────

server.tool(
  'octane_list_epics',
  'Lista os épicos do workspace FracExec no Octane.',
  { query: z.string().optional().describe('Filtro parcial pelo nome do épico') },
  async ({ query }) => {
    try {
      const result = await octane.listEpics(query);
      return { content: [{ type: 'text', text: `Épicos (${result.total_count}):\n\n${formatList(result)}` }] };
    } catch (e) {
      return { content: [{ type: 'text', text: `Erro: ${e.message}` }], isError: true };
    }
  }
);

server.tool(
  'octane_get_epic',
  'Retorna detalhes de um épico pelo ID.',
  { id: z.string().describe('ID do épico no Octane') },
  async ({ id }) => {
    try {
      const item = await octane.getEpic(id);
      return { content: [{ type: 'text', text: JSON.stringify(item, null, 2) }] };
    } catch (e) {
      return { content: [{ type: 'text', text: `Erro: ${e.message}` }], isError: true };
    }
  }
);

// ── Tools — Features ──────────────────────────────────────────────────────────

server.tool(
  'octane_list_features',
  'Lista as features do workspace FracExec no Octane.',
  { query: z.string().optional().describe('Filtro parcial pelo nome da feature') },
  async ({ query }) => {
    try {
      const result = await octane.listFeatures(query);
      return { content: [{ type: 'text', text: `Features (${result.total_count}):\n\n${formatList(result)}` }] };
    } catch (e) {
      return { content: [{ type: 'text', text: `Erro: ${e.message}` }], isError: true };
    }
  }
);

// ── Tools — Stories ───────────────────────────────────────────────────────────

server.tool(
  'octane_list_stories',
  'Lista as user stories do workspace FracExec no Octane.',
  {
    query: z.string().optional().describe('Filtro parcial pelo nome da story'),
    limit: z.number().int().min(1).max(200).optional().default(50).describe('Máximo de resultados'),
  },
  async ({ query, limit }) => {
    try {
      const result = await octane.listStories(query, limit);
      return { content: [{ type: 'text', text: `Stories (${result.total_count}):\n\n${formatList(result)}` }] };
    } catch (e) {
      return { content: [{ type: 'text', text: `Erro: ${e.message}` }], isError: true };
    }
  }
);

server.tool(
  'octane_get_story',
  'Retorna detalhes de uma user story pelo ID.',
  { id: z.string().describe('ID da story no Octane') },
  async ({ id }) => {
    try {
      const item = await octane.getStory(id);
      return { content: [{ type: 'text', text: JSON.stringify(item, null, 2) }] };
    } catch (e) {
      return { content: [{ type: 'text', text: `Erro: ${e.message}` }], isError: true };
    }
  }
);

server.tool(
  'octane_update_story',
  'Atualiza campos de uma user story no Octane (nome, descrição, story points).',
  {
    id:           z.string().describe('ID da story'),
    name:         z.string().optional().describe('Novo nome'),
    description:  z.string().optional().describe('Nova descrição'),
    story_points: z.number().int().optional().describe('Story points'),
  },
  async ({ id, name, description, story_points }) => {
    try {
      const fields = {};
      if (name)         fields.name         = name;
      if (description)  fields.description  = description;
      if (story_points !== undefined) fields.story_points = story_points;
      const result = await octane.updateStory(id, fields);
      const updated = result?.data?.[0];
      return { content: [{ type: 'text', text: `Story [${updated?.id}] atualizada: ${updated?.name}` }] };
    } catch (e) {
      return { content: [{ type: 'text', text: `Erro: ${e.message}` }], isError: true };
    }
  }
);

// ── Tools — Testes ────────────────────────────────────────────────────────────

server.tool(
  'octane_list_tests',
  'Lista os casos de teste do workspace FracExec no Octane.',
  {
    query: z.string().optional().describe('Filtro parcial pelo nome do teste'),
    limit: z.number().int().min(1).max(200).optional().default(50),
  },
  async ({ query, limit }) => {
    try {
      const result = await octane.listTests(query, limit);
      return { content: [{ type: 'text', text: `Testes (${result.total_count}):\n\n${formatList(result)}` }] };
    } catch (e) {
      return { content: [{ type: 'text', text: `Erro: ${e.message}` }], isError: true };
    }
  }
);

server.tool(
  'octane_get_test',
  'Retorna detalhes de um caso de teste pelo ID.',
  { id: z.string().describe('ID do teste no Octane') },
  async ({ id }) => {
    try {
      const item = await octane.getTest(id);
      return { content: [{ type: 'text', text: JSON.stringify(item, null, 2) }] };
    } catch (e) {
      return { content: [{ type: 'text', text: `Erro: ${e.message}` }], isError: true };
    }
  }
);

server.tool(
  'octane_create_test',
  'Cria um novo caso de teste manual no Octane e o vincula a uma story.',
  {
    name:        z.string().describe('Nome do caso de teste'),
    description: z.string().optional().describe('Descrição / steps do teste'),
    story_id:    z.string().optional().describe('ID da story que este teste cobre'),
  },
  async ({ name, description, story_id }) => {
    try {
      const result = await octane.createManualTest(name, description, story_id);
      const created = result?.data?.[0];
      return { content: [{ type: 'text', text: `Teste criado: [${created?.id}] ${created?.name}` }] };
    } catch (e) {
      return { content: [{ type: 'text', text: `Erro: ${e.message}` }], isError: true };
    }
  }
);

// ── Tools — Defects ───────────────────────────────────────────────────────────

server.tool(
  'octane_list_defects',
  'Lista os defeitos/bugs do workspace FracExec no Octane.',
  {
    query: z.string().optional().describe('Filtro parcial pelo nome do defeito'),
    limit: z.number().int().min(1).max(200).optional().default(50),
  },
  async ({ query, limit }) => {
    try {
      const result = await octane.listDefects(query, limit);
      return { content: [{ type: 'text', text: `Defeitos (${result.total_count}):\n\n${formatList(result)}` }] };
    } catch (e) {
      return { content: [{ type: 'text', text: `Erro: ${e.message}` }], isError: true };
    }
  }
);

server.tool(
  'octane_create_defect',
  'Cria um defeito/bug no Octane e o vincula a uma story.',
  {
    name:        z.string().describe('Título do defeito'),
    description: z.string().optional().describe('Descrição detalhada'),
    severity:    z.enum(['urgent','very_high','high','medium','low']).optional().describe('Severidade'),
    story_id:    z.string().optional().describe('ID da story relacionada'),
  },
  async ({ name, description, severity, story_id }) => {
    try {
      const result = await octane.createDefect(name, description, severity, story_id);
      const created = result?.data?.[0];
      return { content: [{ type: 'text', text: `Defeito criado: [${created?.id}] ${created?.name}` }] };
    } catch (e) {
      return { content: [{ type: 'text', text: `Erro: ${e.message}` }], isError: true };
    }
  }
);

// ── Start ─────────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
