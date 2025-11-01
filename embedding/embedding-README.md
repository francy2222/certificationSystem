# 🎨 Embedding System - Artefatti Claude con Certificazione e TTS

Sistema per embeddare artefatti Claude.ai con accesso a:
- ✅ Sistema di Certificazione v4.1
- ✅ Edge TTS (API reversate Microsoft)
- ✅ Caricamento dinamico librerie
- ✅ Comunicazione bidirezionale sicura

---

## 📁 Struttura

```
embedding/
├── artifact-container.html    # Container principale
├── PROTOCOLLO.md              # Documentazione API completa
├── artifact-demo.jsx          # Esempio React
└── js/
    └── edge-tts.js            # Modulo TTS standalone
```

---

## 🚀 Quick Start

### 1. Deploy su Netlify/Vercel

Carica l'intera cartella `certification-system` (parent) su Netlify:

```bash
# La struttura deployata sarà:
https://tuo-dominio.netlify.app/
├── certification-system.js
├── index.html
└── embedding/
    ├── artifact-container.html
    └── js/
        └── edge-tts.js
```

### 2. Crea Artifact su Claude

Usa il template React in `artifact-demo.jsx` o creane uno custom.

### 3. Ottieni URL Embedding

Dopo aver creato l'artifact su Claude.ai:
- Clicca sui `···` (menu)
- Scegli "Publish" o copia l'URL diretto
- Esempio: `https://claude.ai/artifacts/abc123xyz`

### 4. Carica nel Container

**Opzione A - Manuale:**
```
https://tuo-dominio.netlify.app/embedding/artifact-container.html
```
Incolla l'URL artifact e clicca "Carica"

**Opzione B - Auto-load (consigliato):**
```
https://tuo-dominio.netlify.app/embedding/artifact-container.html?artifact=https://claude.ai/artifacts/abc123xyz
```

---

## 🎯 Uso da Artifact

### Sintesi Vocale (Edge TTS)

```javascript
// Semplice
window.parent.postMessage({
  type: 'TTS_SPEAK',
  text: 'Benvenuto nell\'applicazione!'
}, '*');

// Avanzato
window.parent.postMessage({
  type: 'TTS_SPEAK',
  text: 'Questa è una domanda difficile',
  voice: 'it-IT-DiegoNeural',
  rate: '+10%',     // Più veloce
  pitch: '+5Hz',    // Tono più alto
  volume: '+10%'    // Più forte
}, '*');

// Ascolta risposta
window.addEventListener('message', (event) => {
  if (event.data.type === 'TTS_RESULT' && event.data.success) {
    // Converti base64 in audio e riproduci
    const audioBlob = base64ToBlob(event.data.audioData, 'audio/mpeg');
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.play();
  }
});

// Helper
function base64ToBlob(base64, mimeType) {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}
```

### Sistema Certificazione

```javascript
// Incrementa punteggio
window.parent.postMessage({
  type: 'CERT_ACTION',
  action: 'increment',
  key: 'score',
  value: 10
}, '*');

// Genera certificato
window.parent.postMessage({
  type: 'CERT_ACTION',
  action: 'generateLink'
}, '*');

// Ottieni dati
window.parent.postMessage({
  type: 'GET_CERT_DATA'
}, '*');
```

### Carica Librerie

```javascript
// Chart.js per grafici
window.parent.postMessage({
  type: 'LOAD_LIBRARY',
  url: 'https://cdn.jsdelivr.net/npm/chart.js',
  name: 'Chart.js'
}, '*');

// Axios per HTTP requests
window.parent.postMessage({
  type: 'LOAD_LIBRARY',
  url: 'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js',
  name: 'Axios'
}, '*');
```

---

## 📚 Voci TTS Disponibili

### Italiano
- `it-IT-IsabellaNeural` (F) - **Default, consigliata**
- `it-IT-ElsaNeural` (F)
- `it-IT-DiegoNeural` (M)

### Inglese
- `en-US-JennyNeural` (F)
- `en-US-AriaNeural` (F)
- `en-US-GuyNeural` (M)
- `en-GB-SoniaNeural` (F) - UK
- `en-GB-RyanNeural` (M) - UK

