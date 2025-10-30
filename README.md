# 📚 Sistema di Certificazione per App Didattiche

> ⚠️ **v4.1 - IMPORTANTE**: Storage automaticamente isolato per ogni app. Ogni applicazione ora mantiene i propri dati separati.

## 🆕 Novità v4.1 (Gennaio 2025)
- **✅ RISOLTO IL PROBLEMA STORAGE CONDIVISO**
- **🔒 Isolamento automatico** per ogni app basato su URL
- **🎓 Info studente globali** persistenti tra tutte le app
- **🏫 Tre modalità operative**: Normale, Classe, Verifica
- **📊 Tracking avanzato** con attività sospette in modalità verifica
- **📦 Zero modifiche richieste** alle app esistenti

---

## ✨ Caratteristiche

### 🔧 Funzionalità Base
- ✅ **Salvataggio automatico** in localStorage (statistiche cumulative)
- ✅ **Timer intelligente** (si ferma dopo 2 minuti di inattività)
- ✅ **Campi personalizzabili** per ogni app (number, text, time, percentage)
- ✅ **Storage isolato automatico** - ogni app ha i suoi dati separati
- ✅ **Link certificato criptato** da inviare ai docenti
- ✅ **Lettore certificato integrato** con valutazione automatica

### 🎓 Funzionalità Avanzate
- ✅ **Info studente globali** (nome, cognome, classe) condivise tra tutte le app
- ✅ **Tre modalità operative**: Normale, Lavoro in Classe, Verifica
- ✅ **Tracking focus opzionale** (rileva quando lo studente cambia finestra)
- ✅ **Monitoraggio avanzato** in modalità verifica (resize, copy/paste, devtools)
- ✅ **Sessioni gestite** con storico completo
- ✅ **Persistenza modalità** (sopravvivono a refresh pagina)

---

## 🚀 Quick Start

### 1. Importa il sistema nella tua app

```html
<script src="https://certificationsystem.netlify.app/certification-system.js"></script>
```

### 2. Configurazione Base

```javascript
const certSystem = new CertificationSystem({
    appName: 'Nome App',
    storageKey: 'unique_key',
    certUrl: 'https://certificationsystem.netlify.app/',
    fields: [
        { key: 'comp', label: 'Completamenti', showZero: false },
        { key: 'err', label: 'Errori', showZero: true }
    ]
});
```

### 3. Usa durante l'app

```javascript
// Incrementa contatori
certSystem.incrementField('comp');
certSystem.incrementField('err', 5);

// Genera link certificato
const link = certSystem.generateCertLink();
```

### 4. UI Automatica (Metodo Semplice)

```html
<div id="certificateContainer"></div>
```

```javascript
// Crea pannello completo con UNA SOLA RIGA
certSystem.renderFullPanel('certificateContainer');
```

Fatto! Il pannello include automaticamente: statistiche, bottoni, gestione studente, tutto stilizzato.

---

## 🎯 Le 3 Modalità Operative

### 🟢 Modalità Normale (Default)
Per esercizi standard, pratica libera, studio individuale.

```javascript
const certSystem = new CertificationSystem({
    appName: 'Esercizi Matematica',
    storageKey: 'math_data',
    certUrl: 'https://certificationsystem.netlify.app/',
    fields: [
        { key: 'exercises', label: 'Esercizi Completati', showZero: false },
        { key: 'errors', label: 'Errori', showZero: true }
    ]
});
```

**Caratteristiche:**
- Timer si ferma dopo 2 minuti di inattività
- Dati salvati cumulativamente
- Focus window non tracciato

---

### 🟡 Modalità Lavoro in Classe

Per attività guidate in classe con supervisione docente.

```javascript
const certSystem = new CertificationSystem({
    appName: 'Verifica Grammatica',
    storageKey: 'grammar_test',
    certUrl: 'https://certificationsystem.netlify.app/',
    trackFocus: true,  // Monitora cambio finestra
    fields: [
        { key: 'questions', label: 'Domande', showZero: false },
        { key: 'correct', label: 'Corrette', showZero: false }
    ],
    onClassroomModeStart: () => {
        console.log('Modalità classe attivata - aiuti visibili');
    }
});

// Attiva modalità classe
certSystem.toggleClassroomMode(true);
```

**Caratteristiche:**
- ✅ Tracking perdita focus finestra
- ✅ Timer sempre attivo
- ✅ Sessioni con ID univoco
- ✅ Aiuti/suggerimenti possono essere mostrati
- ✅ Dati inclusi nel certificato

