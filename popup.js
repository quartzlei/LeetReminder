document.getElementById('viewList').addEventListener('click', () => {
  chrome.tabs.create({ url: 'options.html' });
});

// 显示今日待复习数量
chrome.storage.local.get(null, (data) => {
  const today = new Date().toISOString().split('T')[0];
  const count = Object.values(data).filter(p => p.nextReviewDate === today).length;
  document.getElementById('count').textContent = count;
});
