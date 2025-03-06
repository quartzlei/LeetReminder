// 安全获取难度信息
// ====== 难度缓存 ======
let difficultyCache = null;

// ====== 安全获取难度信息（优化版） ======
function getProblemDifficulty() {
  if (difficultyCache) return difficultyCache;

  try {
    // 调试步骤1：检查所有JSON脚本标签
    const scriptTags = Array.from(document.querySelectorAll('script[type="application/json"]'));
    console.debug('[扩展] 找到的JSON脚本数量:', scriptTags.length);

    // 优先尝试精准定位
    const targetTag = scriptTags.find(tag => {
      try {
        const data = JSON.parse(tag.textContent);
        return data?.props?.pageProps?.dehydratedState?.queries?.some(
          q => q?.state?.data?.question?.difficulty
        );
      } catch {
        return false;
      }
    });

    if (!targetTag) {
      console.warn('[扩展] 未找到目标script标签，启用深度搜索');
      return getProblemDifficultyFallback();
    }

    // 调试步骤2：输出找到的标签内容
    console.debug('[扩展] 目标标签内容:', targetTag.textContent.substring(0, 200) + '...');

    // 精准解析
    const { queries } = JSON.parse(targetTag.textContent).props.pageProps.dehydratedState;
    const questionData = queries.find(q => q?.state?.data?.question)?.state?.data?.question;

    // 调试步骤3：输出解析结果
    console.debug('[扩展] 解析到的questionData:', questionData);

    return (difficultyCache = questionData?.difficulty || '未知难度');
  } catch (e) {
    console.error('[扩展] 精准解析失败，启用备用方案:', e);
    return getProblemDifficultyFallback();
  }
}

// ====== 备用深度搜索方案（优化版） ======
function getProblemDifficultyFallback() {
  try {
    let result = '未知难度';
    const maxDepth = 5; // 限制搜索深度

    const quickSearch = (obj, depth = 0) => {
      if (depth > maxDepth) return;
      if (typeof obj !== 'object' || obj === null) return;

      if (obj.difficulty && ['Easy', 'Medium', 'Hard'].includes(obj.difficulty)) {
        result = obj.difficulty;
        throw 'FOUND'; // 提前终止搜索
      }

      for (const key in obj) {
        quickSearch(obj[key], depth + 1);
      }
    };

    document.querySelectorAll('script[type="application/json"]').forEach(tag => {
      try {
        quickSearch(JSON.parse(tag.textContent));
      } catch (e) {
        if (e === 'FOUND') return; // 提前终止循环
      }
    });

    return result;
  } catch (e) {
    console.error('[扩展] 备用方案失败:', e);
    return '未知难度';
  }
}

//题目编号
function getQuestionId() {
  try {
    // Select all <a> tags that contain problem links
    const problemLinks = document.querySelectorAll('a[href^="/problems/"]');

    for (let link of problemLinks) {
      const text = link.innerText.trim(); // Get the visible text
      const match = text.match(/^(\d+)\.\s*(.+)$/); // Regex to extract "ID. Title"

      if (match) {
        return match[1]; // Return the extracted question ID
      }
    }
  } catch (e) {
    console.error("❌ Failed to extract questionId:", e);
  }

  return "???"; // Default if extraction fails
}

//url of question page
function getProblemUrl() {
  try {
    // Select the meta tag with property="og:url"
    const metaTag = document.querySelector('meta[property="og:url"]');

    if (metaTag) {
      return metaTag.content.trim(); // Extract and return the URL
    }
  } catch (e) {
    console.error("❌ Failed to extract problem URL:", e);
  }

  return window.location.href; // Fallback: Use current page URL
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
  let id = getQuestionId();
  let url = getProblemUrl()
  return { id, title, difficulty, url };
}
//get local time
function getLocalDateString() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString().split('T')[0];
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
          //date: new Date().toISOString().split('T')[0],
          date: getLocalDateString(),
          reviewCount: 0 //intital review count
          //nextReviewDate: new Date().toISOString().split('T')[0]
          //nextReviewDate: getLocalDateString()
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