**Quando usarla:** Compiti in classe normali, esercizi guidati, attività supervisionate.

---

### 🔴 Modalità Verifica (Massima Sicurezza)

Per esami, test, verifiche ufficiali con monitoraggio completo.

```javascript
const certSystem = new CertificationSystem({
    appName: 'Esame Finale',
    storageKey: 'final_exam',
    certUrl: 'https://certificationsystem.netlify.app/',
    trackFocus: true,
    suspiciousResizeThreshold: 100,  // pixel per resize sospetto
    fields: [
        { key: 'score', label: 'Punteggio', showZero: true },
        { key: 'completed', label: 'Completato', showZero: false }
    ],
    onVerificationModeStart: () => {
        // Nascondi tutti gli aiuti
        document.querySelectorAll('.hint').forEach(el => el.style.display = 'none');
    },
    onSuspiciousActivity: (type, details) => {
        console.warn('Attività sospetta rilevata:', type, details);
    }
});

// Attiva modalità verifica
certSystem.toggleVerificationMode(true);
```

**Caratteristiche:**
- 🔴 **Tracking ESTREMO** di tutto:
  - Perdita focus finestra (con conteggio e durata)
  - Ridimensionamento finestra sospetto
  - Tab nascoste
  - Console sviluppatore aperta (F12)
  - Tentativi di copia/incolla
  - Uscita da fullscreen
  - Tentativi di chiusura pagina
- 🔴 **Alert visivi** allo studente per ogni attività registrata
- 🔴 **Timer sempre attivo** (non si ferma mai)
- 🔴 **Dati completi nel certificato** con tutte le violazioni
- 🔴 **Warning prima di uscire** dalla pagina

**Quando usarla:** Verifiche ufficiali, esami, test con valore di valutazione.

---

## 📊 Gestione Info Studente (Globali)

Le informazioni dello studente sono **condivise tra TUTTE le app** del sistema.

```javascript
// Richiedi info studente (con prompt)
const info = certSystem.promptStudentInfo();
// Ritorna: { nome: 'Mario', cognome: 'Rossi', classe: '3A' }

// Salva manualmente
certSystem.saveStudentInfo({
    nome: 'Mario',
    cognome: 'Rossi',
    classe: '3A'
});

// Leggi info correnti
const studentInfo = certSystem.getStudentInfo();
```

**Storage:** Salvate in `student_global_info` (globale, non per app)

**Visualizzazione:** Le info studente appaiono automaticamente nel certificato.

---

## ⚙️ Configurazione Avanzata

### Tutti i Parametri Disponibili

```javascript
const certSystem = new CertificationSystem({
    // === OBBLIGATORI ===
    appName: 'Nome App',              // Nome applicazione
    storageKey: 'unique_key',         // Chiave localStorage
    certUrl: 'https://...',           // URL lettore certificato
    fields: [...],                     // Campi personalizzati (vedi sotto)

    // === OPZIONALI - Base ===
    appVersion: '1.0.0',              // Versione app (default: '4.1.0')
    appId: 'custom_namespace',        // Forza namespace specifico (default: auto da URL)
    debug: false,                     // Log debug namespace (default: false)

    // === OPZIONALI - Tracking ===
    trackFocus: false,                // Traccia perdita focus (default: false)
    inactivityTimeout: 120000,        // Timeout inattività ms (default: 2 min)

    // === OPZIONALI - Modalità ===
    classroomMode: false,             // Avvia in modalità classe (default: false)
    verificationMode: false,          // Avvia in modalità verifica (default: false)
    suspiciousResizeThreshold: 100,   // Pixel per resize sospetto (default: 100)
    requireFullscreen: false,         // Richiedi fullscreen (default: false)

    // === CALLBACKS - Timer e Campi ===
    onTimerUpdate: (seconds) => {},         // Chiamato ogni secondo
    onFieldUpdate: (key, value) => {},      // Chiamato ad ogni modifica campo
    onReset: () => {},                      // Chiamato dopo reset dati

    // === CALLBACKS - Modalità ===
    onClassroomModeStart: () => {},         // Modalità classe attivata
    onClassroomModeEnd: () => {},           // Modalità classe disattivata
    onVerificationModeStart: () => {},      // Modalità verifica attivata
    onVerificationModeEnd: () => {},        // Modalità verifica disattivata
    onNormalMode: () => {},                 // Tornato a modalità normale

    // === CALLBACKS - Sessioni ===
    onSessionStart: (sessionId) => {},      // Sessione classe iniziata
    onSessionEnd: (session) => {},          // Sessione classe terminata

    // === CALLBACKS - Tracking Avanzato ===
    onFocusLost: (count) => {},             // Focus perso
    onFocusRestored: (duration) => {},      // Focus ripristinato
    onWindowResize: (data) => {},           // Finestra ridimensionata
    onSuspiciousActivity: (type, details) => {} // Attività sospetta rilevata
});
```

