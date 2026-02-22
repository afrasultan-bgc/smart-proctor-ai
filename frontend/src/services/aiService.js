const AI_API_URL = import.meta.env.VITE_AI_API_URL;
const AI_API_KEY = import.meta.env.VITE_AI_API_KEY;

// Sınav gözetimi için AI'a istek atan temel fonksiyon
export const analyzeExamBehavior = async (imageData, prompt) => {
  try {
    const response = await fetch(`${AI_API_URL}?key=${AI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt || 'Bu sınav görüntüsünde kopya çekme belirtisi var mı? Analiz et.' },
              imageData ? { inline_data: { mime_type: 'image/jpeg', data: imageData } } : null
            ].filter(Boolean)
          }
        ]
      })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('AI Servis Hatası:', error);
    return null;
  }
};

// Yüz analizi sonuçlarını AI'a gönderme
export const analyzeFaceData = async (faceData) => {
  try {
    const response = await fetch(`${AI_API_URL}?key=${AI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: `Sınav gözetim verileri: ${JSON.stringify(faceData)}. Bu verilere göre öğrencinin davranışını analiz et.` }
            ]
          }
        ]
      })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('AI Yüz Analizi Hatası:', error);
    return null;
  }
};
```

**Adım 3:** Frontend klasöründeki `.env` dosyasını aç, içine şunu ekle:
```
VITE_AI_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent
VITE_AI_API_KEY=BURAYA_API_KEY_GELECEK