import { AtsResult, Resume, ResumeSection, Template, AiEventResult, Plan } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

// Wired to the real Supabase session in lib/auth-context.tsx (AuthProvider),
// which calls setAccessTokenProvider() once on mount. Centralized here so
// every call site below picks up the current access token automatically —
// no request ever goes out without it once a session exists.
let getAccessToken: () => Promise<string | null> = async () => null;
let refreshAccessToken: () => Promise<string | null> = async () => null;
export function setAccessTokenProvider(fn: () => Promise<string | null>) {
  getAccessToken = fn;
}
export function setAccessTokenRefreshProvider(fn: () => Promise<string | null>) {
  refreshAccessToken = fn;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken();
  const makeRequest = (accessToken: string | null) => fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  let res = await makeRequest(token);
  if (res.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed && refreshed !== token) {
      res = await makeRequest(refreshed);
    }
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      typeof body?.message === 'string'
        ? body.message
        : Array.isArray(body?.message)
          ? body.message.join(', ')
        : typeof body?.message?.message === 'string'
          ? body.message.message
          : `Request failed: ${res.status}`;
    const err = new Error(message) as Error & { body?: any; status?: number };
    err.body = body;
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export const api = {
  resumes: {
    list: () => request<Resume[]>('/resumes'),
    get: (id: string) => request<Resume>(`/resumes/${id}`),
    create: (_plan: Plan, title: string, templateId?: string) =>
      request<Resume>('/resumes', { method: 'POST', body: JSON.stringify({ title, templateId }) }),
    update: (id: string, patch: Partial<Resume>) =>
      request<Resume>(`/resumes/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
    remove: (id: string) => request<{ ok: true }>(`/resumes/${id}`, { method: 'DELETE' }),
    duplicate: (id: string) => request<Resume>(`/resumes/${id}/duplicate`, { method: 'POST' }),
    upsertSection: (resumeId: string, section: Partial<ResumeSection>) =>
      request<ResumeSection>(`/resumes/${resumeId}/sections`, { method: 'POST', body: JSON.stringify(section) }),
    reorderSections: (resumeId: string, sections: Array<{ id: string; order: number; visible: boolean }>) =>
      request<{ ok: true }>(`/resumes/${resumeId}/sections/reorder`, { method: 'PATCH', body: JSON.stringify({ sections }) }),
    recomputeAts: (resumeId: string, targetKeywords: string[] = []) =>
      request<AtsResult>(`/resumes/${resumeId}/ats/recompute`, { method: 'POST', body: JSON.stringify({ targetKeywords }) }),
  },
  templates: {
    list: (_plan?: Plan) => request<Template[]>('/templates'),
  },
  ai: {
    improve: (resumeId: string, text: string, _plan: Plan, targetRole?: string, studentContext?: string) =>
      request<AiEventResult>('/ai/improve', {
        method: 'POST',
        body: JSON.stringify({ resumeId, text, targetRole, studentContext }),
      }),
    tip: (resumeId: string, currentSkills: string[], targetRole: string, _plan: Plan, targetCompany?: string) =>
      request<AiEventResult>('/ai/tip', {
        method: 'POST',
        body: JSON.stringify({ resumeId, currentSkills, targetRole, targetCompany }),
      }),
    projectDescription: (resumeId: string, title: string, techStack: string[], _plan: Plan, targetRole?: string, studentContext?: string) =>
      request<AiEventResult>('/ai/project-description', {
        method: 'POST',
        body: JSON.stringify({ resumeId, title, techStack, targetRole, studentContext }),
      }),
    summary: (resumeId: string, profileContext: string, _plan: Plan, targetRole?: string) =>
      request<AiEventResult>('/ai/summary', {
        method: 'POST',
        body: JSON.stringify({ resumeId, profileContext, targetRole }),
      }),
    accept: (eventId: string, accepted: boolean) =>
      request<{ ok: true }>('/ai/accept', { method: 'POST', body: JSON.stringify({ eventId, accepted }) }),
  },
  integrations: {
    prefill: () => request<any>('/integrations/prefill'),
  },
  pdf: {
    export: (resumeId: string, data: any, watermarked: boolean) =>
      request<{ url: string; fileName: string }>('/pdf/export', {
        method: 'POST',
        body: JSON.stringify({ resumeId, data, watermarked }),
      }),
  },
};

// Thrown by any AI/entitlement-gated call when the plan ceiling is hit.
// Components should catch on err.status === 403 && err.body?.code === 'UPGRADE_REQUIRED'.
export type ApiError = Error & { status?: number; body?: { code?: string; reason?: string; feature?: string } };