---

## 📝 Definizione Campi

### Tipi di Campi Supportati

```javascript
fields: [
    // === CAMPO NUMERO (default) ===
    {
        key: 'comp',
        label: 'Completamenti',
        type: 'number',           // default, può essere omesso
        showZero: false           // se false, mostra "-" invece di 0
    },

    // === CAMPO TESTUALE ===
    {
        key: 'note',
        label: 'Note Studente',
        type: 'text',
        defaultValue: ''
    },

    // === CAMPO TEMPO (formattato automaticamente) ===
    {
        key: 'tempo_extra',
        label: 'Tempo Extra',
        type: 'time',             // Formattato come "5m 30s"
        showZero: true
    },

    // === CAMPO PERCENTUALE ===
    {
        key: 'accuratezza',
        label: 'Accuratezza',
        type: 'percentage',       // Mostra con "%"
        showZero: true
    }
]
```

**Uso:**
```javascript
// Numeri
certSystem.incrementField('comp', 1);
certSystem.setField('comp', 10);

// Testo
certSystem.setField('note', 'Ottimo lavoro!');

// Tempo (in secondi)
certSystem.setField('tempo_extra', 330); // Visualizzato come "5m 30s"

// Percentuale
certSystem.setField('accuratezza', 95); // Visualizzato come "95%"
```

---

## 📊 Struttura Dati (v4.1)

### Nuovo Formato con Metadati

```json
{
    "_meta": {
        "appName": "Quiz Matematica",
        "appVersion": "1.0.0",
        "appUrl": "https://...",
        "appPath": "/application/matematica/quiz.html",
        "namespace": "matematica_quiz",
        "startTime": 1704067200000,
        "lastUpdate": 1704070800000
    },
    "_values": {
        "t": 1234,          // Tempo totale (secondi)
        "comp": 5,          // Campo numerico personalizzato
        "err": 3,           // Campo numerico personalizzato
        "fl": 2,            // Focus lost count (se trackFocus=true)
        "flt": 45           // Focus lost time (se trackFocus=true)
    },
    "_textFields": {
        "note": "Testo"     // Campi testuali
    },
    "_studentInfo": {
        "nome": "Mario",
        "cognome": "Rossi",
        "classe": "3A"
    },
    "_events": [            // Log eventi (modalità classe/verifica)
        {
            "type": "focus_lost",
            "data": {...},
            "timestamp": 1704067200000
        }
    ],
    "_suspiciousActivities": [  // Attività sospette (modalità verifica)
        {
            "type": "copy_attempt",
            "details": {...},
            "timestamp": 1704067200000
        }
    ],
    "_session": {           // Sessione classe attiva
        "id": "session_1704067200000",
        "startTime": 1704067200000,
        "endTime": null,
        "classroomMode": true
    },
    "_verificationSession": {  // Sessione verifica attiva
        "startTime": 1704067200000,
        "endTime": null,
        "strictMode": true
    }
}
```

### Storage Keys Utilizzate

- `{namespace}_{storageKey}` - Dati app (isolati automaticamente)
- `{namespace}_{storageKey}_classroom` - Dati modalità classe
- `{namespace}_{storageKey}_verification` - Dati modalità verifica
- `{namespace}_{storageKey}_modes` - Persistenza modalità attiva
- `student_global_info` - Info studente (globale per tutte le app)

---

## 🔧 Metodi Principali (API Reference)

### Gestione Campi

```javascript
// Incrementa campo numerico
certSystem.incrementField('key', amount);

// Imposta valore (numerico o testuale)
certSystem.setField('key', value);

// Leggi valore singolo
const value = certSystem.getField('key');

// Ottieni tutti i dati
const allData = certSystem.getData();
```

### Certificazione

```javascript
// Genera link certificato
const link = certSystem.generateCertLink();

// Copia link negli appunti
certSystem.copyCertLink();

// Reset completo dati
certSystem.resetData();
```

### Modalità Operative

