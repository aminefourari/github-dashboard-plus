const store = chrome.storage.local;
const isDashboard = () => location.pathname === '/';
const avatar = (login) => `https://avatars.githubusercontent.com/${encodeURIComponent(login)}?s=48`;
const ago = (iso) => `<relative-time datetime="${esc(iso)}"></relative-time>`;

const STAR = '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M8 .9l2.2 4.5 4.9.7-3.6 3.5.9 4.9L8 12.2l-4.4 2.3.9-4.9L.9 6.1l4.9-.7z"/></svg>';
const WINDOWS = [
  ['recent', 'Recently active'],
  ['prs', 'Pull requests'],
  ['favorites', 'Favorites'],
  ['issues', 'Issues'],
];

async function api(path, token) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
  });
  if (!res.ok) throw Object.assign(new Error(`GitHub API ${res.status} on ${path}`), { status: res.status });
  return res.json();
}

const search = (q, token) =>
  api(`/search/issues?q=${encodeURIComponent(q)}&sort=updated&per_page=20`, token).then((r) => r.items);

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? 'Up late' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

async function mount() {
  document.documentElement.classList.toggle('ghd', isDashboard());
  const host = document.querySelector('.application-main');
  if (!isDashboard() || !host || host.querySelector('#ghd')) return;

  const root = document.createElement('div');
  root.id = 'ghd';
  host.prepend(root);

  const { token, favorites = [] } = await store.get(['token', 'favorites']);
  if (!token) return renderTokenForm(root);
  renderShell(root);

  try {
    const me = await api('/user', token);
    root.querySelector('.ghd-hello').textContent = `${greeting()}, ${me.name?.split(' ')[0] || me.login}`;
    root.querySelector('.ghd-me').src = avatar(me.login);
    const scope = `involves:${me.login} archived:false is:open`;
    const [events, prs, issues] = await Promise.all([
      api(`/users/${me.login}/events?per_page=100`, token),
      search(`is:pr ${scope}`, token),
      search(`is:issue ${scope}`, token),
    ]);
    const data = { recent: recentRepos(events, 20), favorites };
    fillRepos(root, data);
    fill(root, 'prs', prs.map(itemRow), 'No open pull requests involve you.');
    fill(root, 'issues', issues.map(itemRow), 'No open issues involve you.');

    root.onclick = async (ev) => {
      const star = ev.target.closest('.ghd-star');
      if (star) {
        const set = new Set(data.favorites);
        set.has(star.dataset.repo) ? set.delete(star.dataset.repo) : set.add(star.dataset.repo);
        data.favorites = [...set];
        await store.set({ favorites: data.favorites });
        fillRepos(root, data);
      } else if (ev.target.closest('.ghd-reset')) {
        await store.remove('token');
        root.remove();
        mount();
      }
    };
  } catch (err) {
    if (err.status === 401) await store.remove('token');
    renderTokenForm(root, err.status === 401 ? 'GitHub rejected that token. Paste a new one.' : err.message);
  }
}

function renderShell(root) {
  const skeleton = '<ul class="ghd-skel" aria-hidden="true">' + '<li><i></i><b></b></li>'.repeat(7) + '</ul>';
  root.innerHTML = `
    <div class="ghd-hero">
      <img class="ghd-me" alt="" width="48" height="48">
      <div>
        <h1 class="ghd-hello">${greeting()}</h1>
        <p class="ghd-sub">Pick up where you left off.</p>
      </div>
    </div>
    <div class="ghd-grid" aria-busy="true">
      ${WINDOWS.map(([key, title], i) => `
        <section class="ghd-card" data-win="${key}" style="--i:${i}" aria-labelledby="ghd-t-${key}">
          <header class="ghd-head">
            <h2 id="ghd-t-${key}">${title}</h2>
            <span class="ghd-count"></span>
          </header>
          <div class="ghd-body">${skeleton}</div>
        </section>`).join('')}
    </div>
    <p class="ghd-foot"><button class="ghd-reset">Change GitHub token</button></p>`;
}

