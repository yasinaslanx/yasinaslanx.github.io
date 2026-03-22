// INSTABOT — Background Service Worker

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  // Analiz tamamlandı bildirimi
  if (msg.type === 'ANALIZ_DONE') {
    chrome.notifications.create('analiz_done', {
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'INSTABOT — Analiz Tamamlandı! 🎉',
      message: `@${msg.username}: ${msg.nonfollowers} kişi seni takip etmiyor (${msg.total} following içinden)`
    });
    // Sonuçları storage'a kaydet
    chrome.storage.local.set({ igData: msg.data, lastAnaliz: Date.now() });
    sendResponse({ ok: true });
  }

  // Unfollow turu tamamlandı bildirimi
  if (msg.type === 'UNFOLLOW_DONE') {
    chrome.notifications.create('unfollow_done', {
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'INSTABOT — Unfollow Turu Bitti ✅',
      message: `${msg.count} kişi unfollow edildi. Kalan: ${msg.kalan} kişi`
    });
    sendResponse({ ok: true });
  }

  // Popup'a veri gönder
  if (msg.type === 'GET_DATA') {
    chrome.storage.local.get(['igData', 'lastAnaliz'], (result) => {
      sendResponse(result);
    });
    return true; // async response
  }

  return true;
});
