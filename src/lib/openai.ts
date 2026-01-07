import { SUPPORTED_LANGUAGES } from '../stores/appStore';

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

export async function translateToEnglish(
  sourceText: string,
  apiKey: string,
  sourceLanguage: string = 'tr'
): Promise<string> {
  // If source is already English, return as-is
  if (sourceLanguage === 'en') {
    return sourceText;
  }

  const languageName = getLanguageName(sourceLanguage);
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
          content: `You are a translator. Translate the following ${languageName} text to English. Only output the translation, nothing else. Keep the same tone and style.`,
        },
        {
          role: 'user',
          content: sourceText,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Translation API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}
