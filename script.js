// 플랫폼 목록 정의
const platforms = {
  text2image: [
    { value: 'midjourney', label: 'Midjourney', guide: 'guides/image_midjourney.txt' },
    { value: 'whisk', label: 'Google Whisk', guide: 'guides/image_whisk.txt' },
    { value: 'flux', label: 'Flux', guide: 'guides/image_flux.txt' },
    { value: 'dreamina', label: 'Dreamina', guide: 'guides/image_dreamina.txt' },
  ],
  text2video: [
    { value: 'sora', label: 'Sora AI', guide: 'guides/video_sora.txt' },
    { value: 'veo2', label: 'Google Flow (Veo2)', guide: 'guides/video_veo2.txt' },
    { value: 'veo3', label: 'Google Flow (Veo3)', guide: 'guides/video_veo3.txt' },
    { value: 'runway', label: 'Runway', guide: 'guides/video_runway.txt' },
    { value: 'kling', label: 'Kling', guide: 'guides/video_kling.txt' },
  ],
  image2video: [
    { value: 'sora', label: 'Sora AI', guide: 'guides/video_sora.txt' },
    { value: 'veo2', label: 'Google Flow (Veo2)', guide: 'guides/video_veo2.txt' },
    { value: 'veo3', label: 'Google Flow (Veo3)', guide: 'guides/video_veo3.txt' },
    { value: 'runway', label: 'Runway', guide: 'guides/video_runway.txt' },
    { value: 'kling', label: 'Kling', guide: 'guides/video_kling.txt' },
  ]
};

const typeSelect = document.getElementById('convert-type');
const platformSelect = document.getElementById('platform');
const apikeyInput = document.getElementById('apikey');
const engineSelect = document.getElementById('engine');
const platformTitle = document.getElementById('platform-title');
const settingsBtn = document.getElementById('settings-btn');
const settingsPanel = document.getElementById('settings-panel');

const platformTitleMap = {
  midjourney: 'Midjourney',
  whisk: '구글 Whisk',
  flux: 'Flux',
  dreamina: 'Dreamina',
  sora: 'Sora',
  veo2: 'Google Flow Veo2',
  veo3: 'Google Flow Veo3',
  runway: 'Runway',
  kling: 'Kling'
};
const typeLabelMap = {
  text2image: '이미지 생성',
  text2video: '비디오 생성',
  image2video: '비디오 생성'
};

function updatePlatformTitle() {
  const convertType = typeSelect.value;
  const platform = platformSelect.value;
  const platformName = platformTitleMap[platform] || '';
  const typeLabel = typeLabelMap[convertType] || '';
  if (platformName && typeLabel) {
    platformTitle.textContent = `${platformName}(${typeLabel})`;
  } else {
    platformTitle.textContent = '';
  }
}

function updatePlatformOptions() {
  const type = typeSelect.value;
  platformSelect.innerHTML = '';
  (platforms[type] || []).forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.value;
    opt.textContent = p.label;
    platformSelect.appendChild(opt);
  });
  loadGuide();
  updatePlatformTitle();
}

function loadGuide() {
  const type = typeSelect.value;
  const platform = platformSelect.value;
  const platformObj = platforms[type].find(p => p.value === platform);
  if (!platformObj) return;
  fetch(platformObj.guide)
    .then(res => res.ok ? res.text() : '')
    .then(text => {
      const chatArea = document.getElementById('chat-area');
      Array.from(chatArea.querySelectorAll('.chat-bubble.guide')).forEach(e => e.remove());
      if (text.trim()) {
        const guideDiv = document.createElement('div');
        guideDiv.className = 'chat-bubble guide';
        guideDiv.style.alignSelf = 'flex-start';
        guideDiv.innerHTML = `<span class='guide-label'>JAY</span> ${text.replace(/\n/g, '<br>')}`;
        chatArea.appendChild(guideDiv);
        chatArea.scrollTop = chatArea.scrollHeight;
      }
    });
}

