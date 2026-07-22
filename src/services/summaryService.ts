export interface LLMConfig {
  provider: 'ollama' | 'gemini' | 'openai' | 'groq' | 'nvidia' | 'openrouter';
  model: string;
  apiKey: string;
  customEndpoint?: string;
}

export type SummaryTemplate = 'minutes' | 'action_items' | 'executive';

const TEMPLATES: Record<SummaryTemplate, string> = {
  minutes: `You are an expert AI meeting assistant. Based on the following meeting transcript, generate structured and detailed meeting minutes. 
Include:
1. Overview / Purpose of the meeting
2. Key Discussion Points (summarized clearly)
3. Decisions Made
4. Next Steps

Format the output beautifully in Markdown.`,
  action_items: `You are an expert AI meeting assistant. Analyze the following meeting transcript and extract all Action Items.
Format them as a checklist:
- [ ] Task description (Assigned to: Person Name, if mentioned)

Only include actual tasks and assignments. Format the output in Markdown.`,
  executive: `You are an expert AI meeting assistant. Generate a high-level, concise Executive Summary of the following meeting.
Highlight:
1. The Core Objective
2. Major takeaways (maximum 3-4 bullet points)
3. Final outcome or immediate action needed

Keep it brief and highly professional. Format the output in Markdown.`,
};

class SummaryService {
  async generate(
    transcriptText: string,
    template: SummaryTemplate,
    config: LLMConfig
  ): Promise<string> {
    if (!transcriptText.trim()) {
      throw new Error('Transcript is empty. Cannot generate summary.');
    }

    const systemPrompt = TEMPLATES[template];
    const userPrompt = `Here is the meeting transcript:\n\n${transcriptText}\n\nPlease generate the summary based on the instructions.`;

    switch (config.provider) {
      case 'ollama':
        return this.callOllama(systemPrompt, userPrompt, config);
      case 'gemini':
        return this.callGemini(systemPrompt, userPrompt, config);
      case 'openai':
        return this.callOpenAI(systemPrompt, userPrompt, config);
      case 'groq':
        return this.callGroq(systemPrompt, userPrompt, config);
      case 'nvidia':
        return this.callNvidia(systemPrompt, userPrompt, config);
      case 'openrouter':
        return this.callOpenRouter(systemPrompt, userPrompt, config);
      default:
        throw new Error(`Unsupported AI provider: ${config.provider}`);
    }
  }

  private async callOllama(systemPrompt: string, userPrompt: string, config: LLMConfig): Promise<string> {
    const endpoint = (config.customEndpoint || 'http://localhost:11434').replace(/\/$/, '');
    
    try {
      const response = await fetch(`${endpoint}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.model || 'gemma2:2b' || 'llama3',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          stream: false
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama returned status ${response.status}. Ensure Ollama is running and CORS is configured.`);
      }

      const data = await response.json();
      return data.message?.content || '';
    } catch (error) {
      console.error('Ollama communication error:', error);
      throw new Error('Could not connect to Ollama. Make sure Ollama is running locally and CORS is enabled (e.g. by setting OLLAMA_ORIGINS="*" environment variable).');
    }
  }

  private async callGemini(systemPrompt: string, userPrompt: string, config: LLMConfig): Promise<string> {
    const model = config.model || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: `${systemPrompt}\n\n${userPrompt}` }
            ]
          }
        ]
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Gemini API failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response content from Gemini.';
  }

  private async callOpenAI(systemPrompt: string, userPrompt: string, config: LLMConfig): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `OpenAI failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  private async callGroq(systemPrompt: string, userPrompt: string, config: LLMConfig): Promise<string> {
    const useProxy = !config.apiKey || config.apiKey === 'server';
    const url = useProxy ? '/api/groq/chat' : 'https://api.groq.com/openai/v1/chat/completions';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model || 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || errData?.detail || `Groq failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  async translate(
    transcriptText: string,
    sourceLang: string,
    targetLang: string,
    config: LLMConfig
  ): Promise<string> {
    if (!transcriptText.trim()) {
      throw new Error('Transcript is empty. Cannot translate.');
    }

    const systemPrompt = `You are a professional translator. Translate the given meeting transcript from ${sourceLang === 'auto' ? 'the source language' : sourceLang} into ${targetLang}. 
    
    CRITICAL INSTRUCTIONS:
    1. Respond ONLY with the translation. Do NOT add any introductory text, explanation, or notes.
    2. Maintain the format and spacing. Each segment is prefixed with a bracketed relative timestamp (e.g., "[00:12]"). Keep these timestamps exactly as they are. Do NOT translate or remove them.
    3. Do NOT translate the numbers inside the brackets. Keep them exactly the same.
    4. Translate only the speech text that follows each timestamp.`;

    const userPrompt = `Here is the transcript to translate:\n\n${transcriptText}`;

    switch (config.provider) {
      case 'ollama':
        return this.callOllama(systemPrompt, userPrompt, config);
      case 'gemini':
        return this.callGemini(systemPrompt, userPrompt, config);
      case 'openai':
        return this.callOpenAI(systemPrompt, userPrompt, config);
      case 'groq':
        return this.callGroq(systemPrompt, userPrompt, config);
      case 'nvidia':
        return this.callNvidia(systemPrompt, userPrompt, config);
      default:
        throw new Error(`Unsupported AI provider: ${config.provider}`);
    }
  }

  private async callNvidia(systemPrompt: string, userPrompt: string, config: LLMConfig): Promise<string> {
    const response = await fetch('/api/nvidia/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model || 'meta/llama-3.1-405b-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.detail || `NVIDIA NIM failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  private async callOpenRouter(systemPrompt: string, userPrompt: string, config: LLMConfig): Promise<string> {
    const useProxy = !config.apiKey || config.apiKey === 'server';
    const url = useProxy ? '/api/openrouter/chat' : 'https://openrouter.ai/api/v1/chat/completions';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'AtlasMeet'
      },
      body: JSON.stringify({
        model: config.model || 'google/gemma-2-9b-it:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || errData?.detail || `OpenRouter failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }
}

export const summaryService = new SummaryService();
