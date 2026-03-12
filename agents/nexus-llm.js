#!/usr/bin/env node

/*
 * NEXUS LLM Module
 * Shared LLM access for all NEXUS agents via OpenRouter
 * Uses DeepSeek Chat (fast, cheap, good for structured output)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load API key from OpenClaw config
function getApiKey() {
  const paths = [
    path.join(process.env.HOME || '/root', '.openclaw/agents/main/agent/models.json'),
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) {
      try {
        const d = JSON.parse(fs.readFileSync(p, 'utf-8'));
        const key = d?.providers?.openrouter?.apiKey;
        if (key) return key;
      } catch(e) {}
    }
  }
  // Fallback: env var
  return process.env.OPENROUTER_API_KEY || process.env.NEXUS_LLM_KEY || null;
}

const API_KEY = getApiKey();
const BASE_URL = 'openrouter.ai';
const MODEL_FAST = 'deepseek/deepseek-chat';       // Fast, cheap — content/context
const MODEL_SMART = 'anthropic/claude-sonnet-4-20250514'; // Smart — complex analysis

/**
 * Call LLM with a prompt. Returns the text response.
 * @param {string} prompt - The user prompt
 * @param {object} opts - { system, model, maxTokens, temperature, json }
 * @returns {Promise<string>} The LLM response text
 */
function call(prompt, opts = {}) {
  return new Promise((resolve, reject) => {
    if (!API_KEY) {
      return reject(new Error('No OpenRouter API key found'));
    }

    const model = opts.model || MODEL_FAST;
    const messages = [];
    if (opts.system) messages.push({ role: 'system', content: opts.system });
    messages.push({ role: 'user', content: prompt });

    const body = JSON.stringify({
      model,
      messages,
      max_tokens: opts.maxTokens || 4096,
      temperature: opts.temperature ?? 0.7,
      ...(opts.json ? { response_format: { type: 'json_object' } } : {})
    });

    const req = https.request({
      hostname: BASE_URL,
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/gabrielrbm-prog/nexus-framework',
        'X-Title': 'NEXUS Framework'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            return reject(new Error(`LLM Error: ${parsed.error.message || JSON.stringify(parsed.error)}`));
          }
          const content = parsed.choices?.[0]?.message?.content || '';
          resolve(content);
        } catch(e) {
          reject(new Error(`LLM parse error: ${e.message}\nRaw: ${data.slice(0, 500)}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(opts.timeout || 30000, () => {
      req.destroy();
      reject(new Error('LLM request timeout'));
    });
    req.write(body);
    req.end();
  });
}

/**
 * Call LLM and parse JSON response
 */
async function callJSON(prompt, opts = {}) {
  const raw = await call(prompt, { ...opts, json: true });
  // Extract JSON from response (handle markdown code blocks)
  let text = raw.trim();
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  return JSON.parse(text);
}

module.exports = { call, callJSON, MODEL_FAST, MODEL_SMART, getApiKey };

// Quick test
if (require.main === module) {
  call('Diga "NEXUS LLM OK" e nada mais.', { maxTokens: 20 })
    .then(r => console.log('✅ LLM Test:', r))
    .catch(e => console.error('❌ LLM Error:', e.message));
}
