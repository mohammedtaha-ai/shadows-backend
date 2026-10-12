// Disposable same-host transport probe. This HTTP API has no cloud authentication.
export async function readSelectedProject({ projectId, selectedId, baseUrl, fetcher = fetch }) {
  if (projectId !== selectedId) throw new Error('project_scope_refused');
  const origin = new URL(baseUrl);
  if (origin.protocol !== 'http:' || origin.hostname !== '127.0.0.1' || origin.pathname !== '/') {
    throw new Error('owner_origin_refused');
  }
  let response;
  try {
    response = await fetcher(new URL('/api/projects', origin), {
      signal: AbortSignal.timeout(5000), redirect: 'error',
    });
  } catch { throw new Error('owner_unavailable'); }
  if (!response.ok) throw new Error('owner_unavailable');
  let projects;
  try { projects = await response.json(); } catch { throw new Error('owner_unavailable'); }
  if (!Array.isArray(projects)) throw new Error('owner_unavailable');
  const selected = projects.find(p => p?.id === selectedId);
  if (!selected || typeof selected.name !== 'string' || typeof selected.slug !== 'string') {
    throw new Error('project_missing');
  }
  return { id: selectedId, name: selected.name, slug: selected.slug };
}
