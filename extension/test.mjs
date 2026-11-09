// Run: node extension/test.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const ctx = {};
vm.runInNewContext(fs.readFileSync(new URL('./lib.js', import.meta.url), 'utf8'), ctx);

const ev = (type, repo, at, action) => ({ type, repo: { name: repo }, created_at: at, payload: { action } });
const out = ctx.recentRepos([
  ev('PushEvent', 'a/one', '3'),
  ev('WatchEvent', 'a/skip', '2'),
  ev('PullRequestEvent', 'b/two', '2', 'closed'),
  ev('PullRequestEvent', 'b/two', '1', 'opened'),
  ev('PushEvent', 'a/one', '0'),
]);
assert.deepEqual(JSON.parse(JSON.stringify(out)), [
  { name: 'a/one', label: 'Pushed', at: '3' },
  { name: 'b/two', label: 'Opened a PR', at: '1' },
]);
assert.equal(ctx.recentRepos([ev('PushEvent', 'x/1'), ev('PushEvent', 'x/2')], 1).length, 1);
assert.equal(ctx.esc(`<a href="x">'&`), '&#60;a href=&#34;x&#34;&#62;&#39;&#38;');
console.log('ok');
