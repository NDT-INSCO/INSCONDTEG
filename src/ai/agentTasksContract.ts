export const AGENT_TASK_AGENTS = ['tutor', 'copilot', 'site-manager', 'community'] as const;
export type AgentTaskAgent = (typeof AGENT_TASK_AGENTS)[number];
export type AgentTaskStatus = 'proposed' | 'approved' | 'rejected';

export interface AgentTask {
  id: string;
  agent: AgentTaskAgent;
  title: string;
  summary: string;
  status: AgentTaskStatus;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
}

export function normaliseAgentTaskProposal(value: unknown): Pick<AgentTask, 'agent' | 'title' | 'summary'> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const item = value as Record<string, unknown>;
  if (!AGENT_TASK_AGENTS.includes(item.agent as AgentTaskAgent)) return null;
  if (typeof item.title !== 'string' || typeof item.summary !== 'string') return null;
  const title = item.title.trim();
  const summary = item.summary.trim();
  if (!title || title.length > 120 || !summary || summary.length > 1000) return null;
  return { agent: item.agent as AgentTaskAgent, title, summary };
}
