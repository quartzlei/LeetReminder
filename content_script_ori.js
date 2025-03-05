// 安全获取难度信息
// ====== 安全获取难度信息 ======
function getProblemDifficulty() {
  try {
    // 1. 查找所有包含题目数据的<script>标签
    const scriptTags = document.querySelectorAll('script[type="application/json"]');

    // 2. 遍历所有JSON脚本寻找包含题目数据的部分
    for (const tag of scriptTags) {
      try {
        const data = JSON.parse(tag.textContent);

        // 3. 深度搜索难度信息
        const findDifficulty = (obj) => {
          if (typeof obj !== 'object' || obj === null) return;

          if (obj.difficulty && ['Easy', 'Medium', 'Hard'].includes(obj.difficulty)) {
            return obj.difficulty;
          }

          for (const key in obj) {
            const result = findDifficulty(obj[key]);
            if (result) return result;
          }
        };

        const difficulty = findDifficulty(data);
        if (difficulty) return difficulty;
      } catch (e) {
        continue; // 跳过解析失败的标签
      }
    }

    return '未知难度';
  } catch (e) {
    console.error('[扩展] 难度解析失败:', e);
    return '未知难度';
  }
}


// ====== 安全获取题目信息 ======
function getProblemInfo() {
  // 1. 标题安全获取（100% 无报错）
  const title = (document.title || '')
    .replace(' - LeetCode', '')
    .replace(/^\d+\.\s*/, '')
    .trim();

  // 2. 难度安全获取（添加完整null检查）
  let difficulty = getProblemDifficulty();
  try {
    const difficultyElement = document.querySelector('.text-difficulty-easy, .text-difficulty-medium, .text-difficulty-hard');
    if (difficultyElement?.textContent) {
      difficulty = difficultyElement.textContent.split(' ')[0].trim();
    }
  } catch (e) {
    console.warn('[扩展] 难度获取失败:', e);
  }

  return { title, difficulty };
}

// ====== 提交结果监听 ======
function checkSubmission() {
  // 安全检测结果元素
  const resultElement = document.querySelector('[data-e2e-locator="submission-result"]');
  if (!resultElement?.textContent) return;

  // 结果判断
  if (/Accepted/i.test(resultElement.textContent)) {
    const problem = getProblemInfo();
    console.log("✅ 捕获题目：", problem);

    // 发送数据前校验
    if (problem.title) {
      chrome.runtime.sendMessage({
        type: "NEW_AC",
        data: {
          ...problem,
          date: new Date().toISOString().split('T')[0],
          reviewCount: 0,
          nextReviewDate: new Date().toISOString().split('T')[0]
        }
      });
    }
  }
}

// ====== 安全启动监听 ======
function init() {
  // 首次检查
  setTimeout(checkSubmission, 1000);

  // 动态内容监听
  const observer = new MutationObserver(checkSubmission);
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// 页面加载完成后启动
if (document.readyState === 'complete') {
  init();
} else {
  window.addEventListener('load', init);
}
