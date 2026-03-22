// INSTABOT — Popup Script

const avs = ['a0','a1','a2','a3','a4','a5','a6','a7'];
let allData = null;
let isAnalyzing = false;

document.addEventListener('DOMContentLoaded', async () => {
  await checkTab();
  await loadStoredData();
  listenProgress();

  document.getElementById('btn-analiz').addEventListener('click', startAnaliz);
  document.getElementById('btn-unfollow').addEventListener('click', startUnfollow);
  document.getElementById('btn-dashboard').addEventListener('click', openDashboard);
  document.getElementById('search').addEventListener('input', filterList);
});

async function checkTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const isIG = tab?.url?.includes('instagram.com');
  if (!isIG) {
    document.getElementById('view-notig').style.display = 'block';
    setStatus('Instagram değil', '#ff2d55');
    return;
  }
  document.getElementById('view-ready').style.display = 'block';
  const username = new URL(tab.url).pathname.replace(/\//g, '');
  setStatus(username ? '@' + username : 'Instagram açık', '#00ff88');
}

async function loadStoredData() {
  chrome.runtime.sendMessage({ type: 'GET_DATA' }, (result) => {
    if (chrome.runtime.lastError) return;
    if (result?.igData) {
      allData = result.igData;
      renderData(allData);
      if (result.lastAnaliz) {
        const d = new Date(result.lastAnaliz);
        document.getElementById('last-time').textContent =
          d.toLocaleDateString('tr-TR') + ' ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      }
    }
  });
}

function listenProgress() {
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'PROGRESS_UPDATE') updateProgress(msg);
    if (msg.type === 'ANALIZ_DONE') {
      isAnalyzing = false;
      loadStoredData();
      hideProgress();
      const btn = document.getElementById('btn-analiz');
      btn.disabled = false;
      btn.textContent = '🔄 YENİDEN ANALİZ ET';
    }
  });
}

async function startAnaliz() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  isAnalyzing = true;
  const btn = document.getElementById('btn-analiz');
  btn.disabled = true;
  btn.textContent = '⏳ Analiz ediliyor...';
  showProgress();

  chrome.tabs.sendMessage(tab.id, { type: 'START_ANALIZ' }, (response) => {
    if (chrome.runtime.lastError) {
      alert('Hata: Sayfayı F5 ile yenile ve tekrar dene.');
      btn.disabled = false;
      btn.textContent = '🔍 ANALİZİ BAŞLAT';
      isAnalyzing = false;
      hideProgress();
    }
  });
}

async function startUnfollow() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  const btn = document.getElementById('btn-unfollow');
  btn.disabled = true;
  btn.textContent = '⏳ Unfollow yapılıyor...';
  showProgress();

  chrome.tabs.sendMessage(tab.id, { type: 'START_UNFOLLOW', limit: 50 }, (response) => {
    if (chrome.runtime.lastError) {
      alert('Hata: Sayfayı F5 ile yenile ve tekrar dene.');
    }
    btn.disabled = false;
    btn.textContent = '❌ UNFOLLOW TURU (50)';
    hideProgress();
    loadStoredData();
  });
}

function openDashboard() {
  if (allData) {
    chrome.storage.local.set({ dashboardData: allData }, () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
    });
  } else {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
  }
}

function renderData(data) {
  const { username, following, nonfollowers } = data;
  const KEY = 'ig_uf_' + username;

  document.getElementById('st-fo').textContent = following.length;
  document.getElementById('st-nf').textContent = nonfollowers.length;

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab?.url?.includes('instagram.com')) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (key) => JSON.parse(localStorage.getItem(key) || '[]').length,
        args: [KEY]
      }, (results) => {
        if (!chrome.runtime.lastError) {
          document.getElementById('st-done').textContent = results?.[0]?.result || 0;
        }
      });
    }
  });

  if (nonfollowers.length > 0) {
    document.getElementById('btn-unfollow').style.display = 'flex';
    document.getElementById('btn-dashboard').style.display = 'flex';
    document.getElementById('nf-section').style.display = 'block';
    renderList(nonfollowers);
    document.getElementById('lastinfo').textContent =
      `@${username} · ${following.length} following · ${nonfollowers.length} takip etmeyen`;
  }

  document.getElementById('btn-analiz').textContent = '🔄 YENİDEN ANALİZ ET';
}

function renderList(list) {
  document.getElementById('nflist').innerHTML = list.map((u, i) => `
    <div class="ucard">
      <div class="uav-fb ${avs[i%8]}">${u.username[0].toUpperCase()}</div>
      <div style="flex:1;min-width:0">
        <div class="uname">@${u.username}</div>
        ${u.full_name ? `<div class="ufn">${u.full_name}</div>` : ''}
      </div>
      ${u.is_private ? '<span class="utag">🔒 GİZLİ</span>' : ''}
    </div>
  `).join('');
}

function filterList() {
  if (!allData) return;
  const q = document.getElementById('search').value.toLowerCase();
  const f = allData.nonfollowers.filter(u =>
    u.username.toLowerCase().includes(q) || (u.full_name || '').toLowerCase().includes(q)
  );
  renderList(f);
}

function showProgress() { document.getElementById('prog-wrap').style.display = 'block'; }
function hideProgress() { document.getElementById('prog-wrap').style.display = 'none'; }

function updateProgress(msg) {
  document.getElementById('pbar').style.width = (msg.pct || 0) + '%';
  document.getElementById('prog-pct').textContent = (msg.pct || 0) + '%';
  document.getElementById('prog-step').textContent = msg.step || '';
  if (msg.nf !== undefined) document.getElementById('st-nf').textContent = msg.nf;
}

function setStatus(text, color) {
  const el = document.getElementById('ig-status');
  el.textContent = text;
  el.style.color = color;
}
