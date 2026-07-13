import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const IMPROVE_SYSTEM_PROMPT = `You are the AI Improve engine inside APTI's resume builder.

Rewrite the given resume bullet or section into: strong action verb -> what
was done -> measurable result. Fix grammar. Tighten to a concise, single
line where possible.

CRITICAL TRUTHFULNESS GUARDRAIL:
- Never invent metrics, numbers, roles, technologies, or experience that
  are not present in the input or the student's supplied project/skill data.
- If a number would make the bullet stronger but none was given, insert a
  clearly bracketed placeholder like "[add metric: e.g. reduced X by Y%]"
  instead of a fabricated figure.
- Do not upgrade job titles, scope, or team size beyond what was stated.

Return ONLY the rewritten text, nothing else.`;

const TIP_SYSTEM_PROMPT = `You are the AI Tip engine inside APTI's resume builder.
Given the student's current skills and a target role/company, list the
specific missing skills or keywords most likely to matter for ATS matching
and recruiter screening for that role. Be concrete (e.g. "REST APIs",
"Docker") not generic (e.g. "communication"). Return a short comma
separated list, max 6 items, nothing else.`;

const DESC_SYSTEM_PROMPT = `You are the AI project-description engine inside APTI's resume builder.
Given a project title and tech stack, write ONE concise resume bullet
(action verb + what was built + why it matters) in plain text, no
markdown. Do not invent metrics or outcomes that weren't provided -
use a bracketed placeholder for any number instead of a fabricated one.
Return only the bullet text.`;

const SUMMARY_SYSTEM_PROMPT = `You are the AI professional-summary engine inside APTI's resume builder.
Write a 2-3 sentence professional summary tailored to the student's target
role, grounded only in the skills/projects/education provided. Never invent
years of experience, job titles, or credentials. Return only the summary text.`;

export interface AiActionResult {
  output: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
  };
}

/**
 * Gemini-backed AI service. If Gemini is not configured or fails, the app
 * returns deterministic local fallback text so development demos keep working.
 */
@Injectable()
export class AiService {
  private readonly lightModel: string;
  private readonly strongModel: string;
  private readonly apiKey?: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('GEMINI_API_KEY');
    this.lightModel = this.config.get<string>('GEMINI_MODEL_LIGHT') ?? 'gemini-1.5-flash';
    this.strongModel = this.config.get<string>('GEMINI_MODEL_STRONG') ?? 'gemini-1.5-pro';
  }

  async improve(text: string, targetRole?: string, studentContext?: string): Promise<AiActionResult> {
    const userPrompt = [
      targetRole ? `Target role: ${targetRole}` : null,
      studentContext ? `Student's verified project/skill context:\n${studentContext}` : null,
      `Text to improve:\n${text}`,
    ]
      .filter(Boolean)
      .join('\n\n');
    return this.call(this.strongModel, IMPROVE_SYSTEM_PROMPT, userPrompt);
  }

  async tip(currentSkills: string[], targetRole: string, targetCompany?: string): Promise<AiActionResult> {
    const userPrompt = `Current skills: ${currentSkills.join(', ') || '(none listed)'}\nTarget role: ${targetRole}${
      targetCompany ? `\nTarget company: ${targetCompany}` : ''
    }`;
    return this.call(this.lightModel, TIP_SYSTEM_PROMPT, userPrompt);
  }

  async projectDescription(title: string, techStack: string[], targetRole?: string, studentContext?: string): Promise<AiActionResult> {
    const userPrompt = [
      targetRole ? `Target role: ${targetRole}` : null,
      studentContext ? `Student context:\n${studentContext}` : null,
      `Project title: ${title}`,
      `Tech stack: ${techStack.join(', ')}`,
    ]
      .filter(Boolean)
      .join('\n\n');
    return this.call(this.lightModel, DESC_SYSTEM_PROMPT, userPrompt);
  }

  async summary(profileContext: string, targetRole?: string): Promise<AiActionResult> {
    const userPrompt = `Target role: ${targetRole ?? '(not set)'}\n\nProfile/skills/projects:\n${profileContext}`;
    return this.call(this.strongModel, SUMMARY_SYSTEM_PROMPT, userPrompt);
  }

  private async call(model: string, system: string, userPrompt: string): Promise<AiActionResult> {
    if (!this.apiKey || this.apiKey.includes('replace') || this.apiKey.includes('your-')) {
      return this.fallback(model, system, userPrompt);
    }

    try {
      const response = await Promise.race([
        fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${this.apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            generationConfig: {
              maxOutputTokens: 500,
              temperature: 0.35,
            },
          }),
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('AI provider timeout')), 12000)),
      ]);

      if (!response.ok) throw new Error(`Gemini API returned ${response.status}`);

      const data = (await response.json()) as GeminiResponse;
      const output = data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? '')
        .join('\n')
        .trim() ?? '';

      if (!output) throw new Error('Gemini returned an empty response');

      return {
        output,
        model,
        inputTokens: data.usageMetadata?.promptTokenCount ?? 0,
        outputTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
      };
    } catch {
      return this.fallback(model, system, userPrompt);
    }
  }

  private fallback(model: string, system: string, userPrompt: string): AiActionResult {
    let output = 'Built and improved a project using the listed skills. Add a specific metric or outcome to make this stronger.';
    if (system === TIP_SYSTEM_PROMPT) {
      output = 'REST APIs, SQL, Git, testing, deployment, performance optimization';
    }
    if (system === SUMMARY_SYSTEM_PROMPT) {
      output = 'Motivated candidate with hands-on experience across the listed education, skills, and projects. Strong foundation in building practical software solutions, with a focus on clean implementation and continuous improvement.';
    }
    if (system === DESC_SYSTEM_PROMPT) {
      const title = userPrompt.match(/Project title:\s*(.+)/)?.[1]?.trim() ?? 'project';
      output = `Developed ${title} using the listed technologies, focusing on clear functionality, reliable data handling, and a user-friendly workflow.`;
    }
    if (system === IMPROVE_SYSTEM_PROMPT) {
      const text = userPrompt.match(/Text to improve:\n([\s\S]+)/)?.[1]?.trim();
      output = text ? `Improved ${text.replace(/\.$/, '')} with clearer structure and measurable impact [add metric].` : output;
    }
    return { output, model: `${model} (local fallback)`, inputTokens: 0, outputTokens: 0 };
  }
}