function fill(root, key, rows, empty) {
  const win = root.querySelector(`[data-win="${key}"]`);
  win.querySelector('.ghd-count').textContent = rows.length || '';
  win.querySelector('.ghd-body').innerHTML = rows.length ? `<ul>${rows.join('')}</ul>` : `<p class="ghd-empty">${empty}</p>`;
  root.querySelector('.ghd-grid').removeAttribute('aria-busy');
}

function fillRepos(root, { recent, favorites }) {
  const fav = new Set(favorites);
  const row = (name, meta) => {
    const [owner, repo] = name.split('/');
    const on = fav.has(name);
    return `
      <li class="ghd-row">
        <img class="ghd-av" src="${avatar(owner)}" alt="" width="24" height="24" loading="lazy">
        <a class="ghd-main" href="/${esc(name)}">
          <span class="ghd-title"><span class="ghd-owner">${esc(owner)}/</span>${esc(repo)}</span>
          ${meta ? `<span class="ghd-meta">${meta}</span>` : ''}
        </a>
        <button class="ghd-star${on ? ' is-on' : ''}" data-repo="${esc(name)}" aria-pressed="${on}" aria-label="Favorite ${esc(name)}">${STAR}</button>
      </li>`;
  };
  fill(root, 'favorites', favorites.map((n) => row(n)), 'Star a repo in Recently active to pin it here.');
  fill(root, 'recent', recent.map((r) => row(r.name, `${r.label} ${ago(r.at)}`)), 'No pushes or new PRs in the last 90 days.');
}

function itemRow(i) {
  const repo = i.repository_url.split('/repos/')[1];
  return `
    <li class="ghd-row">
      <img class="ghd-av is-round" src="${esc(i.user.avatar_url)}&s=48" alt="" width="24" height="24" loading="lazy">
      <a class="ghd-main" href="${esc(i.html_url)}">
        <span class="ghd-title ghd-clamp">${esc(i.title)}</span>
        <span class="ghd-meta">
          <span class="ghd-pill">${esc(repo)} #${i.number}</span>
          ${i.draft ? '<span class="ghd-pill is-draft">Draft</span>' : ''}
          ${ago(i.updated_at)}
        </span>
      </a>
    </li>`;
}

function renderTokenForm(root, error = '') {
  root.innerHTML = `
    <div class="ghd-center">
      <form class="ghd-card ghd-token" style="--i:0" aria-labelledby="ghd-t-token">
        <header class="ghd-head"><h2 id="ghd-t-token">Connect GitHub</h2></header>
        <div class="ghd-body">
          <p class="ghd-lede">Your dashboard needs a personal access token to read your repos, pull requests and issues.</p>
          ${error ? `<p class="ghd-error" role="alert">${esc(error)}</p>` : ''}
          <label for="ghd-token">Token with <code>repo</code> scope</label>
          <input id="ghd-token" name="token" type="password" required placeholder="ghp_…" autocomplete="off" spellcheck="false">
          <div class="ghd-actions">
            <a href="https://github.com/settings/tokens/new?scopes=repo&description=GitHub%20Dashboard%2B" target="_blank" rel="noopener">Create a token</a>
            <button class="ghd-btn" type="submit">Connect</button>
          </div>
          <p class="ghd-fine">Stored only in this browser's extension storage.</p>
        </div>
      </form>
    </div>`;
  root.querySelector('form').onsubmit = async (ev) => {
    ev.preventDefault();
    await store.set({ token: ev.target.token.value.trim() });
    root.remove();
    mount();
  };
}

// Hide the stock dashboard before first paint, then mount once the DOM exists.
document.documentElement.classList.toggle('ghd', isDashboard());
document.addEventListener('DOMContentLoaded', mount);
// ponytail: covers Turbo + back/forward navigation; add a MutationObserver if GitHub's React router bypasses these.
document.addEventListener('turbo:load', mount);
window.addEventListener('popstate', mount);
