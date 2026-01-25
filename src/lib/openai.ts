import { SUPPORTED_LANGUAGES } from '../stores/appStore';
import { getPromptById, processPrompt, PromptTemplate } from '../prompts';

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

export async function processWithPrompt(
  sourceText: string,
  apiKey: string,
  sourceLanguage: string = 'tr',
  promptId: string = 'default-translation',
  customPrompts: PromptTemplate[] = []
): Promise<ProcessResult> {
  const template = getPromptById(promptId, customPrompts);
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
  const systemPrompt = processPrompt(template, languageName);

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
