// INSTABOT — Content Script (instagram.com'da çalışır)

// Popup'tan mesaj dinle
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  if (msg.type === 'START_ANALIZ') {
    startAnaliz().then(result => sendResponse({ ok: true, result })).catch(e => sendResponse({ ok: false, error: e.message }));
    return true;
  }

  if (msg.type === 'START_UNFOLLOW') {
    startUnfollow(msg.limit || 50).then(result => sendResponse({ ok: true, result })).catch(e => sendResponse({ ok: false, error: e.message }));
    return true;
  }

  if (msg.type === 'GET_STATUS') {
    sendResponse({ igData: window.__ig || null, progress: window.__igProgress || null });
    return true;
  }

  return true;
});

// =====================
// ANALİZ FONKSİYONU
// =====================
async function startAnaliz() {
  const username = window.location.pathname.replace(/\//g, '');
  if (!username) throw new Error('Profil sayfasında değilsin!');

  // İlerlemeyi bildir
  sendProgress({ step: 'ID alınıyor...', pct: 0 });

  const ir = await fetch(`/api/v1/users/web_profile_info/?username=${username}`, {
    headers: { 'x-ig-app-id': '936619743392459', 'x-requested-with': 'XMLHttpRequest' }
  });
  const uid = (await ir.json())?.data?.user?.id;
  if (!uid) throw new Error('ID alınamadı!');

  sendProgress({ step: 'Following çekiliyor...', pct: 5 });
  const following = await getFollowing(uid);

  sendProgress({ step: `${following.length} kişi kontrol ediliyor...`, pct: 20, total: following.length, checked: 0 });

  const nonfollowers = [], unknown = [];
  for (let i = 0; i < following.length; i++) {
    const user = following[i];
    const result = await checkFollowsBack(user);
    if (result === false) nonfollowers.push(user);
    else if (result === null) unknown.push(user);

    const pct = 20 + Math.round((i / following.length) * 80);
    sendProgress({ step: `Kontrol ediliyor... [${i+1}/${following.length}]`, pct, checked: i+1, total: following.length, nf: nonfollowers.length });

    await sleep(1200);
  }

  window.__ig = { username, following, nonfollowers, unknown };

  // Background'a bildir
  chrome.runtime.sendMessage({
    type: 'ANALIZ_DONE',
    username,
    nonfollowers: nonfollowers.length,
    total: following.length,
    data: window.__ig
  });

  sendProgress({ step: 'Tamamlandı!', pct: 100, done: true });
  return window.__ig;
}

// =====================
// UNFOLLOW FONKSİYONU
// =====================
async function startUnfollow(limit) {
  if (!window.__ig?.nonfollowers?.length) throw new Error('Önce analiz yap!');

  const KEY = 'ig_uf_' + window.__ig.username;
  const done = JSON.parse(localStorage.getItem(KEY) || '[]');
  const dSet = new Set(done);
  const batch = window.__ig.nonfollowers.filter(u => !dSet.has(u.username)).slice(0, limit);
  const csrf = document.cookie.match(/csrftoken=([^;]+)/)?.[1] || '';

  if (!batch.length) return { ok: 0, fail: 0, kalan: 0 };

  let ok = 0, fail = 0;
  for (const user of batch) {
    try {
      const r = await fetch(`/api/v1/friendships/destroy/${user.id}/`, {
        method: 'POST',
        headers: {
          'x-ig-app-id': '936619743392459',
          'x-csrftoken': csrf,
          'x-requested-with': 'XMLHttpRequest',
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      if (r.ok) {
        ok++;
        done.push(user.username);
        localStorage.setItem(KEY, JSON.stringify(done));
      } else if (r.status === 429) {
        await sleep(60000);
      } else {
        fail++;
      }
    } catch (e) { fail++; }

    sendProgress({ step: `Unfollow [${ok+fail}/${batch.length}]`, pct: Math.round(((ok+fail)/batch.length)*100) });
    await sleep(2000 + Math.random() * 2000);
  }

  const kalan = window.__ig.nonfollowers.length - done.length;
  chrome.runtime.sendMessage({ type: 'UNFOLLOW_DONE', count: ok, kalan });
  return { ok, fail, kalan };
}

// =====================
// YARDIMCI FONKSİYONLAR
// =====================
async function getFollowing(uid) {
  let list = [], cursor = null, page = 1;
  while (true) {
    let url = `/api/v1/friendships/${uid}/following/?count=200`;
    if (cursor) url += `&max_id=${cursor}`;
    try {
      const res = await fetch(url, {
        headers: { 'x-ig-app-id': '936619743392459', 'x-requested-with': 'XMLHttpRequest' }
      });
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('json')) { await sleep(60000); continue; }
      if (res.status === 429) { await sleep(60000); continue; }
      if (!res.ok) break;
      const d = await res.json();
      list.push(...(d.users || []).map(u => ({
        username: u.username, id: String(u.pk),
        full_name: u.full_name || '', is_private: u.is_private || false,
        pic: u.profile_pic_url || ''
      })));
      sendProgress({ step: `Following sayfa ${page}: ${list.length} kişi`, pct: 5 + Math.min(15, page * 2) });
      cursor = d.next_max_id || null;
      if (!cursor) break;
      page++;
      await sleep(1500);
    } catch (e) { await sleep(10000); }
  }
  return list;
}

async function checkFollowsBack(user) {
  let attempts = 0;
  while (attempts < 3) {
    try {
      const res = await fetch(`/api/v1/friendships/show/${user.id}/`, {
        headers: { 'x-ig-app-id': '936619743392459', 'x-requested-with': 'XMLHttpRequest' }
      });
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('json')) { await sleep(60000); continue; }
      if (res.status === 429) { await sleep(60000); continue; }
      if (!res.ok) return null;
      const d = await res.json();
      return d.followed_by === true;
    } catch (e) { attempts++; await sleep(3000); }
  }
  return null;
}

function sendProgress(data) {
  window.__igProgress = data;
  chrome.runtime.sendMessage({ type: 'PROGRESS_UPDATE', ...data }).catch(() => {});
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
