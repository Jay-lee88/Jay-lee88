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

// 플랫폼별 프롬프트 포맷팅 함수
function formatPrompt(text, platform, type) {
  const basePrompt = text.trim();
  const commonQuality = "high quality, detailed, professional";
  
  // 이미지 생성 플랫폼
  if (type === 'text2image') {
    switch(platform) {
      case 'midjourney':
        return `${basePrompt}, ${commonQuality}, 8k uhd, highly detailed, professional photography, photorealistic, --ar 16:9 --quality 2 --style raw`;
      case 'whisk':
        return `Highly detailed scene: ${basePrompt}. ${commonQuality}, photorealistic quality, masterful composition, perfect lighting, ultra-realistic details`;
      case 'flux':
        return `Create a photorealistic scene: ${basePrompt}. ${commonQuality}, cinematic lighting, ultra-detailed textures, professional grade`;
      case 'dreamina':
        return `${basePrompt}, ${commonQuality}, realistic lighting, perfect composition, professional photography`;
      default:
        return basePrompt;
    }
  }
  // 비디오 생성 플랫폼
  else if (type === 'text2video' || type === 'image2video') {
    switch(platform) {
      case 'sora':
        return `Create a cinematic quality video: ${basePrompt}. ${commonQuality}, smooth camera movement, stable footage, cinematic lighting, 24fps, high resolution`;
      case 'veo2':
      case 'veo3':
        return `Generate a professional video sequence: ${basePrompt}. ${commonQuality}, steady camera, natural motion, cinematic style, high definition`;
      case 'runway':
        return `Create a professional video: ${basePrompt}. ${commonQuality}, fluid motion, cinematic composition, perfect lighting, 4K quality`;
      case 'kling':
        return `Generate a high-quality video sequence: ${basePrompt}. ${commonQuality}, smooth transitions, professional camera work, cinematic grade`;
      default:
        return basePrompt;
    }
  }
  return basePrompt;
}

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

// OpenAI(ChatGPT) 번역 함수
async function openaiTranslate(text, apikey) {
  const platform = platformSelect.value;
  const type = typeSelect.value;
  
  const systemPrompt = `You are a professional prompt engineer for ${platform} AI. 
Translate the Korean text to English and enhance it with appropriate details for ${type} generation.
Focus on visual details, composition, lighting, and quality.
Keep the core meaning but add relevant technical parameters and style keywords.
Respond with the enhanced English translation only, no explanations.`;

  const url = 'https://api.openai.com/v1/chat/completions';
  const body = {
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Translate and enhance this prompt for ${platform}:\n${text}` }
    ],
    temperature: 0.3
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
    if (data?.choices?.[0]?.message?.content) {
      const translated = data.choices[0].message.content.trim();
      return formatPrompt(translated, platform, type);
    }
    throw new Error('번역 결과 없음');
  } catch (e) {
    throw new Error('번역 실패: ' + e.message);
  }
}

// Gemini(Google) 번역 함수
async function geminiTranslate(text, apikey) {
  const platform = platformSelect.value;
  const type = typeSelect.value;
  
  const prompt = `As a professional prompt engineer for ${platform} AI, translate the following Korean text to English and enhance it for ${type} generation.
Focus on visual details, composition, lighting, and quality.
Keep the core meaning but add relevant technical parameters and style keywords.
Respond with the enhanced English translation only, no explanations.

Korean text to translate and enhance:
${text}`;

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + apikey;
  const body = {
    contents: [
      { parts: [ { text: prompt } ] }
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
    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      const translated = data.candidates[0].content.parts[0].text.trim();
      return formatPrompt(translated, platform, type);
    }
    throw new Error('번역 결과 없음');
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
