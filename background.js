// Function to calculate the next review date based on the Spaced Repetition Algorithm
function calcNextReview(reviewCount) {
  const intervals = [1, 3, 7, 14, 30]; // Dynamic intervals based on past reviews
  return intervals[reviewCount] || 30; // Default max interval
}

//calculate the next review date
function getNextReviewDate(problem) {
  const baseDate = new Date(problem.date); //first AC date stored locally
  baseDate.setDate(baseDate.getDate() + calcNextReview(problem.reviewCount));
  return baseDate.toISOString().split('T')[0];
}

// Listen for messages from content scripts (Newly accepted LeetCode problems)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "NEW_AC") {
    //chrome.storage.local.get([request.data.title], (result) => {
      chrome.storage.local.get([request.data.id], (result) => {
      //const existing = result[request.data.title];
      const existing = result[request.data.id];

      if (!existing) { // If it's a new problem
        request.data.reviewCount = 0;

        // 🚀 First review should be tomorrow (1 day later)
        request.data.nextReviewDate = new Date(Date.now() + calcNextReview(0) * 86400000).toISOString().split('T')[0];

        chrome.storage.local.set({ [request.data.title]: request.data }, () => {
          console.log(`✅ Saved problem: ${request.data.title}, First Review on: ${request.data.nextReviewDate}`);
        });
      }
      
      else {
        // ✅ Already exists, update review date
        existing.reviewCount += 1;
        existing.lastReviewed = new Date().toISOString().split('T')[0]; // Mark it as reviewed today
        existing.nextReviewDate = new Date(Date.now() + calcNextReview(existing.reviewCount) * 86400000).toISOString().split('T')[0];

        chrome.storage.local.set({ [request.data.id]: existing }, () => {
          console.log(`🔄 Updated problem: ${request.data.title}, Next Review on: ${existing.nextReviewDate}`);
        });
      }
    
    });
  }
});



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
        //problem.lastReviewed = today;
        //problem.nextReviewDate = new Date(Date.now() + calcNextReview(problem.reviewCount) * 86400000)
          //.toISOString().split('T')[0];

        //chrome.storage.local.set({ [title]: problem }, () => {
          //console.log(`🔄 Updated review date for: ${title}, Next Review: ${problem.nextReviewDate}`);
        chrome.storage.local.set({ [title]: problem }, () => {
          console.log(`🔄 Updated review count for: ${title}, Next Review: ${getNextReviewDate(problem)}`);
        });
      }
    });
  });
});

// Listen for storage changes to debug data updates
chrome.storage.onChanged.addListener((changes, namespace) => {
  console.log("🔍 Storage updated:", changes);
});
