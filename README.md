# 📚 Sistema di Certificazione per App Didattiche

> ⚠️ **v4.1 - IMPORTANTE**: Storage automaticamente isolato per ogni app. Ogni applicazione ora mantiene i propri dati separati.

## 🆕 Novità v4.1 (Gennaio 2025)
- **✅ RISOLTO IL PROBLEMA STORAGE CONDIVISO**
- **🔒 Isolamento automatico** per ogni app basato su URL
- **📦 Zero modifiche richieste** alle app esistenti
- **🔄 Gli studenti ripartono da zero** (dati precedenti non migrati)

## ⚠️ Nota per Aggiornamento
Sostituendo il file `certification-system.js` con la v4.1:
- Ogni app avrà automaticamente storage separato
- I dati precedenti non saranno più accessibili
- Gli studenti dovranno ricominciare le statistiche

Sistema modulare e riutilizzabile per tracciare e certificare l'attività degli studenti nelle applicazioni didattiche.

**🌐 Live Demo:** https://certificationsystem.netlify.app/

---

## ✨ Caratteristiche

- ✅ **Salvataggio automatico** in localStorage (statistiche cumulative)
- ✅ **Timer intelligente** (si ferma dopo 2 minuti di inattività)
- ✅ **Campi personalizzabili** per ogni app
- ✅ **Tracking focus opzionale** (rileva quando lo studente cambia finestra)
- ✅ **Link certificato criptato** da inviare ai docenti
- ✅ **Lettore certificato integrato** con valutazione automatica
- ✅ **Completamente modulare** e riutilizzabile

---

## 🚀 Quick Start

### 1. Importa il sistema nella tua app

```html
<script src="https://certificationsystem.netlify.app/certification-system.js"></script>
```

### 2. Configura

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

### 4. HTML richiesto

```html
<div id="certStatsContainer"></div>
<button id="generateCertBtn">Genera Link</button>
<button id="resetBtn">Reset</button>
<div id="certLinkContainer" style="display: none;">
    <div class="cert-link" id="certLink"></div>
    <button id="copyCertBtn">Copia</button>
</div>
```

### 5. Setup UI automatico

```javascript
certSystem.renderStatsPanel('certStatsContainer');
certSystem.setupButtons('generateCertBtn', 'copyCertBtn', 'resetBtn', 'certLinkContainer');
```

---

## 📦 File del Progetto