```javascript
// Attiva/disattiva modalità classe
certSystem.toggleClassroomMode(true/false);

// Attiva/disattiva modalità verifica
certSystem.toggleVerificationMode(true/false);

// Torna a modalità normale
certSystem.toggleNormalMode();

// Ottieni modalità corrente
const mode = certSystem.getCurrentMode(); // 'normal' | 'classroom' | 'verification'
```

### Gestione Sessioni

```javascript
// Avvia sessione classe
certSystem.startClassroomSession();

// Termina sessione classe (ritorna link certificato)
const link = certSystem.endClassroomSession();

// Verifica se in sessione
const inSession = certSystem.isInClassroomSession();
const inVerification = certSystem.isInVerificationMode();
```

### Info Studente

```javascript
// Richiedi con prompt
const info = certSystem.promptStudentInfo();

// Salva manualmente
certSystem.saveStudentInfo({ nome: '...', cognome: '...', classe: '...' });

// Leggi correnti
const studentInfo = certSystem.getStudentInfo();
```

### UI Helper

```javascript
// Pannello completo (raccomandato)
certSystem.renderFullPanel('containerId', {
    collapsible: true,              // Pannello comprimibile
    showStudentControls: true,      // Mostra controlli studente
    showClassroomToggle: false,     // Mostra toggle modalità classe
    showVerificationToggle: false   // Mostra toggle modalità verifica
});

// Solo statistiche (legacy)
certSystem.renderStatsPanel('statsContainerId');

// Setup bottoni manuale (legacy)
certSystem.setupButtons('genId', 'copyId', 'resetId', 'linkId', 'studentId');

// Formatta tempo
const formatted = certSystem.getFormattedTime(3665); // "1h 1m 5s"
```

---

## 🎨 Lettore Certificati (index.html)

Il lettore supporta **due modalità di input**:

1. **URL con parametri**: `https://certificationsystem.netlify.app/?cert=eyJ0...`
2. **Input manuale**: Incolla link o stringa Base64

### Caratteristiche del Lettore

- ✅ Caricamento automatico da URL
- ✅ Visualizzazione dinamica campi
- ✅ Mostra "-" per valori non applicabili
- ✅ Info studente in evidenza
- ✅ Metadati sessione (inizio, fine, durata)
- ✅ Statistiche dettagliate
- ✅ Pronto per stampa

### Dati nel Certificato

**Normale/Classe:**
```json
{
    "meta": {...},
    "studentInfo": {...},
    "values": {...},
    "textFields": {...},
    "fields": [...]
}
```

**Modalità Verifica (dati aggiuntivi):**
```json
{
    "meta": {...},
    "studentInfo": {...},
    "values": {...},
    "verification": {
        "session": {...},
        "suspiciousActivities": [
            { "type": "copy_attempt", "timestamp": ... },
            { "type": "tab_hidden", "timestamp": ... }
        ],
        "events": [...],
        "violations": {
            "focusLost": 5,
            "focusLostTime": 120,
            "resizes": 3,
            "suspiciousResizes": 1,
            "copyPasteAttempts": 2,
            "devtoolsOpened": 1
        }
    }
}
```

---

## 💡 Esempi Completi

### Esempio 1: App Esercizi Semplice

```javascript
const certSystem = new CertificationSystem({
    appName: 'Tabelline',
    storageKey: 'tabelline_data',
    certUrl: 'https://certificationsystem.netlify.app/',
    fields: [
        { key: 'correct', label: 'Risposte Corrette', showZero: false },
        { key: 'wrong', label: 'Risposte Sbagliate', showZero: true }
    ],
    onTimerUpdate: (time) => {
        document.getElementById('timer').textContent =
            certSystem.getFormattedTime(time);
    }
});

// Setup UI automatica
certSystem.renderFullPanel('certContainer');

// Durante l'uso
function checkAnswer(correct) {
    if (correct) {
        certSystem.incrementField('correct');
    } else {
        certSystem.incrementField('wrong');
    }
}
```

---

### Esempio 2: Verifica con Tracking Completo

