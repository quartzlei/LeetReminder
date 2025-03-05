chrome.storage.local.get(null, (data) => {
  const list = document.getElementById('list');
  Object.values(data).forEach(problem => {
    const div = document.createElement('div');
    div.className = 'problem';
    div.innerHTML = `
      <h3>${problem.title} (${problem.difficulty})</h3>
      <p>First-time AC:${problem.date},Next Time:${problem.nextReviewDate}</p>
    `;
    list.appendChild(div);
  });
});
