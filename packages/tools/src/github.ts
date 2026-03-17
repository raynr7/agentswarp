import { z } from 'zod';
import type { Tool } from '@agentswarm/core';

const GITHUB_API = 'https://api.github.com';

async function githubFetch(path: string, options: RequestInit = {}) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN not configured');

  const res = await fetch(`${GITHUB_API}${path}`, {
    ...options,
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${token}`,
      'User-Agent': 'AgentSwarp',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub API error (${res.status}): ${err}`);
  }

  return res.json();
}

export const githubTool: Tool = {
  name: 'github',
  description: 'Interact with GitHub: create issues, comment, create files, get repo info, list PRs. Requires GITHUB_TOKEN env var.',
  schema: z.object({
    action: z.enum(['create_issue', 'comment_issue', 'create_file', 'get_repo', 'list_prs', 'list_issues']),
    repo: z.string(),
    title: z.string().optional(),
    body: z.string().optional(),
    path: z.string().optional(),
    content: z.string().optional(),
    issue_number: z.number().optional(),
  }),
  async execute(input: any) {
    const { action, repo } = input;

    switch (action) {
      case 'get_repo':
        return githubFetch(`/repos/${repo}`);

      case 'list_issues':
        return githubFetch(`/repos/${repo}/issues?state=open&per_page=30`);

      case 'list_prs':
        return githubFetch(`/repos/${repo}/pulls?state=open&per_page=30`);

      case 'create_issue':
        return githubFetch(`/repos/${repo}/issues`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: input.title, body: input.body }),
        });

      case 'comment_issue':
        if (!input.issue_number) throw new Error('issue_number required for comment_issue');
        return githubFetch(`/repos/${repo}/issues/${input.issue_number}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: input.body }),
        });

      case 'create_file':
        if (!input.path || !input.content) throw new Error('path and content required for create_file');
        return githubFetch(`/repos/${repo}/contents/${input.path}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: input.title || `Create ${input.path}`,
            content: btoa(input.content),
          }),
        });

      default:
        throw new Error(`Unknown GitHub action: ${action}`);
    }
  },
};
