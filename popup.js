document.getElementById('viewList').addEventListener('click', () => {
  chrome.tabs.create({ url: 'options.html' });
});

// Load problems from storage
chrome.storage.local.get(null, (data) => {
  const today = new Date().toISOString().split('T')[0];
  const dueTodayList = document.getElementById('dueTodayList');
  const upcomingList = document.getElementById('upcomingList');
  const reviewedList = document.getElementById('reviewedList');

  let problems = Object.values(data);

  function updateDisplay() {
    const selectedDifficulty = document.getElementById('filterDifficulty').value;
    const sortBy = document.getElementById('sortBy').value;

    let filteredProblems = problems.filter(p => selectedDifficulty === "all" || p.difficulty === selectedDifficulty);
    
    filteredProblems.sort((a, b) => {
      if (sortBy === "nextReviewDate") return new Date(a.nextReviewDate) - new Date(b.nextReviewDate);
      if (sortBy === "lastReviewed") return new Date(a.lastReviewed || a.date) - new Date(b.lastReviewed || b.date);
      if (sortBy === "difficulty") return ["Easy", "Medium", "Hard"].indexOf(a.difficulty) - ["Easy", "Medium", "Hard"].indexOf(b.difficulty);
    });

    dueTodayList.innerHTML = "";
    upcomingList.innerHTML = "";
    reviewedList.innerHTML = "";

    filteredProblems.forEach(problem => {
      const listItem = document.createElement('li');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.dataset.title = problem.title;
      checkbox.checked = problem.lastReviewed === today; // If reviewed today, keep it checked

      const label = document.createElement('label');
      //label.textContent = problem.title;
      label.innerHTML = `<a href="${problem.url}" target="_blank" class="questionlink">[${problem.id}] ${problem.title}</a>`;
      const difficultyTag = document.createElement('span');
      difficultyTag.className = `difficulty ${problem.difficulty.toLowerCase()}`;
      difficultyTag.textContent = problem.difficulty;

      listItem.appendChild(checkbox);
      listItem.appendChild(label);
      listItem.appendChild(difficultyTag);

      if (problem.lastReviewed === today) {
        // ✅ If reviewed today, move to "Reviewed"
        reviewedList.appendChild(listItem);
        listItem.style.textDecoration = "line-through";
      } else if (problem.nextReviewDate === today) {
        // ✅ If due today, add to "Due Today" (only if not checked)
        dueTodayList.appendChild(listItem);
      } else {
        // ✅ Future review → "Upcoming"
        upcomingList.appendChild(listItem);
      }

      // ✅ Listen for checkbox change (Mark Reviewed or Move Back)
      checkbox.addEventListener('change', (event) => {
        if (event.target.checked) {
          // Mark as reviewed today
          problem.reviewCount += 1;
          problem.lastReviewed = today;
          problem.nextReviewDate = new Date(Date.now() + calcNextReview(problem.reviewCount) * 86400000)
            .toISOString().split('T')[0];

          // ✅ Save updated problem and re-render UI
          chrome.storage.local.set({ [problem.title]: problem }, () => {
            console.log(`✅ Marked as Reviewed: ${problem.title}, Next Review: ${problem.nextReviewDate}`);
            updateDisplay();
          });
        } else {
          // 🚨 If unchecked, move back to "Due Today"
          problem.reviewCount = Math.max(0, problem.reviewCount - 1); // Reduce review count
          problem.lastReviewed = null; // Reset last reviewed date
          problem.nextReviewDate = today; // Move back to today

          // ✅ Save changes and re-render
          chrome.storage.local.set({ [problem.title]: problem }, () => {
            console.log(`🔄 Unchecked: ${problem.title}, moved back to Due Today`);
            updateDisplay();
          });
        }
      });
    });
  }

  document.getElementById('filterDifficulty').addEventListener('change', updateDisplay);
  document.getElementById('sortBy').addEventListener('change', updateDisplay);
  updateDisplay();
});

// Function to calculate the next review interval based on performance
function calcNextReview(reviewCount) {
  const intervals = [1, 3, 7, 14, 30]; // More spaced intervals over time
  return intervals[reviewCount] || 30;
}
