# 📝 Changelog

Tutte le modifiche notevoli a questo progetto saranno documentate in questo file.

---

## [4.1.0] - 2025-01-30

### 🎉 Funzionalità Principali

#### 🔒 Storage Automaticamente Isolato
- **Namespace auto-generato** dall'URL dell'app
- Ogni applicazione ha ora storage completamente separato
- **Zero modifiche richieste** alle app esistenti
- Risolve definitivamente il problema di storage condiviso tra app diverse
- Debug mode per verificare namespace: `debug: true`
- Override namespace manuale con parametro `appId`

#### 🎓 Info Studente Globali
- Sistema info studente **persistenti e condivise** tra tutte le app
- Storage globale: `student_global_info`
- Metodi:
  - `promptStudentInfo()` - Richiedi con prompt
  - `saveStudentInfo(info)` - Salva manualmente
  - `getStudentInfo()` - Leggi correnti
- Info incluse automaticamente nei certificati

#### 🏫 Tre Modalità Operative

**1. Modalità Normale (Default)**
- Timer si ferma dopo 2 minuti inattività
- Dati cumulativi
- Tracking base

**2. Modalità Lavoro in Classe**
- Timer sempre attivo
- Tracking perdita focus
- Sessioni gestite con ID univoco
- Aiuti visibili (deciso dall'app)
- Callbacks: `onClassroomModeStart`, `onClassroomModeEnd`
- Metodi: `toggleClassroomMode()`, `startClassroomSession()`, `endClassroomSession()`

**3. Modalità Verifica (Massima Sicurezza)**
- Tracking ESTREMO di tutto:
  - Perdita focus (conteggio + durata)
  - Resize finestra sospetto (threshold configurabile)
  - Tab nascoste
  - Console sviluppatore aperta (F12)
  - Tentativi copy/paste
  - Uscita da fullscreen
  - Tentativi chiusura pagina
- Alert visivi allo studente per ogni attività
- Warning prima di uscire dalla pagina
- Dati completi con violazioni nel certificato
- Callbacks: `onVerificationModeStart`, `onVerificationModeEnd`, `onSuspiciousActivity`
- Metodi: `toggleVerificationMode()`, `isInVerificationMode()`

#### 📊 Tracking Avanzato
- Log eventi dettagliati: `_events[]`
- Log attività sospette: `_suspiciousActivities[]`
- Metodi: `logEvent()`, `logSuspiciousActivity()`
- Dati inclusi nei certificati in modalità verifica

#### 📝 Nuovi Tipi di Campi
- `number` - Numerico (default, già esistente)
- `text` - **NUOVO**: Campi testuali
- `time` - **NUOVO**: Auto-formattato (5m 30s)
- `percentage` - **NUOVO**: Mostra con "%"

#### 💾 Persistenza Modalità
- Le modalità sopravvivono a refresh/chiusura pagina
- Storage: `{storageKey}_modes`
- Recupero automatico all'avvio
- Metodo: `recoverPersistedModes()`

#### 📦 Nuova Struttura Dati
- **Metadati completi** in `_meta`:
  - appName, appVersion, appUrl, appPath
  - namespace (per isolamento)
  - startTime, lastUpdate
- **Valori separati**: `_values` (numeri), `_textFields` (testo)
- **Info studente**: `_studentInfo`
- **Eventi**: `_events[]`
- **Attività sospette**: `_suspiciousActivities[]`
- **Sessioni**: `_session`, `_verificationSession`, `_sessionHistory`

### ✨ Miglioramenti

#### API Estesa
- `getCurrentMode()` - Ritorna 'normal' | 'classroom' | 'verification'
- `toggleNormalMode()` - Torna a modalità normale
- `isInClassroomSession()` - Verifica sessione attiva
- `isInVerificationMode()` - Verifica modalità verifica

#### Callbacks Aggiuntivi
- `onClassroomModeStart` / `onClassroomModeEnd`
- `onVerificationModeStart` / `onVerificationModeEnd`
- `onNormalMode`
- `onSessionStart(sessionId)` / `onSessionEnd(session)`
- `onFocusLost(count)` / `onFocusRestored(duration)`
- `onWindowResize(data)`
- `onSuspiciousActivity(type, details)`

#### Parametri Config Aggiuntivi
- `appVersion` - Versione app (default: '4.1.0')
- `appId` - Override namespace manuale
- `debug` - Log debug namespace
- `classroomMode` - Avvia in modalità classe
- `verificationMode` - Avvia in modalità verifica
- `suspiciousResizeThreshold` - Pixel per resize sospetto (default: 100)
- `requireFullscreen` - Richiedi fullscreen

#### UI Migliorata
- `renderFullPanel()` - Pannello completo con una sola chiamata
- CSS integrato automaticamente
- Stile rosso pulsante in modalità verifica
- Badge "LEGACY MODE" se debug attivo
- Info studente visualizzate nel pannello
- Pannello comprimibile (opzionale)

#### Reset Migliorato
- Conferma speciale in modalità verifica
- Log come attività sospetta se in verifica
- Aggiorna automaticamente TUTTE le UI
- Termina sessione attiva se presente

### 🐛 Bug Fix

- **[CRITICO]** Risolto storage condiviso tra app diverse
  - Prima: tutte le app usavano stesso `storageKey`
  - Ora: namespace auto-aggiunto basato su URL
- Fix auto-update UI dopo reset
- Fix persistenza modalità dopo refresh
- Fix migrazione dati formato legacy

### 🔄 Breaking Changes

- **Storage keys modificate**: Ora prefissate con namespace
  - Prima: `storageKey`
  - Ora: `{namespace}_storageKey`
  - **Impatto**: Dati precedenti NON accessibili automaticamente
  - **Soluzione**: Gli studenti ripartono da zero (comportamento voluto)

- **Struttura dati cambiata**: Da formato flat a strutturato
  - Prima: `{ t: 123, comp: 5 }`
  - Ora: `{ _meta: {...}, _values: { t: 123, comp: 5 }, ... }`
  - **Compatibilità**: Sistema auto-migra vecchi dati al primo caricamento

### 📚 Documentazione

- README.md completamente riscritto con:
  - Sezione "Le 3 Modalità Operative"
  - Esempi per ogni modalità
  - Tutti i parametri documentati
  - Tutti i callbacks elencati
  - Esempi completi per uso avanzato

- Documentazione.MD aggiornata con:
  - API Reference completa di TUTTI i metodi
  - Descrizione dettagliata modalità
  - Storage keys utilizzate
  - Tracking avanzato spiegato
  - Best practices
  - Troubleshooting esteso

### 🔧 Interno

- Refactoring generazione namespace
- Ottimizzazione setup tracking
- Separazione logica modalità normale/classe/verifica
- Miglior gestione event listeners
- Code cleanup e commenti

---

## [3.0.0] - 2025-01-15

### ✨ Funzionalità Aggiunte

- **Metodo `renderFullPanel()`**: UI completa con una sola chiamata
- **Sistema dati studente**: Info persistenti (nome, cognome, classe)
- **Modalità Classe**: Tracking rigoroso per lavoro in classe
- **Pannello collassabile**: Opzione per comprimere pannello certificato
- **Callbacks estesi**: Nuovi eventi per timer e campi

### 🐛 Bug Fix

- Fix reset statistiche che non aggiornava UI
- Fix timer che non ripartiva dopo reset
- Fix rendering pannello su container vuoti

---

## [2.0.0] - 2024-12-10

### ✨ Funzionalità Aggiunte

- **Tracking focus opzionale**: Rileva perdita focus finestra
- **Configurazione avanzata**: Timeout inattività personalizzabile
- **Callbacks**: `onTimerUpdate`, `onFieldUpdate`, `onReset`
- **Metodo `getFormattedTime()`**: Formattazione tempo leggibile
- **Campo `showZero`**: Controlla visualizzazione valore 0

### 🔄 Modifiche

- Struttura interna riorganizzata
- Miglior gestione localStorage
- Ottimizzazione timer

---

## [1.0.0] - 2024-11-01

### 🎉 Release Iniziale

#### Funzionalità Core

- **Timer intelligente**: Si ferma dopo 2 minuti inattività
- **Campi personalizzabili**: Definizione dinamica dei campi
- **Salvataggio automatico**: localStorage
- **Generazione certificato**: Link Base64 criptato
- **Lettore certificato**: `index.html` per visualizzare certificati

#### Metodi Principali

- `incrementField(key, amount)`
- `setField(key, value)`
- `getField(key)`
- `getData()`
- `generateCertLink()`
- `copyCertLink()`
- `resetData()`

#### UI Helper

- `renderStatsPanel(containerId)`
- `setupButtons(genId, copyId, resetId, linkId)`

#### Configurazione

```javascript
{
    appName: 'string',
    storageKey: 'string',
    certUrl: 'string',
    fields: [...],
    trackFocus: boolean,
    inactivityTimeout: number
}
```

---

## Formato Versioni

Il progetto segue [Semantic Versioning](https://semver.org/):
- **MAJOR** (4.x.x) - Breaking changes
- **MINOR** (x.1.x) - Nuove funzionalità (compatibili)
- **PATCH** (x.x.1) - Bug fix

### Tipi di Modifiche

- 🎉 **Funzionalità Aggiunte** - Nuove feature
- 🐛 **Bug Fix** - Correzioni
- 🔄 **Breaking Changes** - Modifiche incompatibili
- ✨ **Miglioramenti** - Enhancement esistenti
- 📚 **Documentazione** - Aggiornamenti docs
- 🔧 **Interno** - Refactoring/ottimizzazioni

---

## Link Utili

- **Repository**: [GitHub](https://github.com/...)
- **Demo Live**: https://certificationsystem.netlify.app/
- **Documentazione**: README.md, Documentazione.MD
- **Supporto**: gubercml@gmail.com