### Altre Lingue
- `fr-FR-DeniseNeural` (F) - Francese
- `de-DE-KatjaNeural` (F) - Tedesco
- `es-ES-ElviraNeural` (F) - Spagnolo

**Lista completa:**
```javascript
window.parent.postMessage({
  type: 'TTS_GET_VOICES'
}, '*');
```

---

## 🎓 Esempio Completo: Quiz Didattico

```jsx
import React, { useState, useEffect } from 'react';

export default function QuizVocale() {
  const [question, setQuestion] = useState('Quanto fa 2 + 2?');
  const [score, setScore] = useState(0);

  useEffect(() => {
    // Setup comunicazione
    window.parent.postMessage({ type: 'ARTIFACT_READY' }, '*');
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  function handleMessage(event) {
    if (event.data.type === 'CERT_DATA_UPDATED' && event.data.key === 'score') {
      setScore(event.data.value);
    }
  }

  function speakQuestion() {
    window.parent.postMessage({
      type: 'TTS_SPEAK',
      text: question,
      voice: 'it-IT-IsabellaNeural'
    }, '*');
  }

  function correctAnswer() {
    // Incrementa punteggio
    window.parent.postMessage({
      type: 'CERT_ACTION',
      action: 'increment',
      key: 'score',
      value: 10
    }, '*');
    
    // Feedback vocale
    window.parent.postMessage({
      type: 'TTS_SPEAK',
      text: 'Risposta corretta! Complimenti!',
      rate: '+20%'
    }, '*');
  }

  function generateCertificate() {
    window.parent.postMessage({
      type: 'CERT_ACTION',
      action: 'generateLink'
    }, '*');
  }

  return (
    <div className="p-8 bg-gradient-to-br from-blue-500 to-purple-600 min-h-screen">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-xl p-6">
        <h1 className="text-3xl font-bold text-center mb-6">
          🎓 Quiz con Sintesi Vocale
        </h1>
        
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <div className="text-xl mb-4">{question}</div>
          <button 
            onClick={speakQuestion}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            🔊 Ascolta Domanda
          </button>
        </div>

        <div className="text-center text-2xl font-bold mb-6">
          Punteggio: {score}
        </div>

        <div className="space-y-3">
          <button 
            onClick={correctAnswer}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg"
          >
            ✅ Risposta Corretta
          </button>
          
          <button 
            onClick={generateCertificate}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg"
          >
            📜 Genera Certificato
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## ⚠️ Note Importanti

### Edge TTS
- **Token e versione** potrebbero richiedere aggiornamenti
- File: `js/edge-tts.js` - righe 12-13
- Usa API non documentate Microsoft
- Funzionamento non garantito a lungo termine

### Sicurezza
In **produzione**, verifica sempre `event.origin`:

```javascript
window.addEventListener('message', (event) => {
  // Verifica origine
  if (event.origin !== 'https://tuo-dominio.netlify.app') {
    return;
  }
  
  handleMessage(event);
});
```

### Performance
- TTS impiega 1-3 secondi per testi brevi
- Per testi lunghi viene fatto chunking automatico
- Timeout default: 60 secondi per chunk

---

## 📖 Documentazione

- **PROTOCOLLO.md** - API completa di comunicazione
- **Parent README.md** - Sistema certificazione
- **Parent Documentazione.MD** - Doc tecnica certificazione

---

## 🐛 Troubleshooting

### Artifact non si connette
1. Verifica URL artifact corretto
2. Controlla console browser per errori
3. Verifica che `ARTIFACT_READY` venga inviato

### TTS non funziona
1. Verifica `edge-tts.js` caricato
2. Controlla token/versione aggiornati
3. Vedi console per errori WebSocket

### Certificazione non salva
1. Verifica `certification-system.js` caricato (parent dir)
2. Controlla localStorage abilitato
3. Verifica namespace app corretto

---

## 📞 Supporto

- **Email**: gubercml@gmail.com
- **GitHub**: (inserisci link repository)

---

**Versione**: 1.0.0  
**Autori**: Flejta & Claude  
**Licenza**: MIT
