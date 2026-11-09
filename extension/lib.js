// Pure helpers, loaded before content.js. Tested by test.mjs.

const EVENT_LABELS = { PushEvent: 'Pushed', PullRequestEvent: 'Opened a PR', CreateEvent: 'Created' };

// Events come newest-first; keep the first (latest) activity per repo.
function recentRepos(events, limit = 15) {
  const seen = new Map();
  for (const e of events) {
    if (!EVENT_LABELS[e.type] || seen.has(e.repo.name)) continue;
    if (e.type === 'PullRequestEvent' && e.payload?.action !== 'opened') continue;
    seen.set(e.repo.name, { name: e.repo.name, label: EVENT_LABELS[e.type], at: e.created_at });
  }
  return [...seen.values()].slice(0, limit);
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
