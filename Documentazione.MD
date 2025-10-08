# 📚 Sistema di Certificazione Modulare - Documentazione

**Versione:** 1.0.0  
**Autori:** Flejta & Claude  
**Licenza:** MIT

---

## 📦 Installazione

### Metodo 1: Importa da CDN (consigliato)

```html
<script src="https://certificationsystem.netlify.app/certification-system.js"></script>
```

### Metodo 2: Download locale

1. Scarica `certification-system.js` da GitHub
2. Includi nel tuo HTML:

```html
<script src="certification-system.js"></script>
```

---

## 🚀 Utilizzo Base

```javascript
const certSystem = new CertificationSystem({
    appName: 'Nome App',
    storageKey: 'unique_storage_key',
    certUrl: 'https://certificationsystem.netlify.app/',
    fields: [
        { key: 'ex1', label: 'Esercizi Completati', showZero: false },
        { key: 'err', label: 'Errori Totali', showZero: true }
    ]
});
```

---

## ⚙️ Configurazione Completa

### Parametri Obbligatori

| Parametro | Tipo | Descrizione |
|-----------|------|-------------|
| `appName` | string | Nome dell'applicazione |
| `storageKey` | string | Chiave unica per localStorage |
| `certUrl` | string | URL del lettore certificato |
| `fields` | array | Array di campi personalizzati |

### Parametri Opzionali

| Parametro | Default | Descrizione |
|-----------|---------|-------------|
| `trackFocus` | false | Traccia perdita focus finestra |
| `inactivityTimeout` | 120000 | Timeout inattività (ms) |
| `onTimerUpdate` | null | Callback aggiornamento timer |
| `onFieldUpdate` | null | Callback aggiornamento campo |
| `onReset` | null | Callback reset dati |

---

## 📊 Definizione Campi

Ogni campo nell'array `fields` ha questa struttura:

```javascript
{
    key: 'p1',                    // Chiave univoca (usata in JSON)
    label: 'Fase 1 Completata',  // Etichetta visualizzata
    showZero: false               // Se false, mostra "-" invece di 0
}
```

### Esempio con più campi:

```javascript
fields: [
    { key: 'comp', label: 'Completamenti', showZero: false },
    { key: 'err', label: 'Errori', showZero: true },
    { key: 'score', label: 'Punteggio', showZero: true },
    { key: 'time_bonus', label: 'Bonus Velocità', showZero: false }
]
```

---

## 🔧 Metodi Principali

### Gestione Campi

```javascript
// Incrementa campo
certSystem.incrementField('err', 1);

// Imposta valore
certSystem.setField('score', 100);

// Leggi valore
const errori = certSystem.getField('err');

// Ottieni tutti i dati
const allData = certSystem.getData();
```

### Certificazione

```javascript
// Genera link
const link = certSystem.generateCertLink();

// Copia negli appunti
certSystem.copyCertLink();

// Reset completo
certSystem.resetData();
```

### UI Helper

```javascript
// Renderizza pannello statistiche
certSystem.renderStatsPanel('containerId');

// Setup bottoni automatico
certSystem.setupButtons(
    'generateBtnId',
    'copyBtnId', 
    'resetBtnId',
    'linkContainerId'
);
```

---

## 🎨 Esempio HTML Richiesto

```html
<!-- Pannello certificato -->
<div class="certificate-panel">
    <h3>📜 Certificato</h3>
    
    <!-- Container statistiche (popolato automaticamente) -->
    <div class="cert-stats" id="certStatsContainer"></div>
    
    <button id="generateCertBtn">Genera Link</button>
    <button id="resetBtn">Reset</button>
    
    <!-- Container link (nascosto inizialmente) -->
    <div id="certLinkContainer" style="display: none;">
        <div class="cert-link" id="certLink"></div>
        <button id="copyCertBtn">Copia</button>
    </div>
</div>
```

---

## 📱 Tracking Focus (Opzionale)

Per app dove vuoi rilevare se lo studente cambia finestra:

```javascript
const certSystem = new CertificationSystem({
    // ... altre config
    trackFocus: true
});
```

Questo aggiunge automaticamente due campi:
- `fl`: Numero volte focus perso
- `flt`: Tempo totale focus perso (secondi)

---

## 🎯 Esempio Completo

```javascript
// Inizializzazione
const certSystem = new CertificationSystem({
    appName: 'Quiz Matematica',
    storageKey: 'math_quiz_data',
    certUrl: 'https://certificationsystem.netlify.app/',
    trackFocus: true,
    fields: [
        { key: 'quiz', label: 'Quiz Completati', showZero: false },
        { key: 'correct', label: 'Risposte Corrette', showZero: false },
        { key: 'wrong', label: 'Risposte Sbagliate', showZero: true }
    ],
    onTimerUpdate: (time) => {
        document.getElementById('timer').textContent = 
            certSystem.getFormattedTime(time);
    },
    onFieldUpdate: (key, value) => {
        console.log(`Campo ${key} aggiornato: ${value}`);
        certSystem.renderStatsPanel('certStatsContainer');
    }
});

// Setup UI
certSystem.setupButtons('genBtn', 'copyBtn', 'resetBtn', 'linkDiv');
certSystem.renderStatsPanel('certStatsContainer');

// Durante l'uso dell'app
function onQuizCompleted(correct, wrong) {
    certSystem.incrementField('quiz');
    certSystem.incrementField('correct', correct);
    certSystem.incrementField('wrong', wrong);
}
```

---

## 🔒 Struttura Dati JSON

Il sistema salva i dati in questo formato:

```json
{
    "t": 1234,        // Tempo totale (secondi)
    "quiz": 5,        // Campo personalizzato 1
    "correct": 47,    // Campo personalizzato 2
    "wrong": 3,       // Campo personalizzato 3
    "fl": 2,          // Focus lost (se trackFocus=true)
    "flt": 45         // Focus lost time (se trackFocus=true)
}
```

---

## 💡 Best Practices

1. **StorageKey Unico**: Usa un nome univoco per ogni app
2. **ShowZero**: Usa `false` per contatori di completamenti/fasi
3. **TrackFocus**: Attiva solo per verifiche/esami
4. **Callback**: Usa callback per aggiornare UI in tempo reale
5. **Reset**: Aggiungi sempre bottone reset per test/debug

---

## 🐛 Troubleshooting

### "Link non funziona"
✅ Verifica che `certUrl` punti al lettore certificato corretto

### "Dati non si salvano"
✅ Controlla che localStorage sia abilitato nel browser

### "Timer non parte"
✅ Verifica che `startTimer()` venga chiamato dopo inizializzazione

### "Statistiche non si aggiornano"
✅ Usa `renderStatsPanel()` dopo ogni `incrementField()`

---

## 📞 Supporto

Per domande o bug, contatta: gubercml@gmail.com

### **2. Documentazione.MD**
Aggiungi la nuova API:
```markdown
## 🆕 Metodi v3.0

### renderFullPanel(containerId, options)
Crea un pannello certificato completo con UI integrata.

**Parametri:**
- `containerId` (string): ID del container HTML
- `options` (object): Opzioni di configurazione
  - `collapsible` (boolean): Pannello comprimibile (default: true)
  - `showStudentControls` (boolean): Mostra controlli studente (default: true)
  - `showClassroomToggle` (boolean): Mostra toggle modalità classe (default: true)

**Esempio:**
```javascript
certSystem.renderFullPanel('certificateContainer', {
    collapsible: true,
    showStudentControls: true,
    showClassroomToggle: true
});
