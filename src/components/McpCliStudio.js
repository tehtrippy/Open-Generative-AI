export function McpCliStudio() {
    const root = document.createElement('div');
    root.className = 'w-full h-full overflow-y-auto custom-scrollbar bg-app-bg text-white p-6 md:p-10';
    root.innerHTML = `
        <section class="max-w-5xl mx-auto flex flex-col gap-8">
            <div class="flex flex-col gap-3">
                <span class="text-xs font-black uppercase tracking-[0.24em] text-primary">LiteLLM Gateway</span>
                <h1 class="text-3xl md:text-5xl font-black tracking-tight">Use your own LiteLLM models everywhere</h1>
                <p class="text-secondary max-w-2xl">
                    Configure a LiteLLM proxy, expose the models you want, then paste the proxy URL and key in Settings.
                    The studio sends OpenAI-compatible requests to your gateway and forwards custom workflow endpoints there.
                </p>
            </div>
            <div class="grid md:grid-cols-3 gap-4">
                ${card('1', 'Run LiteLLM', 'Start your LiteLLM proxy with the image, video, agent, and workflow routes you want to support.')}
                ${card('2', 'Add credentials', 'Open Settings and enter the LiteLLM proxy URL plus API key. Credentials stay in local storage.')}
                ${card('3', 'Select models', 'The studio reads /v1/models from your gateway and uses those model IDs for generation.')}
            </div>
            <pre class="bg-black/40 border border-white/10 rounded-2xl p-5 text-sm overflow-x-auto"><code>LITELLM_URL=http://localhost:4000
Authorization: Bearer YOUR_LITELLM_KEY

GET  /v1/models
POST /v1/images/generations
POST /v1/video/generations
POST /v1/files</code></pre>
        </section>
    `;
    return root;
}

function card(num, title, body) {
    return `
        <div class="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
            <div class="w-8 h-8 rounded-xl bg-primary text-black font-black flex items-center justify-center mb-4">${num}</div>
            <h2 class="text-lg font-black mb-2">${title}</h2>
            <p class="text-sm text-secondary leading-relaxed">${body}</p>
        </div>
    `;
}
