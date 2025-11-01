# 📡 Protocollo di Comunicazione Artifact Container

## 🎯 Panoramica

Sistema di comunicazione bidirezionale tra artefatti Claude embedded e una pagina container che fornisce:
- ✅ Sistema di Certificazione v4.1
- ✅ Caricamento dinamico di librerie JS
- ✅ Comunicazione sicura via postMessage

---

## 🔄 Messaggi Artifact → Container

### 1. ARTIFACT_READY

Notifica che l'artifact è pronto per comunicare.

```javascript
window.parent.postMessage({
  type: 'ARTIFACT_READY',
  timestamp: Date.now()
}, '*');
```

**Risposta del container:**
```javascript
{
  type: 'CONTAINER_INFO',
  certSystemAvailable: true,
  libraries: ['certification-system']
}
```

---

### 2. LOAD_LIBRARY

Richiede caricamento dinamico di una libreria JS.

```javascript
window.parent.postMessage({
  type: 'LOAD_LIBRARY',
  url: 'https://cdn.jsdelivr.net/npm/chart.js',
  name: 'Chart.js'  // Nome per tracking (opzionale)
}, '*');
```

**Risposta del container:**
```javascript
{
  type: 'LIBRARY_LOADED',
  name: 'Chart.js',
  success: true,
  error: null  // se success: false, contiene messaggio errore
}
```

**Librerie comuni:**
- Chart.js: `https://cdn.jsdelivr.net/npm/chart.js`
- Axios: `https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js`
- Lodash: `https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js`
- D3: `https://d3js.org/d3.v7.min.js`
- Three.js: `https://cdn.jsdelivr.net/npm/three@0.150.0/build/three.min.js`

---

### 3. CERT_ACTION

Esegue azione sul sistema di certificazione.

#### Incrementa campo
```javascript
window.parent.postMessage({
  type: 'CERT_ACTION',
  action: 'increment',
  key: 'score',
  value: 10  // default: 1
}, '*');
```

#### Imposta campo
```javascript
window.parent.postMessage({
  type: 'CERT_ACTION',
  action: 'setField',
  key: 'nome',
  value: 'Mario Rossi'
}, '*');
```

#### Leggi campo
```javascript
window.parent.postMessage({
  type: 'CERT_ACTION',
  action: 'getField',
  key: 'score'
}, '*');
```

#### Ottieni tutti i dati
```javascript
window.parent.postMessage({
  type: 'CERT_ACTION',
  action: 'getData'
}, '*');
```

#### Genera link certificato
```javascript
window.parent.postMessage({
  type: 'CERT_ACTION',
  action: 'generateLink'
}, '*');
```

#### Reset dati
```javascript
window.parent.postMessage({
  type: 'CERT_ACTION',
  action: 'reset'
}, '*');
```

**Risposta del container:**
```javascript
{
  type: 'CERT_ACTION_RESULT',
  success: true,
  action: 'increment',
  result: null  // per getField/getData/generateLink contiene il risultato
}
```

---

### 4. GET_CERT_DATA

Richiede snapshot completo dei dati certificazione.

```javascript
window.parent.postMessage({
  type: 'GET_CERT_DATA'
}, '*');
```

**Risposta del container:**
```javascript
{
  type: 'CERT_DATA',
  success: true,
  data: {
    t: 1234,        // tempo totale secondi
    score: 100,     // campi personalizzati
    actions: 5,
    _meta: {...},   // metadati
    _studentInfo: {...}
  }
}
```

---

### 5. TTS_SPEAK

Richiede sintesi vocale usando Edge TTS (API reversate).

```javascript
window.parent.postMessage({
  type: 'TTS_SPEAK',
  text: 'Ciao, questo è un test di sintesi vocale',
  voice: 'it-IT-IsabellaNeural',  // opzionale, default: it-IT-IsabellaNeural
  rate: '+0%',                      // opzionale, default: +0%
  pitch: '+0Hz',                    // opzionale, default: +0Hz
  volume: '+0%',                    // opzionale, default: +0%
  normalize: true                   // opzionale, normalizza testo, default: true
}, '*');
```

**Opzioni voce:**
- `rate`: Velocità da `-50%` a `+100%`
- `pitch`: Tono da `-50Hz` a `+50Hz`
- `volume`: Volume da `-50%` a `+50%`

**Risposta del container:**
```javascript
{
  type: 'TTS_RESULT',
  success: true,
  audioData: 'base64_encoded_audio',  // MP3 in base64
  audioType: 'audio/mpeg'
}
```