```javascript
const certSystem = new CertificationSystem({
    appName: 'Verifica Geografia',
    storageKey: 'geo_verification',
    certUrl: 'https://certificationsystem.netlify.app/',
    trackFocus: true,
    suspiciousResizeThreshold: 50,
    fields: [
        { key: 'questions', label: 'Domande Completate', showZero: false },
        { key: 'score', label: 'Punteggio', showZero: true }
    ],
    onVerificationModeStart: () => {
        // Nascondi tutti gli aiuti
        document.querySelectorAll('.help-button').forEach(btn => {
            btn.style.display = 'none';
        });
        // Mostra warning
        alert('⚠️ MODALITÀ VERIFICA ATTIVATA\n\nOgni attività sospetta verrà registrata.');
    },
    onSuspiciousActivity: (type, details) => {
        console.warn('⚠️ Attività sospetta:', type);
        // Invia al server per logging
        fetch('/api/log-suspicious', {
            method: 'POST',
            body: JSON.stringify({ type, details, student: certSystem.getStudentInfo() })
        });
    }
});

// Richiedi info studente prima di iniziare
certSystem.promptStudentInfo();

// Attiva modalità verifica
certSystem.toggleVerificationMode(true);

// UI
certSystem.renderFullPanel('certContainer');
```

---

### Esempio 3: Modalità Classe con Aiuti

```javascript
const certSystem = new CertificationSystem({
    appName: 'Esercizi Inglese',
    storageKey: 'english_exercises',
    certUrl: 'https://certificationsystem.netlify.app/',
    trackFocus: true,
    fields: [
        { key: 'exercises', label: 'Esercizi', showZero: false },
        { key: 'hints_used', label: 'Aiuti Usati', showZero: true }
    ],
    onClassroomModeStart: () => {
        // Mostra bottone aiuti
        document.getElementById('hint-button').style.display = 'block';
    },
    onClassroomModeEnd: () => {
        // Nascondi aiuti
        document.getElementById('hint-button').style.display = 'none';
    }
});

// Bottone per attivare modalità classe (per il docente)
document.getElementById('start-classroom').addEventListener('click', () => {
    const password = prompt('Password docente:');
    if (password === 'docente123') {
        certSystem.toggleClassroomMode(true);
        alert('Modalità classe attivata!');
    }
});
```

---

## 🐛 Troubleshooting

| Problema | Soluzione |
|----------|-----------|
| Link certificato non funziona | Verifica che `certUrl` punti al lettore corretto |
| Dati non si salvano | Controlla che localStorage sia abilitato nel browser |
| Timer non parte | Il sistema si auto-inizializza, verifica eventi di attività |
| Statistiche non si aggiornano | Usa `renderStatsPanel()` o callback `onFieldUpdate` |
| Modalità non persiste dopo refresh | Verifica che non ci siano errori JavaScript |
| Storage condiviso tra app | Ogni app ha namespace auto-generato dall'URL, verifica con `debug: true` |

---

## 🔒 Isolamento Storage (v4.1)

### Come Funziona

Il sistema genera automaticamente un **namespace univoco** per ogni app basato sull'URL:

```
/application/matematica/frazioni.html  →  matematica_frazioni_tuoStorageKey
/application/inglese/verbi.html        →  inglese_verbi_tuoStorageKey
/test.html                             →  test_tuoStorageKey
```

### Debug Mode

```javascript
const certSystem = new CertificationSystem({
    appName: 'Nome App',
    debug: true,  // ← Mostra info namespace nella console
    // ...
});
```

Console output:
```
🔒 CertificationSystem v4.1 - Storage Auto-Isolato
📍 URL: /application/matematica/quiz.html
🏷️ Namespace: matematica_quiz
💾 Storage Key: matematica_quiz_tuoStorageKey
```

### Namespace Personalizzato (Opzionale)

```javascript
const certSystem = new CertificationSystem({
    appName: 'Quiz',
    appId: 'custom_namespace',  // ← Forza un namespace specifico
    // ...
});
```

---

## 📦 File del Progetto

| File | URL | Descrizione |
|------|-----|-------------|
| `certification-system.js` | [CDN](https://certificationsystem.netlify.app/certification-system.js) | Sistema modulare v4.1 |
| `index.html` | [Lettore](https://certificationsystem.netlify.app/) | Lettore certificati online |
| `README.md` | - | Questa documentazione |
| `Documentazione.MD` | - | Documentazione tecnica estesa |
| `CHANGELOG.MD` | - | Storico versioni e modifiche |

---

## 📄 Licenza

MIT License - Libero per uso personale e commerciale

---

## 👤 Autori

- **Flejta** - Sviluppo e Design
- **Claude (Anthropic)** - Sistema Modulare

---

## 📞 Supporto

Per domande o bug: **gubercml@gmail.com**

**🌐 Demo Live:** https://certificationsystem.netlify.app/
