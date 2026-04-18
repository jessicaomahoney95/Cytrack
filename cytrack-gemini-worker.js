export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
      'Access-Control-Allow-Headers': 'Content-Type, X-App-Secret',
    };
    
    // DIAGNOSTIC — show what the Worker can see
    return new Response(JSON.stringify({
      hasAppSecret: !!env.APP_SECRET,
      appSecretLength: env.APP_SECRET ? env.APP_SECRET.length : 0,
      hasGeminiKey: !!env.GEMINI_API_KEY,
      geminiKeyLength: env.GEMINI_API_KEY ? env.GEMINI_API_KEY.length : 0,
      receivedHeader: request.headers.get('X-App-Secret') || 'NONE',
      allEnvKeys: Object.keys(env),
    }, null, 2), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  },
};
