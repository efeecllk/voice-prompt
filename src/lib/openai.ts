import { SUPPORTED_LANGUAGES } from '../stores/appStore';
import { getPromptById } from '../prompts';

const WHISPER_API_URL = 'https://api.openai.com/v1/audio/transcriptions';
const CHAT_API_URL = 'https://api.openai.com/v1/chat/completions';

export async function transcribeAudio(
  audioBlob: Blob,
  apiKey: string,
  language: string = 'tr'
): Promise<{ text: string; detectedLanguage: string }> {
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('model', 'whisper-1');

  // Only set language if not auto-detect
  if (language !== 'auto') {
    formData.append('language', language);
  }

  const response = await fetch(WHISPER_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Whisper API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    text: data.text || '',
    detectedLanguage: language === 'auto' ? (data.language || 'unknown') : language,
  };
}

export function getLanguageName(code: string): string {
  const lang = SUPPORTED_LANGUAGES.find((l) => l.code === code);
  return lang?.name || code;
}

export interface ProcessResult {
  text: string;
  outputFormat: 'text' | 'code-block';
  codeBlockLang?: string;
}

export interface CustomTemplate {
  systemPrompt: string;
  outputFormat?: 'text' | 'code-block';
  codeBlockLang?: string;
}

export async function processWithPrompt(
  sourceText: string,
  apiKey: string,
  sourceLanguage: string = 'tr',
  promptId: string = 'default-translation',
  customTemplate?: CustomTemplate
): Promise<ProcessResult> {
  // Use custom template if provided, otherwise look up built-in template
  const template = customTemplate || getPromptById(promptId);
  if (!template) {
    throw new Error(`Prompt template not found: ${promptId}`);
  }

  // If using default translation and source is already English, return as-is
  if (promptId === 'default-translation' && sourceLanguage === 'en') {
    return {
      text: sourceText,
      outputFormat: 'text',
    };
  }

  const languageName = getLanguageName(sourceLanguage);
  // processPrompt expects PromptTemplate, but for custom templates we just need the replacement
  const systemPrompt = template.systemPrompt.replace(/{sourceLang}/g, languageName);

  const response = await fetch(CHAT_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-nano',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: sourceText,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content?.trim() || '';

  return {
    text,
    outputFormat: template.outputFormat || 'text',
    codeBlockLang: template.codeBlockLang,
  };
}

// Legacy function for backwards compatibility
export async function translateToEnglish(
  sourceText: string,
  apiKey: string,
  sourceLanguage: string = 'tr'
): Promise<string> {
  const result = await processWithPrompt(sourceText, apiKey, sourceLanguage, 'default-translation');
  return result.text;
}

export interface GeneratedPrompt {
  name: string;
  description: string;
  systemPrompt: string;
}

export interface GeneratedOutputFormat {
  name: string;
  description: string;
  systemPrompt: string;
  outputFormat: 'text' | 'code-block';
  codeBlockLang?: string;
}

export async function generatePromptFromVoice(
  voiceDescription: string,
  apiKey: string
): Promise<GeneratedPrompt> {
  const systemPrompt = `You are a prompt engineering assistant. The user will describe what kind of prompt template they want to create using voice input (possibly in any language). Your job is to generate a well-structured prompt template.

You must respond with a JSON object containing exactly these fields:
- name: A short, clear name for the prompt (2-5 words)
- description: A brief description of what the prompt does (1 sentence)
- systemPrompt: The actual system prompt that will be used. Make it professional, clear, and well-structured.

IMPORTANT for the systemPrompt:
- Use {sourceLang} as a placeholder where the source language should be inserted
- Make the prompt clear and actionable
- Include any specific instructions the user mentioned
- Structure it with clear sections if needed

Respond ONLY with valid JSON, no markdown or code blocks.

Example response:
{"name":"Code Reviewer","description":"Reviews code and provides improvement suggestions","systemPrompt":"You are an expert code reviewer. Analyze the following {sourceLang} code and provide:\\n\\n1. Code quality assessment\\n2. Potential bugs or issues\\n3. Suggestions for improvement\\n4. Best practices recommendations\\n\\nBe constructive and specific in your feedback."}`;

  const response = await fetch(CHAT_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-nano',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: voiceDescription,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim() || '';

  try {
    // Parse the JSON response
    const parsed = JSON.parse(content);
    return {
      name: parsed.name || 'Untitled Prompt',
      description: parsed.description || '',
      systemPrompt: parsed.systemPrompt || '',
    };
  } catch {
    // If parsing fails, try to extract from the content
    throw new Error('Failed to parse generated prompt. Please try again.');
  }
}

export async function generateOutputFormatFromVoice(
  voiceDescription: string,
  apiKey: string
): Promise<GeneratedOutputFormat> {
  const systemPrompt = `You are an expert prompt engineer specializing in voice-to-text processing systems. Your task is to generate high-quality system prompts based on voice descriptions from users (potentially in any language).

## YOUR OUTPUT

Generate a JSON object with exactly these fields:
- name: Short, clear name (2-5 words, title case)
- description: One-sentence description of what the prompt does
- systemPrompt: The complete system prompt following the structure below
- outputFormat: Either "text" for plain text output or "code-block" for formatted code/command output
- codeBlockLang: If outputFormat is "code-block", specify the language (e.g., "bash", "javascript", "python"). Omit if outputFormat is "text".

Respond ONLY with valid JSON, no markdown code blocks or extra text.

## SYSTEM PROMPT STRUCTURE

### For Simple Tasks (translation, summarization, formatting):
You are a [ROLE]. [TASK DESCRIPTION using {sourceLang} placeholder]. Only output [EXPECTED OUTPUT], nothing else. [STYLE/TONE GUIDANCE if relevant].

### For Complex Tasks (code generation, multi-step processing, conversions):
You are a [ROLE].

## YOUR ROLE
[Detailed description of what the AI should do, referencing {sourceLang} for input language]

## OUTPUT FORMAT
[Exact format specification]

## RULES
1. [Rule 1 - what TO do]
2. [Rule 2 - what NOT to do]

## IMPORTANT
- [Critical constraints]
- Only output the [expected format], nothing else

## GENERATION RULES

1. **Always include {sourceLang} placeholder** where the source language should appear
2. **Be explicit about output** - state what TO output and what NOT to output
3. **Match complexity to task** - simple tasks get concise prompts, complex tasks get structured ones
4. **Determine outputFormat correctly:**
   - Use "text" for: translations, summaries, rewrites, explanations
   - Use "code-block" for: code generation, CLI commands, scripts, technical outputs

## EXAMPLES

Voice: "translate to formal business English"
{"name":"Business English","description":"Translates to formal business English","systemPrompt":"You are a professional business translator. Translate the following {sourceLang} text to formal business English. Use professional vocabulary, proper grammar, and maintain a corporate tone. Only output the translation, nothing else.","outputFormat":"text"}

Voice: "convert to a git commit message"
{"name":"Git Commit Message","description":"Converts description to conventional commit format","systemPrompt":"You are a Git expert.\\n\\n## YOUR ROLE\\nConvert the {sourceLang} description into a well-formatted git commit message.\\n\\n## OUTPUT FORMAT\\ntype(scope): subject\\n\\nbody (if needed)\\n\\n## RULES\\n1. Use conventional commit types: feat, fix, docs, style, refactor, test, chore\\n2. Keep subject under 50 characters\\n3. Use imperative mood\\n4. Add body only for complex changes\\n\\n## IMPORTANT\\n- Only output the commit message, nothing else","outputFormat":"code-block","codeBlockLang":"text"}

Voice: "create bullet points for presentation"
{"name":"Presentation Bullets","description":"Converts ideas into presentation bullet points","systemPrompt":"You are a presentation specialist. Transform {sourceLang} input into clear, concise bullet points.\\n\\n## RULES\\n1. Extract key ideas hierarchically\\n2. Keep bullets under 10 words\\n3. Use parallel structure\\n4. Maximum 5-7 main points\\n\\nOnly output the bullet points, nothing else.","outputFormat":"text"}`;

  const response = await fetch(CHAT_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-nano',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: voiceDescription,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim() || '';

  try {
    const parsed = JSON.parse(content);
    return {
      name: parsed.name || 'Untitled Format',
      description: parsed.description || '',
      systemPrompt: parsed.systemPrompt || '',
      outputFormat: parsed.outputFormat === 'code-block' ? 'code-block' : 'text',
      codeBlockLang: parsed.codeBlockLang,
    };
  } catch {
    throw new Error('Failed to parse generated format. Please try again.');
  }
}
