# 📚 Sistema di Certificazione Modulare - Documentazione Tecnica Completa

**Versione:** 4.1.0
**Autori:** Flejta & Claude
**Licenza:** MIT

---

## 📑 Indice

1. [Installazione](#-installazione)
2. [Utilizzo Base](#-utilizzo-base)
3. [Configurazione Completa](#-configurazione-completa)
4. [Modalità Operative](#-modalità-operative)
5. [API Reference Completa](#-api-reference-completa)
6. [Struttura Dati](#-struttura-dati)
7. [Storage e Isolamento](#-storage-e-isolamento)
8. [Tracking Avanzato](#-tracking-avanzato)
9. [UI Components](#-ui-components)
10. [Esempi Avanzati](#-esempi-avanzati)
11. [Best Practices](#-best-practices)
12. [Troubleshooting](#-troubleshooting)

---

## 📦 Installazione

### Metodo 1: Importa da CDN (Consigliato)

```html
<script src="https://certificationsystem.netlify.app/certification-system.js"></script>
```

### Metodo 2: Download Locale

1. Scarica `certification-system.js` da GitHub
2. Includi nel tuo HTML:

```html
<script src="path/to/certification-system.js"></script>
```

### Metodo 3: Module Import (ESM)

```javascript
import CertificationSystem from './certification-system.js';
```

---

## 🚀 Utilizzo Base

### Configurazione Minima

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

### UI Automatica

```html
<div id="certificatePanel"></div>
```

```javascript
// Un pannello completo con una sola riga
certSystem.renderFullPanel('certificatePanel');
```

---

## ⚙️ Configurazione Completa

### Parametri del Costruttore

#### Parametri Obbligatori

| Parametro | Tipo | Descrizione |
|-----------|------|-------------|
| `appName` | `string` | Nome dell'applicazione (visualizzato nel certificato) |
| `storageKey` | `string` | Chiave unica per localStorage (verrà auto-prefissata con namespace) |
| `certUrl` | `string` | URL completo del lettore certificato |
| `fields` | `Array<FieldConfig>` | Array di campi personalizzati (vedi sotto) |

#### Parametri Opzionali - Base

| Parametro | Tipo | Default | Descrizione |
|-----------|------|---------|-------------|
| `appVersion` | `string` | `'4.1.0'` | Versione dell'applicazione |
| `appId` | `string` | `null` | Forza namespace specifico (override auto-generazione) |
| `debug` | `boolean` | `false` | Abilita log debug in console |

#### Parametri Opzionali - Tracking

| Parametro | Tipo | Default | Descrizione |
|-----------|------|---------|-------------|
| `trackFocus` | `boolean` | `false` | Traccia perdita focus finestra |
| `inactivityTimeout` | `number` | `120000` | Timeout inattività in ms (2 minuti) |

#### Parametri Opzionali - Modalità Avanzate

| Parametro | Tipo | Default | Descrizione |
|-----------|------|---------|-------------|
| `classroomMode` | `boolean` | `false` | Avvia in modalità classe |
| `verificationMode` | `boolean` | `false` | Avvia in modalità verifica |
| `suspiciousResizeThreshold` | `number` | `100` | Pixel per considerare resize sospetto |
| `requireFullscreen` | `boolean` | `false` | Richiedi modalità fullscreen |

#### Callbacks - Timer e Campi

| Callback | Firma | Descrizione |
|----------|-------|-------------|
| `onTimerUpdate` | `(seconds: number) => void` | Chiamato ogni secondo con tempo totale |
| `onFieldUpdate` | `(key: string, value: any) => void` | Chiamato ad ogni modifica campo |
| `onReset` | `() => void` | Chiamato dopo reset completo dati |

#### Callbacks - Modalità Operative

| Callback | Firma | Descrizione |
|----------|-------|-------------|
| `onClassroomModeStart` | `() => void` | Modalità classe attivata |
| `onClassroomModeEnd` | `() => void` | Modalità classe disattivata |
| `onVerificationModeStart` | `() => void` | Modalità verifica attivata |
| `onVerificationModeEnd` | `() => void` | Modalità verifica disattivata |
| `onNormalMode` | `() => void` | Tornato a modalità normale |

#### Callbacks - Sessioni

| Callback | Firma | Descrizione |
|----------|-------|-------------|
| `onSessionStart` | `(sessionId: string) => void` | Sessione classe iniziata |
| `onSessionEnd` | `(session: Session) => void` | Sessione classe terminata |

#### Callbacks - Tracking Avanzato

| Callback | Firma | Descrizione |
|----------|-------|-------------|
| `onFocusLost` | `(count: number) => void` | Focus finestra perso |
| `onFocusRestored` | `(duration: number) => void` | Focus ripristinato (durata in secondi) |
| `onWindowResize` | `(data: ResizeData) => void` | Finestra ridimensionata |
| `onSuspiciousActivity` | `(type: string, details: object) => void` | Attività sospetta rilevata |

---

## 📝 Definizione Campi (FieldConfig)

### Struttura Campo

```typescript
interface FieldConfig {
    key: string;              // Chiave univoca (usata in JSON)
    label: string;            // Etichetta visualizzata
    type?: FieldType;         // Tipo campo (default: 'number')
    showZero?: boolean;       // Se mostrare 0 o "-" (default: true)
    defaultValue?: any;       // Valore iniziale
    unit?: string;            // Unità di misura (opzionale)
}

type FieldType = 'number' | 'text' | 'time' | 'percentage';
```

### Esempi per Tipo

```javascript
fields: [
    // CAMPO NUMERO (default)
    {
        key: 'comp',
        label: 'Completamenti',
        type: 'number',           // può essere omesso
        showZero: false,          // mostra "-" se 0
        defaultValue: 0
    },

    // CAMPO TESTUALE
    {
        key: 'note',
        label: 'Note Studente',
        type: 'text',
        defaultValue: ''
    },

    // CAMPO TEMPO (auto-formattato)
    {
        key: 'tempo_extra',
        label: 'Tempo Extra Concesso',
        type: 'time',             // Formattato come "5m 30s"
        showZero: true
    },

    // CAMPO PERCENTUALE
    {
        key: 'accuratezza',
        label: 'Accuratezza',
        type: 'percentage',       // Mostra con "%"
        showZero: true
    }
]
```

---

## 🎯 Modalità Operative

Il sistema supporta **3 modalità operative** distinte con comportamenti diversi.

### 1. Modalità Normale (Default)

**Uso:** Esercizi standard, pratica libera, studio individuale.

**Caratteristiche:**
- Timer si ferma dopo 2 minuti di inattività
- Dati salvati cumulativamente
- Nessun tracking avanzato
- Focus window non tracciato

**Attivazione:**
```javascript
// Default all'avvio, oppure:
certSystem.toggleNormalMode();
```

**Callbacks:**
```javascript
onNormalMode: () => {
    console.log('Tornato a modalità normale');
}
```

---

### 2. Modalità Lavoro in Classe

**Uso:** Attività guidate in classe, esercizi supervisionati, compiti assistiti.

**Caratteristiche:**
- ✅ Timer sempre attivo
- ✅ Tracking perdita focus finestra
- ✅ Sessioni con ID univoco
- ✅ Aiuti/suggerimenti possono essere visibili
- ✅ Log eventi focus
- ✅ Dati inclusi nel certificato

**Attivazione:**
```javascript
const success = certSystem.toggleClassroomMode(true);
if (success) {
    console.log('Modalità classe attivata');
}
```

**Disattivazione:**
```javascript
certSystem.toggleClassroomMode(false);
```

**Callbacks:**
```javascript
onClassroomModeStart: () => {
    // Mostra UI per classe
    document.getElementById('help-section').style.display = 'block';
    console.log('Modalità classe attiva - aiuti disponibili');
},
onClassroomModeEnd: () => {
    console.log('Modalità classe disattivata');
}
```

**Dati Aggiuntivi Salvati:**
- Sessione con ID univoco
- Timestamp inizio/fine
- Eventi focus (perdita/ripristino)
- Conteggio cambio finestra

---

### 3. Modalità Verifica (Massima Sicurezza)

**Uso:** Esami ufficiali, verifiche, test con valore di valutazione.

**Caratteristiche:**
- 🔴 Timer SEMPRE attivo (non si ferma mai)
- 🔴 Tracking ESTREMO di tutte le attività
- 🔴 Alert visivi allo studente per ogni irregolarità
- 🔴 Warning prima di chiudere pagina
- 🔴 Dati completi con violazioni nel certificato

**Attività Tracciate:**
1. **Perdita focus** - Conta e durata
2. **Resize finestra sospetto** - Oltre threshold configurato
3. **Tab nascosta** - Cambio tab del browser
4. **Console sviluppatore** - Apertura F12
5. **Copy/Paste** - Tentativi di copia/incolla
6. **Fullscreen exit** - Uscita da schermo intero
7. **Exit attempt** - Tentativo chiusura pagina

**Attivazione:**
```javascript
const success = certSystem.toggleVerificationMode(true);
if (success) {
    console.log('Modalità verifica attivata - tracking estremo');
}
```

**Callbacks:**
```javascript
onVerificationModeStart: () => {
    // Nascondi TUTTI gli aiuti
    document.querySelectorAll('.hint, .help, .solution').forEach(el => {
        el.remove();
    });

    // Alert studente
    alert('⚠️ MODALITÀ VERIFICA\n\nOgni attività sospetta verrà registrata e inviata al docente.');
},

onSuspiciousActivity: (type, details) => {
    console.warn('⚠️ Attività sospetta:', type, details);

    // Esempio: invia al server
    fetch('/api/log-violation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            studentInfo: certSystem.getStudentInfo(),
            type: type,
            details: details,
            timestamp: Date.now()
        })
    });
}
```

**Tipi di Attività Sospette:**
- `focus_lost` - Focus perso
- `suspicious_resize` - Resize oltre threshold
- `tab_hidden` - Tab nascosta
- `fullscreen_exit` - Uscita da fullscreen
- `copy_attempt` - Tentativo copia
- `paste_attempt` - Tentativo incolla
- `devtools_open` - Console aperta
- `exit_attempt` - Tentativo chiusura
- `reset_attempt_in_verification` - Tentativo reset durante verifica

**Switch tra Modalità:**
Le modalità Classe e Verifica sono **mutuamente esclusive**. Passare da una all'altra richiede conferma utente.

```javascript
// Da classe a verifica
certSystem.toggleVerificationMode(true);
// → Prompt: "Disattivare modalità Lavoro in Classe e passare a Verifica?"
```

---

## 🔧 API Reference Completa

### Gestione Campi

#### `incrementField(key: string, amount: number = 1): void`

Incrementa un campo numerico.

```javascript
certSystem.incrementField('correct');           // +1
certSystem.incrementField('score', 10);         // +10
certSystem.incrementField('errors', -1);        // -1 (decremento)
```

**Comportamento:**
- Funziona solo con campi numerici (non text)
- Salva automaticamente in localStorage
- Chiama callback `onFieldUpdate` se definito

---

#### `setField(key: string, value: any): void`

Imposta valore campo (numerico o testuale).

```javascript
// Numeri
certSystem.setField('score', 100);
certSystem.setField('time_spent', 3665);

// Testo
certSystem.setField('note', 'Ottimo lavoro!');
certSystem.setField('feedback', 'Rivedere le frazioni');

// Percentuali
certSystem.setField('accuracy', 95);
```

**Comportamento:**
- Funziona con tutti i tipi di campo
- Salva automaticamente
- Chiama `onFieldUpdate`

---

#### `getField(key: string): any`

Legge valore singolo campo.

```javascript
const errors = certSystem.getField('err');
const note = certSystem.getField('note');
const score = certSystem.getField('score');
```

**Return:** Valore del campo, o `0` se non esiste.

---

#### `getData(): object`

Ottiene tutti i dati completi.

```javascript
const allData = certSystem.getData();

/* Ritorna:
{
    t: 1234,                    // tempo
    comp: 5,                    // campi numerici
    err: 2,
    note: 'testo',              // campi testuali
    _meta: {...},               // metadati
    _studentInfo: {...},        // info studente
    _session: {...},            // sessione corrente
    _verificationSession: {...},// sessione verifica
    _events: [...],             // log eventi
    _suspiciousActivities: [...] // attività sospette
}
*/
```

---

### Certificazione

#### `generateCertLink(): string`

Genera link certificato completo.

```javascript
const link = certSystem.generateCertLink();
// Ritorna: "https://certificationsystem.netlify.app/?cert=eyJ0..."
```

**Dati Inclusi:**
- Metadati app e sessione
- Info studente (se presenti)
- Tutti i valori dei campi
- Campi testuali
- Definizioni campi
- Eventi e attività sospette (se modalità verifica)

---

#### `copyCertLink(): void`

Copia link negli appunti.

```javascript
certSystem.copyCertLink();
// Mostra alert: "Link certificato copiato!"
```

**Comportamento:**
- Usa Clipboard API
- Mostra alert successo/errore
- Fallback: messaggio per copia manuale

---

#### `resetData(): void`

Reset completo di tutti i dati.

```javascript
certSystem.resetData();
```

**Comportamento:**
- Richiede conferma utente
- In modalità verifica: registra come attività sospetta
- Termina sessione attiva (se presente)
- Crea nuovo oggetto dati vuoto
- Salva in localStorage
- Aggiorna tutte le UI
- Chiama callback `onReset`

**Prompt:**
- Normale: "Sei sicuro di voler azzerare tutte le statistiche?"
- Verifica: "⚠️ ATTENZIONE: Sei in modalità verifica! Il reset verrà registrato come attività sospetta. Vuoi davvero procedere?"

---

### Modalità Operative

#### `toggleClassroomMode(enabled: boolean): boolean`

Attiva/disattiva modalità classe.

```javascript
const success = certSystem.toggleClassroomMode(true);
if (success) {
    console.log('Modalità classe attivata');
}
```

**Return:** `true` se operazione riuscita, `false` se annullata.

**Comportamento:**
- Se già in modalità verifica, chiede conferma per switch
- Reset dati per nuova sessione
- Crea oggetto `_classroomSession`
- Setup tracking focus
- Chiama callbacks appropriati
- Persiste modalità in localStorage

---

#### `toggleVerificationMode(enabled: boolean): boolean`

Attiva/disattiva modalità verifica.

```javascript
const success = certSystem.toggleVerificationMode(true);
```

**Return:** `true` se operazione riuscita, `false` se annullata.

**Comportamento:**
- Se già in modalità classe, chiede conferma per switch
- Reset completo per verifica
- Crea oggetto `_verificationSession`
- Setup tracking ESTREMO
- Attiva beforeunload warning
- Chiama callbacks appropriati
- Persiste modalità

---

#### `toggleNormalMode(): void`

Torna a modalità normale.

```javascript
certSystem.toggleNormalMode();
```

**Comportamento:**
- Disattiva sia classe che verifica
- Rimuove tracking avanzato
- Chiama `onNormalMode` callback

---

#### `getCurrentMode(): string`

Ritorna modalità corrente.

```javascript
const mode = certSystem.getCurrentMode();
// Ritorna: 'normal' | 'classroom' | 'verification'

if (mode === 'verification') {
    console.log('In modalità verifica - aiuti disabilitati');
}
```

---

### Gestione Sessioni

#### `startClassroomSession(): void`

Avvia una nuova sessione classe.

```javascript
certSystem.startClassroomSession();
```

**Comportamento:**
- Genera ID sessione univoco: `session_<timestamp>`
- Crea oggetto `_session` con startTime
- Reset contatori per sessione
- Reset tracking focus
- Salva dati
- Chiama `onSessionStart(sessionId)`

**Struttura Sessione:**
```javascript
{
    id: 'session_1704067200000',
    startTime: 1704067200000,
    endTime: null,
    classroomMode: true,
    verificationMode: false,
    focusEvents: []
}
```

---

#### `endClassroomSession(): string | null`

Termina sessione classe corrente.

```javascript
const certLink = certSystem.endClassroomSession();
if (certLink) {
    console.log('Sessione terminata. Certificato:', certLink);
}
```

**Return:** Link certificato generato, o `null` se nessuna sessione attiva.

**Comportamento:**
- Imposta `endTime`
- Aggiunge sessione a `_sessionHistory`
- Salva dati
- Chiama `onSessionEnd(session)`
- Genera e ritorna link certificato

---

#### `isInClassroomSession(): boolean`

Verifica se c'è sessione classe attiva.

```javascript
if (certSystem.isInClassroomSession()) {
    console.log('Sessione classe in corso');
}
```

---

#### `isInVerificationMode(): boolean`

Verifica se in modalità verifica.

```javascript
if (certSystem.isInVerificationMode()) {
    // Nascondi aiuti
    hideHints();
}
```

---

### Info Studente (Globali)

#### `promptStudentInfo(): object | null`

Richiede info studente con prompt.

```javascript
const info = certSystem.promptStudentInfo();
if (info) {
    console.log('Studente:', info.nome, info.cognome);
}
```

**Return:**
```javascript
{
    nome: 'Mario',
    cognome: 'Rossi',
    classe: '3A'
}
```
o `null` se annullato.

**Comportamento:**
- Mostra 3 prompt sequenziali (nome, cognome, classe)
- Pre-compila con valori esistenti se già salvati
- Salva in `student_global_info` (globale)
- Return `null` se nome o cognome vuoti

---

#### `saveStudentInfo(info: StudentInfo): object`

Salva manualmente info studente.

```javascript
certSystem.saveStudentInfo({
    nome: 'Mario',
    cognome: 'Rossi',
    classe: '3A'
});
```

**Storage:** `student_global_info` (localStorage globale, condiviso tra tutte le app)

---

#### `getStudentInfo(): object | null`

Legge info studente correnti.

```javascript
const student = certSystem.getStudentInfo();
if (student) {
    console.log(`Benvenuto ${student.nome}!`);
}
```

---

### UI Helper

#### `renderFullPanel(containerId: string, options?: PanelOptions): void`

Renderizza pannello completo con UI integrata.

```javascript
certSystem.renderFullPanel('certContainer', {
    collapsible: true,              // Pannello comprimibile
    showStudentControls: true,      // Mostra controlli studente
    showClassroomToggle: false,     // Mostra toggle modalità classe
    showVerificationToggle: false   // Mostra toggle modalità verifica
});
```

**Options (tutti opzionali):**
```typescript
interface PanelOptions {
    collapsible?: boolean;              // default: true
    showStudentControls?: boolean;      // default: true
    showClassroomToggle?: boolean;      // default: true
    showVerificationToggle?: boolean;   // default: true
}
```

**Cosa Include:**
- Statistiche formattate
- Bottoni genera/copia/reset
- Info studente (se presenti)
- Indicatore modalità attiva
- CSS integrato (nessun file esterno necessario)
- Toggle modalità classe/verifica (se abilitati)

**Stile:**
- Pannello viola/rosso a seconda della modalità
- Animazione pulse in modalità verifica
- Hover effects
- Responsive

---

#### `renderStatsPanel(containerId: string): void`

Renderizza solo statistiche (legacy).

```javascript
certSystem.renderStatsPanel('statsContainer');
```

**Mostra:**
- Info studente (se presenti)
- Tempo totale formattato
- Tutti i campi personalizzati
- Focus tracking (se abilitato)
- Warning visivi per focus alto

---

#### `setupButtons(genBtnId, copyBtnId, resetBtnId, linkContainerId, studentBtnId?): void`

Setup manuale bottoni (legacy).

```javascript
certSystem.setupButtons(
    'generateBtn',
    'copyBtn',
    'resetBtn',
    'linkContainer',
    'studentBtn'    // opzionale
);
```

**Comportamento:**
- Collega event listeners ai bottoni
- Gestisce visibilità container link
- Rigenera pannello stats dopo reset

---

#### `getFormattedTime(seconds: number): string`

Formatta secondi in stringa leggibile.

```javascript
certSystem.getFormattedTime(30);        // "30s"
certSystem.getFormattedTime(125);       // "2m 5s"
certSystem.getFormattedTime(3665);      // "1h 1m 5s"
```

**Formato:**
- Sotto 60s: "30s"
- Sotto 1h: "5m 30s"
- Oltre 1h: "1h 5m 30s"

---

### Tracking Avanzato

#### `logEvent(type: string, data: object): void`

Registra evento generico.

```javascript
certSystem.logEvent('exercise_completed', {
    exerciseId: 123,
    score: 95,
    timestamp: Date.now()
});
```

**Comportamento:**
- Aggiunge a array `_events`
- Include timestamp automatico
- Salva in localStorage

---

#### `logSuspiciousActivity(type: string, details: object): void`

Registra attività sospetta (modalità verifica).

```javascript
certSystem.logSuspiciousActivity('custom_violation', {
    reason: 'Clicked outside app area',
    coordinates: { x: 100, y: 200 }
});
```

**Comportamento:**
- Aggiunge a `_suspiciousActivities`
- Include timestamp automatico
- Chiama callback `onSuspiciousActivity`
- Mostra warning visivo all'utente (in verifica)
- Salva dati

---

## 📊 Struttura Dati

### Formato Completo (v4.1)

```javascript
{
    // === METADATI ===
    _meta: {
        appName: 'Quiz Matematica',
        appVersion: '1.0.0',
        appUrl: 'https://example.com/quiz.html',
        appPath: '/application/matematica/quiz.html',
        namespace: 'matematica_quiz',
        startTime: 1704067200000,
        lastUpdate: 1704070800000
    },

    // === VALORI NUMERICI ===
    _values: {
        t: 1234,            // Tempo totale (secondi)
        comp: 5,            // Campi personalizzati
        err: 3,
        score: 95,
        fl: 2,              // Focus lost count (se trackFocus)
        flt: 45             // Focus lost time (se trackFocus)
    },

    // === CAMPI TESTUALI ===
    _textFields: {
        note: 'Ottimo lavoro',
        feedback: 'Rivedere frazioni'
    },

    // === INFO STUDENTE ===
    _studentInfo: {
        nome: 'Mario',
        cognome: 'Rossi',
        classe: '3A'
    },

    // === LOG EVENTI (modalità classe/verifica) ===
    _events: [
        {
            type: 'focus_lost',
            data: { count: 1, timestamp: 1704067200000 },
            timestamp: 1704067200000
        },
        {
            type: 'window_resize',
            data: { from: {w: 1920, h: 1080}, to: {w: 1280, h: 720} },
            timestamp: 1704067300000
        }
    ],

    // === ATTIVITÀ SOSPETTE (modalità verifica) ===
    _suspiciousActivities: [
        {
            type: 'copy_attempt',
            details: { timestamp: 1704067400000 },
            timestamp: 1704067400000
        },
        {
            type: 'devtools_open',
            details: { timestamp: 1704067500000 },
            timestamp: 1704067500000
        }
    ],

    // === SESSIONE CLASSE ATTIVA ===
    _session: {
        id: 'session_1704067200000',
        startTime: 1704067200000,
        endTime: null,
        classroomMode: true,
        verificationMode: false,
        focusEvents: []
    },

    // === SESSIONE VERIFICA ATTIVA ===
    _verificationSession: {
        startTime: 1704067200000,
        endTime: null,
        strictMode: true
    },

    // === STORICO SESSIONI ===
    _sessionHistory: [
        {
            id: 'session_1704000000000',
            startTime: 1704000000000,
            endTime: 1704003600000,
            classroomMode: true
        }
    ]
}
```

---

## 🔒 Storage e Isolamento

### Storage Keys Utilizzate

Il sistema utilizza diverse chiavi localStorage:

#### 1. Dati App (Isolati)

```
{namespace}_{storageKey}
```

**Esempio:**
- App: `/application/matematica/quiz.html`
- Config storageKey: `quiz_data`
- Key finale: `matematica_quiz_quiz_data`

#### 2. Dati Modalità Classe

```
{namespace}_{storageKey}_classroom
```

Usata quando `classroomMode = true`.

#### 3. Dati Modalità Verifica

```
{namespace}_{storageKey}_verification
```

Usata quando `verificationMode = true`.

#### 4. Persistenza Modalità

```
{namespace}_{storageKey}_modes
```

Salva modalità attiva per recupero dopo refresh:
```javascript
{
    classroomMode: true,
    verificationMode: false,
    lastClosed: 1704067200000
}
```

#### 5. Info Studente (Globale)

```
student_global_info
```

**NOTA:** Questa è l'unica chiave GLOBALE, condivisa tra tutte le app.

---

### Generazione Namespace Automatica

Il namespace viene generato automaticamente dall'URL dell'app:

**Esempi:**

| URL | Namespace |
|-----|-----------|
| `/application/matematica/frazioni.html` | `matematica_frazioni` |
| `/application/inglese/verbi.html` | `inglese_verbi` |
| `/test.html` | `test` |
| `/app/sounds/test.html` | `sounds_test` |
| `/index.html` | `{appName}` (fallback) |

**Algoritmo:**
1. Rimuove `/application/certificationSystem` e `/application`
2. Divide path in parti
3. Prende cartella + file (senza estensione)
4. Se file è `index`, usa solo cartella
5. Sanitizza (solo a-z, 0-9, underscore)
6. Fallback su appName se vuoto

---

### Override Namespace Manuale

```javascript
const certSystem = new CertificationSystem({
    appName: 'Quiz',
    appId: 'mio_namespace_custom',  // ← Override
    storageKey: 'data',
    // ...
});

// Storage finale: mio_namespace_custom_data
```

**Quando usarlo:**
- Vuoi controllare esattamente il namespace
- Hai più versioni della stessa app nello stesso path
- Testing e debug

---

### Debug Storage

```javascript
const certSystem = new CertificationSystem({
    appName: 'Quiz',
    debug: true,  // ← Abilita log
    // ...
});
```

**Output Console:**
```
🔒 CertificationSystem v4.1 - Storage Auto-Isolato
📍 URL: /application/matematica/quiz.html
🏷️ Namespace: matematica_quiz
💾 Storage Key: matematica_quiz_quiz_data
```

---

## 🔍 Tracking Avanzato

### Eventi Tracciati (sempre)

In tutte le modalità:
- `page_load` - Caricamento pagina
- `classroom_mode_enabled` - Attivazione modalità classe
- `classroom_mode_disabled` - Disattivazione modalità classe
- `verification_mode_enabled` - Attivazione modalità verifica
- `verification_mode_disabled` - Disattivazione modalità verifica
- `normal_mode_enabled` - Ritorno modalità normale

### Eventi Tracciati (modalità classe/verifica)

- `focus_lost` - Focus perso
- `focus_restored` - Focus ripristinato
- `window_resize` - Resize finestra
- `visibility_change` - Tab nascosta/visibile
- `fullscreen_exit` - Uscita da fullscreen
- `exit_attempt` - Tentativo chiusura pagina

### Attività Sospette (solo modalità verifica)

- `focus_lost` - Focus perso (più grave in verifica)
- `suspicious_resize` - Resize oltre threshold
- `tab_hidden` - Tab nascosta
- `fullscreen_exit` - Uscita fullscreen
- `copy_attempt` - Tentativo copia
- `paste_attempt` - Tentativo incolla
- `devtools_open` - Console sviluppatore aperta
- `exit_attempt` - Tentativo uscita
- `reset_attempt_in_verification` - Reset durante verifica

### Configurazione Threshold

```javascript
const certSystem = new CertificationSystem({
    // ...
    suspiciousResizeThreshold: 150,  // pixel, default: 100
    // ...
});
```

**Calcolo:** `|newWidth - oldWidth| + |newHeight - oldHeight|`

Se supera threshold → attività sospetta registrata.

---

## 🎨 UI Components

### Pannello Completo

Il metodo `renderFullPanel()` genera automaticamente:

**Struttura HTML:**
```html
<div class="cert-panel" id="{containerId}-panel">
    <div class="cert-panel-header">
        <span class="cert-panel-title">📜 Certificato...</span>
        <span class="cert-collapse-icon">▼</span>
    </div>
    <div class="cert-panel-content">
        <div class="cert-stats" id="{containerId}-stats">
            <!-- Statistiche auto-generate -->
        </div>
        <div><!-- Bottoni --></div>
        <div id="{containerId}-link"><!-- Link generato --></div>
    </div>
</div>
```

**CSS Integrato:** Tutto lo stile è iniettato automaticamente nel `<head>`.

**Classi Speciali:**
- `.cert-panel` - Container principale
- `.cert-panel.verification-mode` - Stile rosso con animazione pulse
- `.cert-panel.collapsed` - Stato collapsed
- `.cert-stat` - Card singola statistica
- `.cert-stat.highlight` - Card evidenziata (tempo totale)
- `.cert-stat.warning` - Card warning (focus alto)

---

### Personalizzazione Stile

Se vuoi sovrascrivere lo stile:

```css
/* Nel tuo CSS */
.cert-panel {
    background: linear-gradient(135deg, #your-color1 0%, #your-color2 100%) !important;
}

.cert-stat {
    background: rgba(255, 255, 255, 0.3) !important;
}
```

---

## 💡 Esempi Avanzati

### Esempio 1: Quiz con Timeout Automatico

```javascript
const certSystem = new CertificationSystem({
    appName: 'Quiz Geografia',
    storageKey: 'geo_quiz',
    certUrl: 'https://certificationsystem.netlify.app/',
    fields: [
        { key: 'questions', label: 'Domande', showZero: false },
        { key: 'correct', label: 'Corrette', showZero: false },
        { key: 'score', label: 'Punteggio', showZero: true }
    ],
    onTimerUpdate: (seconds) => {
        const timeLimit = 600; // 10 minuti
        const remaining = timeLimit - seconds;

        if (remaining <= 0) {
            // Tempo scaduto
            alert('⏰ Tempo scaduto!');
            certSystem.toggleVerificationMode(false);

            // Mostra certificato automaticamente
            const link = certSystem.generateCertLink();
            window.location.href = link;
        } else {
            // Aggiorna timer UI
            document.getElementById('timer').textContent =
                certSystem.getFormattedTime(remaining);
        }
    }
});

certSystem.renderFullPanel('certContainer');
```

---

### Esempio 2: Salvataggio Automatico su Server

```javascript
const certSystem = new CertificationSystem({
    appName: 'Esame Matematica',
    storageKey: 'math_exam',
    certUrl: 'https://certificationsystem.netlify.app/',
    trackFocus: true,
    fields: [
        { key: 'answers', label: 'Risposte Date', showZero: false },
        { key: 'score', label: 'Punteggio', showZero: true }
    ],

    // Salva su server ogni modifica
    onFieldUpdate: async (key, value) => {
        const data = certSystem.getData();
        const student = certSystem.getStudentInfo();

        await fetch('/api/save-progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                studentId: student.nome + '_' + student.cognome,
                appName: 'math_exam',
                data: data,
                timestamp: Date.now()
            })
        });
    },

    // Monitora attività sospette
    onSuspiciousActivity: async (type, details) => {
        const student = certSystem.getStudentInfo();

        // Invia alert docente in tempo reale
        await fetch('/api/alert-teacher', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                student: student,
                violation: type,
                details: details,
                timestamp: Date.now()
            })
        });
    }
});

// Avvia verifica
certSystem.toggleVerificationMode(true);
```

---

### Esempio 3: Modalità Classe con Password Docente

```javascript
const certSystem = new CertificationSystem({
    appName: 'Esercizi Inglese',
    storageKey: 'english_ex',
    certUrl: 'https://certificationsystem.netlify.app/',
    fields: [
        { key: 'exercises', label: 'Esercizi', showZero: false },
        { key: 'hints', label: 'Aiuti Usati', showZero: true }
    ],

    onClassroomModeStart: () => {
        // Abilita aiuti
        document.querySelectorAll('.hint-button').forEach(btn => {
            btn.style.display = 'block';
        });
    },

    onClassroomModeEnd: () => {
        // Disabilita aiuti
        document.querySelectorAll('.hint-button').forEach(btn => {
            btn.style.display = 'none';
        });
    }
});

// UI docente
document.getElementById('teacher-start-btn').addEventListener('click', async () => {
    const password = prompt('Password docente:');

    // Verifica con server
    const response = await fetch('/api/verify-teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
    });

    if (response.ok) {
        certSystem.toggleClassroomMode(true);
        alert('✅ Modalità classe attivata');
    } else {
        alert('❌ Password errata');
    }
});

certSystem.renderFullPanel('certContainer', {
    showClassroomToggle: false,  // Nascondi toggle pubblico
    showVerificationToggle: false
});
```

---

### Esempio 4: Campi Dinamici con Feedback

```javascript
const certSystem = new CertificationSystem({
    appName: 'Algebra Interattiva',
    storageKey: 'algebra_data',
    certUrl: 'https://certificationsystem.netlify.app/',
    fields: [
        { key: 'solved', label: 'Equazioni Risolte', showZero: false },
        { key: 'attempts', label: 'Tentativi Totali', showZero: true },
        { key: 'accuracy', label: 'Accuratezza', type: 'percentage', showZero: true },
        { key: 'feedback', label: 'Feedback Docente', type: 'text' }
    ],

    onFieldUpdate: (key, value) => {
        // Calcola accuratezza automaticamente
        if (key === 'solved' || key === 'attempts') {
            const solved = certSystem.getField('solved');
            const attempts = certSystem.getField('attempts');

            if (attempts > 0) {
                const accuracy = Math.round((solved / attempts) * 100);
                certSystem.setField('accuracy', accuracy);
            }
        }

        // Aggiorna UI
        certSystem.renderStatsPanel('statsContainer');
    }
});

// Funzione chiamata quando studente risolve equazione
function onEquationSolved(correct) {
    certSystem.incrementField('attempts');
    if (correct) {
        certSystem.incrementField('solved');
    }
}

// Docente può aggiungere feedback
function addTeacherFeedback() {
    const feedback = prompt('Feedback per lo studente:');
    if (feedback) {
        certSystem.setField('feedback', feedback);
    }
}
```

---

## 🎓 Best Practices

### 1. StorageKey Univoche

```javascript
// ✅ BUONO - chiave specifica
storageKey: 'math_fractions_v2'

// ❌ CATTIVO - troppo generica
storageKey: 'data'
```

### 2. ShowZero Appropriato

```javascript
fields: [
    // ✅ false per contatori di completamenti/successi
    { key: 'completed', label: 'Completati', showZero: false },

    // ✅ true per errori/tentativi/metriche sempre valide
    { key: 'errors', label: 'Errori', showZero: true }
]
```

### 3. Callbacks per UI Reattiva

```javascript
// ✅ BUONO - UI sempre aggiornata
onFieldUpdate: (key, value) => {
    certSystem.renderStatsPanel('stats');
    updateProgressBar();
},

// ❌ CATTIVO - UI manuale
certSystem.incrementField('score', 10);
// Dimenticato di aggiornare UI!
```

### 4. Info Studente All'Inizio

```javascript
// ✅ BUONO - chiedi all'avvio
window.addEventListener('DOMContentLoaded', () => {
    const certSystem = new CertificationSystem({...});

    if (!certSystem.getStudentInfo()) {
        certSystem.promptStudentInfo();
    }

    certSystem.renderFullPanel('container');
});
```

### 5. Modalità Verifica - Rimuovi Aiuti

```javascript
// ✅ BUONO - rimuovi completamente
onVerificationModeStart: () => {
    document.querySelectorAll('.hint, .solution, .help').forEach(el => {
        el.remove();  // Non solo nascondere!
    });
},

// ❌ CATTIVO - solo nascondere
onVerificationModeStart: () => {
    document.querySelector('.hint').style.display = 'none';
    // Studente può ispezionare HTML!
}
```

### 6. Debug Mode in Sviluppo

```javascript
const certSystem = new CertificationSystem({
    // ...
    debug: window.location.hostname === 'localhost',  // Solo locale
    // ...
});
```

---

## 🐛 Troubleshooting

### Problema: "Dati condivisi tra app diverse"

**Causa:** Namespace identico per più app.

**Soluzione:**
```javascript
// Verifica namespace con debug
const certSystem = new CertificationSystem({
    debug: true,
    // ...
});
// Controlla console per namespace generato

// Se necessario, forza namespace diverso
appId: 'matematica_frazioni_v2'
```

---

### Problema: "Timer non si ferma dopo inattività"

**Causa:** Sei in modalità classe o verifica.

**Comportamento Corretto:**
- Normale: timer si ferma dopo 2 min inattività
- Classe: timer sempre attivo
- Verifica: timer SEMPRE attivo

**Soluzione:** Torna a modalità normale.

---

### Problema: "Modalità non persiste dopo refresh"

**Causa:** Errore JavaScript che impedisce salvataggio.

**Soluzione:**
1. Controlla console per errori
2. Verifica localStorage abilitato
3. Controlla che `persistModes()` venga chiamato

---

### Problema: "Link certificato troppo lungo"

**Causa:** Troppi eventi/attività registrati.

**Soluzione:**
```javascript
// Limita eventi salvati
if (certSystem.data._events.length > 100) {
    certSystem.data._events = certSystem.data._events.slice(-100);
}
```

---

### Problema: "Studente bypassata tracking"

**In modalità verifica**, il sistema rileva:
- Focus perso
- Resize finestra
- Console aperta
- Copy/paste

**Non può rilevare:**
- Secondo dispositivo/telefono
- Fotocamera esterna
- Aiuto di terze persone fisiche

**Soluzione:** Combina con supervisione umana.

---

## 📞 Supporto

Per domande, bug report o feature request:

**Email:** gubercml@gmail.com

**GitHub:** (inserisci link repository)

**Demo Live:** https://certificationsystem.netlify.app/

---

## 📄 Licenza

MIT License - Libero per uso personale e commerciale.

---

**Fine Documentazione Tecnica v4.1.0**
