import React from 'react';

export default function McpCliStudio() {
  return (
    <div className="w-full h-full overflow-y-auto bg-[#070707] text-white p-6 md:p-10">
      <section className="max-w-5xl mx-auto flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <span className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">LiteLLM Gateway</span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">Use your own LiteLLM models everywhere</h1>
          <p className="text-white/55 max-w-2xl">
            Configure a LiteLLM proxy, expose the models you want, then paste the proxy URL and key in Settings.
            The studio sends OpenAI-compatible requests to your gateway and forwards custom workflow endpoints there.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            ['1', 'Run LiteLLM', 'Start your LiteLLM proxy with the image, video, agent, and workflow routes you want to support.'],
            ['2', 'Add credentials', 'Open Settings and enter the LiteLLM proxy URL plus API key. Credentials stay in local storage.'],
            ['3', 'Select models', 'The studio reads /v1/models from your gateway and uses those model IDs for generation.'],
          ].map(([num, title, body]) => (
            <div key={num} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
              <div className="w-8 h-8 rounded-xl bg-cyan-300 text-black font-black flex items-center justify-center mb-4">{num}</div>
              <h2 className="text-lg font-black mb-2">{title}</h2>
              <p className="text-sm text-white/55 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
        <pre className="bg-black/40 border border-white/10 rounded-2xl p-5 text-sm overflow-x-auto">
          <code>{`LITELLM_URL=http://localhost:4000
Authorization: Bearer YOUR_LITELLM_KEY

GET  /v1/models
POST /v1/images/generations
POST /v1/video/generations
POST /v1/files`}</code>
        </pre>
      </section>
    </div>
  );
}
