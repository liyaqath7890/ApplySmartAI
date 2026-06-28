import OpenAI from 'openai';
import config from '../config/index.js';

let openaiClient = null;

try {
  openaiClient = new OpenAI({
    apiKey: config.openai.apiKey || 'dummy-key',
  });
} catch (error) {
  console.error('Failed to initialize OpenAI client:', error);
}

export const generateAIResponse = async (systemPrompt, userPrompt, jsonFormat = false) => {
  if (!openaiClient || config.openai.apiKey === 'dummy-key-for-development' || !config.openai.apiKey) {
    console.warn('OpenAI API key not configured. Returning fallback response.');
    if (jsonFormat) return "{}";
    return "AI generation requires a valid OpenAI API key in the environment variables.";
  }

  try {
    const params = {
      model: config.openai.model || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
    };

    if (jsonFormat) {
      params.response_format = { type: 'json_object' };
    }

    const response = await openaiClient.chat.completions.create(params);
    return response.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI Error:', error);
    throw new Error('Failed to generate AI response');
  }
};

export default {
  generateAIResponse,
  openaiClient
};