| File | URL | Descrizione |
|------|-----|-------------|
| `certification-system.js` | [Link CDN](https://certificationsystem.netlify.app/certification-system.js) | Sistema modulare |
| `index.html` | [Lettore](https://certificationsystem.netlify.app/) | Lettore certificati |
| `README.md` | - | Documentazione |

---

## 🎯 Esempio Completo

Vedi il template completo: [`template.html`](template.html)

```javascript
const certSystem = new CertificationSystem({
    appName: 'Quiz Matematica',
    storageKey: 'math_quiz_data',
    certUrl: 'https://certificationsystem.netlify.app/',
    trackFocus: true, // true per esami
    fields: [
        { key: 'quiz', label: 'Quiz Completati', showZero: false },
        { key: 'correct', label: 'Risposte Corrette', showZero: false },
        { key: 'wrong', label: 'Risposte Sbagliate', showZero: true }
    ],
    onTimerUpdate: (time) => {
        document.getElementById('timer').textContent = 
            certSystem.getFormattedTime(time);
    }
});

// Durante l'uso
function onQuizCompleted(correct, wrong) {
    certSystem.incrementField('quiz');
    certSystem.incrementField('correct', correct);
    certSystem.incrementField('wrong', wrong);
}
```

---

## ⚙️ Configurazione Avanzata

### Parametri disponibili

```javascript
{
    appName: 'string',              // Nome app (obbligatorio)
    storageKey: 'string',           // Chiave localStorage (obbligatorio)
    certUrl: 'string',              // URL lettore (obbligatorio)
    fields: [...],                  // Campi personalizzati (obbligatorio)
    trackFocus: false,              // Traccia perdita focus
    inactivityTimeout: 120000,      // Timeout inattività (ms)
    onTimerUpdate: (time) => {},    // Callback timer
    onFieldUpdate: (key, val) => {},// Callback campo
    onReset: () => {}               // Callback reset
}
```

### Definizione campi

```javascript
fields: [
    {
        key: 'comp',           // Chiave univoca (JSON)
        label: 'Completamenti',// Etichetta visualizzata
        showZero: false        // Se false, mostra "-" invece di 0
    }
]
```

---

## 📊 Struttura Dati

I dati vengono salvati in localStorage e codificati in Base64 per il link:

```json
{
    "t": 1234,      // Tempo totale (secondi)
    "comp": 5,      // Campo personalizzato
    "err": 3,       // Campo personalizzato
    "fl": 2,        // Focus lost count (se trackFocus=true)
    "flt": 45       // Focus lost time (se trackFocus=true)
}
```

---

## 🔧 Metodi Principali

### Gestione Campi

```javascript
certSystem.incrementField(key, amount);  // Incrementa
certSystem.setField(key, value);         // Imposta
certSystem.getField(key);                // Leggi
certSystem.getData();                    // Tutti i dati
```

### Certificazione

```javascript
certSystem.generateCertLink();           // Genera link
certSystem.copyCertLink();               // Copia negli appunti
certSystem.resetData();                  // Reset completo
```

### UI Helper

```javascript
certSystem.renderStatsPanel(containerId);              // Render statistiche
certSystem.setupButtons(genId, copyId, resetId, linkId); // Setup bottoni
certSystem.getFormattedTime(seconds);                  // Formatta tempo
```

---

## 🎨 Lettore Certificati

Il lettore supporta **due modalità**:

1. **URL con parametri**: `https://certificationsystem.netlify.app/?cert=eyJ0...`
2. **Input manuale**: Incolla link o stringa Base64

**Caratteristiche:**
- ✅ Visualizzazione dinamica campi
- ✅ Mostra "-" per valori non applicabili
- ✅ Valutazione automatica (Eccellente/Buono/Da Migliorare)
- ✅ Statistiche dettagliate
- ✅ Pronto per stampa

---

## 💡 Use Cases

### App per Esercizi

```javascript
trackFocus: false,
fields: [
    { key: 'exercises', label: 'Esercizi Completati', showZero: false },
    { key: 'errors', label: 'Errori', showZero: true }
]
```

### Verifiche/Esami

```javascript
trackFocus: true,  // Rileva cambio finestra
fields: [
    { key: 'questions', label: 'Domande Risposte', showZero: false },
    { key: 'correct', label: 'Risposte Corrette', showZero: false },
    { key: 'score', label: 'Punteggio', showZero: true }
]
```

### Quiz a Tempo

```javascript
fields: [
    { key: 'completed', label: 'Quiz Completati', showZero: false },
    { key: 'speed_bonus', label: 'Bonus Velocità', showZero: false }
],
onTimerUpdate: (time) => {
    if (time > 600) showWarning('Tempo scaduto!');
}
```

---

## 🐛 Troubleshooting

| Problema | Soluzione |
|----------|-----------|
| Link non funziona | Verifica `certUrl` corretto |
| Dati non si salvano | Controlla localStorage abilitato |
| Timer non parte | Chiama `startTimer()` dopo init |
| Stats non aggiornano | Usa `renderStatsPanel()` dopo `incrementField()` |

---

## 📄 Licenza

MIT License - Libero per uso personale e commerciale

---

## 👤 Autori

- **Flejta** - Sviluppo e Design
- **Claude (Anthropic)** - Sistema Modulare

---

## 📞 Supporto

Per domande o bug: gubercml@gmail.com

**Repository:** https://github.com/your-repo  
**Demo Live:** https://certificationsystem.netlify.app/

## 📌 Changelog v3.0
- ✨ **NUOVO**: Metodo `renderFullPanel()` con UI completa integrata
- 🎓 Sistema dati studente persistenti 
- 🏫 Modalità Classe con tracking rigoroso
- 🔄 Pannello certificato collassabile
- 🐛 Fix bug reset statistiche

## 🆕 Uso Semplificato (v3.0+)
```javascript
// NUOVO: UI completa con una sola chiamata
certSystem.renderFullPanel('containerId', {
    collapsible: true,
    showStudentControls: true,
    showClassroomToggle: true
});

// VECCHIO metodo (ancora supportato)
certSystem.renderStatsPanel('containerId');
