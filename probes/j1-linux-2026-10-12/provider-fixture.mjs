// Deterministic provider-protocol fixture. No remote provider or invented owner data.
export function createFixtureFetch(selectedId) {
  let calls = 0;
  return async (_url, init) => {
    const body = JSON.parse(init.body);
    const base = { id: 'synthetic-completion', object: 'chat.completion.chunk',
      created: 0, model: 'MiniMax-M3' };
    let delta, reason;
    if (++calls === 1) {
      delta = { role: 'assistant', tool_calls: [{ index: 0, id: 'fixture-tool',
        type: 'function', function: { name: 'readSelectedProject',
          arguments: JSON.stringify({ projectId: selectedId }) } }] };
      reason = 'tool_calls';
    } else if (calls === 2) {
      const toolMessage = body.messages.find(message => message.role === 'tool');
      const project = JSON.parse(toolMessage?.content ?? 'null');
      if (!project || project.id !== selectedId || typeof project.name !== 'string') {
        throw new Error('fixture_requires_owner_result');
      }
      delta = { role: 'assistant', content: project.name };
      reason = 'stop';
    } else throw new Error('fixture_call_bound');
    const chunks = [
      { ...base, choices: [{ index: 0, delta, finish_reason: null }] },
      { ...base, choices: [{ index: 0, delta: {}, finish_reason: reason }] },
    ];
    return new Response(chunks.map(chunk => `data: ${JSON.stringify(chunk)}\n\n`).join('') + 'data: [DONE]\n\n', {
      headers: { 'content-type': 'text/event-stream' },
    });
  };
}
