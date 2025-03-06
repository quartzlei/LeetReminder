function toLocalDate(utcDateString) {
  if (!utcDateString) return "Unknown";
  const date = new Date(utcDateString + 'T00:00:00Z');
  return date.toLocaleDateString();
}

// Function to dynamically calculate `nextReviewDate`
function getNextReviewDate(problem) {
  const baseDate = new Date(problem.date);
  baseDate.setDate(baseDate.getDate() + calcNextReview(problem.reviewCount));
  return baseDate.toISOString().split('T')[0];
}

chrome.storage.local.get(null, (data) => {
  const list = document.getElementById('list');
  Object.values(data).forEach(problem => {
    const div = document.createElement('div');
    div.className = 'problem';

    div.innerHTML = `
      <h3>${problem.title} (${problem.difficulty})</h3>
      <p>First-time AC: ${toLocalDate(problem.date)}, Next Review: ${toLocalDate(getNextReviewDate(problem))}</p>
    `;
    list.appendChild(div);
  });
});

// Same Spaced Repetition logic as in `background.js`
function calcNextReview(reviewCount) {
  const intervals = [1, 3, 7, 14, 30];
  return intervals[reviewCount] || 30;
}
