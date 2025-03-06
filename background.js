// Listen for messages from content scripts (Newly accepted LeetCode problems)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "NEW_AC") {
    chrome.storage.local.get([request.data.title], (result) => {
      const existing = result[request.data.title];

      if (!existing) { // If it's a new problem
        request.data.reviewCount = 0;
        //request.data.lastReviewed = new Date().toISOString().split('T')[0]; // Store last reviewed date
        request.data.nextReviewDate = new Date().toISOString().split('T')[0]; // Start review today

        chrome.storage.local.set({ [request.data.title]: request.data }, () => {
          console.log(`✅ Saved problem: ${request.data.title}`);
        });
      }
    });
  }
});

// Function to calculate the next review date based on the Spaced Repetition Algorithm
function calcNextReview(reviewCount) {
  const intervals = [1, 3, 7, 14, 30]; // Dynamic intervals based on past reviews
  return intervals[reviewCount] || 30; // Default max interval
}

// Schedule a daily check for problems to review
chrome.alarms.create('dailyCheck', { periodInMinutes: 1440 }); // 1440 minutes = 1 day

// Listen for the daily alarm to trigger review notifications
chrome.alarms.onAlarm.addListener(() => {
  chrome.storage.local.get(null, (data) => {
    const today = new Date().toISOString().split('T')[0];

    Object.keys(data).forEach(title => {
      const problem = data[title];
      const lastDate = new Date(problem.nextReviewDate);

      if (lastDate.toISOString().split('T')[0] === today) {
        // Trigger notification for due questions
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icon.png',
          title: 'LeetCode Review Reminder!',
          message: `Time to review: ${title} (${problem.difficulty})`
        });

        // Update review count and next review date
        problem.reviewCount += 1;
        problem.lastReviewed = today;
        problem.nextReviewDate = new Date(Date.now() + calcNextReview(problem.reviewCount) * 86400000)
          .toISOString().split('T')[0];

        chrome.storage.local.set({ [title]: problem }, () => {
          console.log(`🔄 Updated review date for: ${title}, Next Review: ${problem.nextReviewDate}`);
        });
      }
    });
  });
});

// Listen for storage changes to debug data updates
chrome.storage.onChanged.addListener((changes, namespace) => {
  console.log("🔍 Storage updated:", changes);
});