**Esempio completo di uso:**
```javascript
// Richiedi sintesi
window.parent.postMessage({
  type: 'TTS_SPEAK',
  text: 'Benvenuto nell\'applicazione',
  voice: 'it-IT-IsabellaNeural',
  rate: '+10%'
}, '*');

// Ascolta risposta
window.addEventListener('message', (event) => {
  if (event.data.type === 'TTS_RESULT' && event.data.success) {
    // Converti base64 in blob e riproduci
    const audioBlob = base64ToBlob(event.data.audioData, 'audio/mpeg');
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.play();
  }
});

// Helper per conversione
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

---

### 6. TTS_STOP

Ferma sintesi vocale in corso.

```javascript
window.parent.postMessage({
  type: 'TTS_STOP'
}, '*');
```

**Risposta del container:**
```javascript
{
  type: 'TTS_STOP_RESULT',
  success: true
}
```

---

### 7. TTS_GET_VOICES

Ottieni lista voci disponibili per Edge TTS.

```javascript
window.parent.postMessage({
  type: 'TTS_GET_VOICES'
}, '*');
```

**Risposta del container:**
```javascript
{
  type: 'TTS_VOICES_RESULT',
  success: true,
  voices: [
    {
      name: 'it-IT-IsabellaNeural',
      lang: 'it-IT',
      gender: 'F',
      label: 'Isabella (Italiano)'
    },
    // ... altre voci
  ]
}
```

**Voci disponibili:**
- **Italiano**: Isabella, Elsa (F), Diego (M)
- **Inglese US**: Jenny, Aria (F), Guy (M)
- **Inglese UK**: Sonia (F), Ryan (M)
- **Francese**: Denise (F), Henri (M)
- **Tedesco**: Katja (F), Conrad (M)
- **Spagnolo**: Elvira (F), Alvaro (M)

---

## 🔄 Messaggi Container → Artifact

### 1. CONTAINER_INFO

Inviato automaticamente quando artifact diventa ready.

```javascript
{
  type: 'CONTAINER_INFO',
  certSystemAvailable: true,
  libraries: ['certification-system', 'Chart.js']
}
```

---

### 2. LIBRARY_LOADED

Risposta a richiesta LOAD_LIBRARY.

```javascript
{
  type: 'LIBRARY_LOADED',
  name: 'Chart.js',
  success: true,
  error: null
}
```

---

### 3. CERT_ACTION_RESULT

Risposta a qualsiasi CERT_ACTION.

```javascript
{
  type: 'CERT_ACTION_RESULT',
  success: true,
  action: 'increment',
  result: 110  // se applicabile
}
```

---

### 4. CERT_DATA

Risposta a GET_CERT_DATA.

```javascript
{
  type: 'CERT_DATA',
  success: true,
  data: {
    // dati completi certificazione
  }
}
```

---

### 5. CERT_DATA_UPDATED

Notifica AUTOMATICA quando i dati cambiano (se artifact è connesso).

```javascript
{
  type: 'CERT_DATA_UPDATED',
  key: 'score',
  value: 120
}
```

---

## 💡 Esempi Pratici

### Esempio React Completo

```jsx
import React, { useState, useEffect } from 'react';

export default function QuizApp() {
  const [score, setScore] = useState(0);
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    // 1. Notifica ready
    sendToContainer({ type: 'ARTIFACT_READY' });

    // 2. Richiedi Chart.js
    sendToContainer({
      type: 'LOAD_LIBRARY',
      url: 'https://cdn.jsdelivr.net/npm/chart.js',
      name: 'Chart.js'
    });

    // 3. Listener messaggi
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  function handleMessage(event) {
    const msg = event.data;
    
    if (msg.type === 'LIBRARY_LOADED' && msg.name === 'Chart.js') {
      setChartReady(msg.success);
    }
    
    if (msg.type === 'CERT_DATA_UPDATED' && msg.key === 'score') {
      setScore(msg.value);
    }
  }

  function sendToContainer(message) {
    window.parent.postMessage(message, '*');
  }

  function correctAnswer() {
    // Incrementa score
    sendToContainer({
      type: 'CERT_ACTION',
      action: 'increment',
      key: 'score',
      value: 10
    });
    
    // Incrementa risposte corrette
    sendToContainer({
      type: 'CERT_ACTION',
      action: 'increment',
      key: 'correct'
    });
  }

  function finishQuiz() {
    // Genera certificato
    sendToContainer({
      type: 'CERT_ACTION',
      action: 'generateLink'
    });
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Quiz Matematica</h1>
      <div className="text-2xl mb-6">Punteggio: {score}</div>
      
      <button 
        onClick={correctAnswer}
        className="bg-green-500 text-white px-6 py-3 rounded-lg"
      >
        ✅ Risposta Corretta
      </button>
      
      <button 
        onClick={finishQuiz}
        className="bg-blue-500 text-white px-6 py-3 rounded-lg ml-4"
      >
        📜 Genera Certificato
      </button>
      
      {chartReady && (
        <div className="mt-8">
          <canvas id="myChart"></canvas>
          {/* Ora puoi usare Chart.js */}
        </div>
      )}
    </div>
  );
}
```

---

### Esempio HTML/Vanilla JS

```html
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <title>Quiz Demo</title>
</head>
<body>
  <h1>Quiz Matematica</h1>
  <div id="score">Punteggio: 0</div>
  <button onclick="correctAnswer()">✅ Corretta</button>
  <button onclick="generateCert()">📜 Certificato</button>

  <script>
    let currentScore = 0;

    // Init
    window.addEventListener('DOMContentLoaded', () => {
      // Notifica ready
      sendToContainer({ type: 'ARTIFACT_READY' });
      
      // Listener
      window.addEventListener('message', handleMessage);
    });

    function handleMessage(event) {
      const msg = event.data;
      
      if (msg.type === 'CERT_DATA_UPDATED' && msg.key === 'score') {
        currentScore = msg.value;
        document.getElementById('score').textContent = `Punteggio: ${currentScore}`;
      }
    }

    function sendToContainer(message) {
      window.parent.postMessage(message, '*');
    }

    function correctAnswer() {
      sendToContainer({
        type: 'CERT_ACTION',
        action: 'increment',
        key: 'score',
        value: 10
      });
    }

    function generateCert() {
      sendToContainer({
        type: 'CERT_ACTION',
        action: 'generateLink'
      });
    }
  </script>
