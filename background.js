// 收到新AC的题目
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "NEW_AC") {
    chrome.storage.local.get([request.data.title], (result) => {
      const existing = result[request.data.title];
      if (!existing) { // 如果是新题
        chrome.storage.local.set({ [request.data.title]: request.data });
      }
    });
  }
});

// 计算下次复习日期（简化版算法）
function calcNextReview(reviewCount) {
  const intervals = [1, 3, 7, 14]; // 间隔天数：1天→3天→7天→14天
  return intervals[reviewCount] || 14;
}

// 每天检查复习任务
chrome.alarms.create('dailyCheck', { periodInMinutes: 1440 });

chrome.alarms.onAlarm.addListener(() => {
  chrome.storage.local.get(null, (data) => {
    const today = new Date();
    Object.keys(data).forEach(title => {
      const problem = data[title];
      const lastDate = new Date(problem.nextReviewDate);
      if (lastDate <= today) {
        // 触发通知
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icon.png',
          title: 'Time to Review！',
          message: `What need to be reviewd today：${title}（${problem.difficulty}）`
        });
        // 更新下次复习日期
        problem.reviewCount += 1;
        problem.nextReviewDate = new Date(today.getTime() + calcNextReview(problem.reviewCount) * 86400000)
          .toISOString().split('T')[0];
        chrome.storage.local.set({ [title]: problem });
      }
    });
  });
});