// API 키 저장/불러오기
function saveApiKey(key) {
  localStorage.setItem('google_translate_api_key', key);
}
function loadApiKey() {
  return localStorage.getItem('google_translate_api_key') || '';
}
if (apikeyInput) {
  apikeyInput.value = loadApiKey();
  apikeyInput.addEventListener('input', (e) => {
    saveApiKey(e.target.value);
  });
}

// 더미 번역 함수 (실제 번역 없이 예시만 출력)
function dummyTranslate(text) {
  if (!text.trim()) return '';
  return '[영어 번역 예시] ' + text;
}

// OpenAI(ChatGPT) 번역 함수
async function openaiTranslate(text, apikey) {
  const url = 'https://api.openai.com/v1/chat/completions';
  const body = {
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'You are a professional English translator.' },
      { role: 'user', content: `Translate the following Korean text to natural English:\n${text}` }
    ],
    temperature: 0.2
  };
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apikey}`
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('OpenAI API 요청 실패');
    const data = await res.json();
    if (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      return data.choices[0].message.content.trim();
    } else {
      throw new Error('번역 결과 없음');
    }
  } catch (e) {
    throw new Error('번역 실패: ' + e.message);
  }
}

// Gemini(Google) 번역 함수
async function geminiTranslate(text, apikey) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + apikey;
  const body = {
    contents: [
      { parts: [ { text: `Translate the following Korean text to natural English:\n${text}` } ] }
    ]
  };
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('Gemini API 요청 실패');
    const data = await res.json();
    if (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text) {
      return data.candidates[0].content.parts[0].text.trim();
    } else {
      throw new Error('번역 결과 없음');
    }
  } catch (e) {
    throw new Error('번역 실패: ' + e.message);
  }
}

// 채팅 전송/버블 표시
const chatForm = document.getElementById('chat-form');
const chatArea = document.getElementById('chat-area');
chatForm.onsubmit = function(e) {
  e.preventDefault();
  document.getElementById('convert').click();
};
document.getElementById('convert').onclick = async function(e) {
  e.preventDefault();
  const promptInput = document.getElementById('prompt');
  const prompt = promptInput.value.trim();
  if (!prompt) return;
  const apikey = apikeyInput.value.trim();
  const engine = engineSelect.value;
  chatArea.innerHTML += `<div class='chat-bubble' style='align-self:flex-start;background:#23262F;color:#B0B3C7;'><span class='guide-label'>ME</span> ${prompt}</div>`;
  promptInput.value = '';
  chatArea.scrollTop = chatArea.scrollHeight;
  let translated = '';
  try {
    if (engine === 'openai') {
      translated = await openaiTranslate(prompt, apikey);
    } else if (engine === 'gemini') {
      translated = await geminiTranslate(prompt, apikey);
    } else {
      translated = dummyTranslate(prompt);
    }
    chatArea.innerHTML += `<div class='chat-bubble user'><span class='user-label'>JAY</span> ${translated}</div>`;
  } catch (err) {
    chatArea.innerHTML += `<div class='chat-bubble' style='background:#ff3b3b;color:#fff;'>${err.message}</div>`;
  }
  chatArea.scrollTop = chatArea.scrollHeight;
};

// 설정 패널 토글
settingsBtn.onclick = function() {
  settingsPanel.classList.toggle('active');
};
document.addEventListener('click', function(e) {
  if (!e.target.closest('.settings-btn') && !e.target.closest('.settings-panel')) {
    settingsPanel.classList.remove('active');
  }
});

typeSelect.addEventListener('change', function() {
  updatePlatformOptions();
  updatePlatformTitle();
});
platformSelect.addEventListener('change', updatePlatformTitle);
document.addEventListener('DOMContentLoaded', function() {
  updatePlatformOptions();
  updatePlatformTitle();
}); 
