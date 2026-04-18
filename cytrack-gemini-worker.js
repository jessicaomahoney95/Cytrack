// CyTrack Gemini Worker — proxies requests to Google Gemini API
// Setup: Paste this into a new Cloudflare Worker, add GEMINI_API_KEY and APP_SECRET as secrets

export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-App-Secret',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    const providedSecret = request.headers.get('X-App-Secret');
    if (!providedSecret || providedSecret !== env.APP_SECRET) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      const body = await request.json();
      const model = body.model || 'gemini-2.5-flash';

      const geminiRequest = {
        contents: [
          { role: 'user', parts: [{ text: body.prompt }] }
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 800,
          topP: 0.9,
        },
      };
      if (body.systemPrompt) {
        geminiRequest.systemInstruction = {
          parts: [{ text: body.systemPrompt }]
        };
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      const geminiResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': env.GEMINI_API_KEY,
        },
        body: JSON.stringify(geminiRequest),
      });

      const data = await geminiResponse.json();

      let answerText = '';
      if (data?.candidates?.[0]?.content?.parts) {
        answerText = data.candidates[0].content.parts.map(p => p.text || '').join('');
      } else if (data?.error) {
        return new Response(JSON.stringify({ error: data.error.message || 'Gemini error', raw: data }), {
          status: geminiResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ answer: answerText, raw: data }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};