</body>
</html>
```

---

## 🔒 Sicurezza

### In Produzione

**Container (parent):**
```javascript
window.addEventListener('message', (event) => {
  // Verifica origine
  if (event.origin !== 'https://claude.ai') {
    console.warn('Messaggio da origine non autorizzata:', event.origin);
    return;
  }
  
  handleArtifactMessage(event);
});
```

**Artifact:**
```javascript
window.addEventListener('message', (event) => {
  // Verifica origine
  if (event.origin !== 'https://certificationsystem.netlify.app') {
    return;
  }
  
  handleContainerMessage(event);
});
```

### Best Practices

1. ✅ **Sempre verifica origin** in produzione
2. ✅ **Valida struttura messaggi** prima di processare
3. ✅ **Limita azioni disponibili** in base al contesto
4. ✅ **Log attività** per debug e sicurezza
5. ✅ **Timeout per richieste** di caricamento librerie

---

## 🎓 Setup Completo

### 1. Crea Artifact su Claude

Usa il template React fornito o creane uno custom.

### 2. Deploya Container

Carica `artifact-container.html` su Netlify/Vercel o hosting statico.

### 3. Ottieni URL Artifact

Dopo aver creato l'artifact su Claude, copia l'URL di embed:
- Esempio: `https://claude.ai/artifacts/abc123`

### 4. Carica nel Container

1. Apri il container: `https://tuo-dominio.com/artifact-container.html`
2. Incolla URL artifact nel campo
3. Clicca "Carica"
4. L'artifact si connetterà automaticamente

---

## 📊 Configurazione Sistema Certificazione

Il container inizializza il sistema con questa config di default:

```javascript
const certSystem = new CertificationSystem({
  appName: 'Artifact Container Demo',
  storageKey: 'artifact_demo',
  certUrl: 'https://certificationsystem.netlify.app/',
  fields: [
    { key: 'actions', label: 'Azioni', showZero: false },
    { key: 'score', label: 'Punteggio', showZero: true }
  ],
  onFieldUpdate: (key, value) => {
    // Notifica artifact automaticamente
    sendToArtifact({
      type: 'CERT_DATA_UPDATED',
      key: key,
      value: value
    });
  }
});
```

### Personalizzazione

Modifica il file `artifact-container.html` nella funzione `initCertSystem()`:

```javascript
function initCertSystem() {
  certSystem = new CertificationSystem({
    appName: 'Il Tuo Nome App',
    storageKey: 'tua_key_unica',
    certUrl: 'https://certificationsystem.netlify.app/',
    trackFocus: true,  // Tracking perdita focus
    fields: [
      { key: 'questions', label: 'Domande', showZero: false },
      { key: 'correct', label: 'Corrette', showZero: false },
      { key: 'errors', label: 'Errori', showZero: true },
      { key: 'score', label: 'Punteggio', type: 'number' },
      { key: 'note', label: 'Note', type: 'text' }
    ],
    // ... altri parametri v4.1
  });
}
```

---

## 🐛 Troubleshooting

### Artifact non si connette

1. Verifica che l'URL artifact sia corretto
2. Controlla console per errori CORS
3. Verifica che `ARTIFACT_READY` venga inviato

### Libreria non si carica

1. Verifica URL libreria
2. Controlla console per errori di rete
3. Prova URL alternativo CDN

### Dati certificazione non si aggiornano

1. Verifica che il container abbia inizializzato `certSystem`
2. Controlla messaggi inviati nella console
3. Verifica formato messaggi CERT_ACTION

---

## 📚 Risorse

- **Sistema Certificazione v4.1**: [README.md](../README.md)
- **Documentazione Completa**: [Documentazione.MD](../Documentazione.MD)
- **Demo Live Container**: (inserisci URL dopo deploy)
- **CDN Librerie JS**: https://www.jsdelivr.com/

---

**Versione Protocollo:** 1.0  
**Autori:** Flejta & Claude  
**Licenza:** MIT
