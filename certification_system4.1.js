/**
 * SISTEMA DI CERTIFICAZIONE MODULARE v4.1
 * Autore: Flejta & Claude
 * Licenza: MIT
 * Versione: 4.1.0
 * 
 * Changelog v4.1:
 * - Sistema ibrido: retrocompatibilità totale + isolamento opzionale
 * - Storage isolato per percorso URL (default per nuove app)
 * - Parametro legacyMode per app esistenti
 * - Auto-detect app legacy tramite versione
 * - Namespace intelligente basato su URL
 */

class CertificationSystem {
    constructor(config) {
        //#region Determinazione Modalità Legacy/Isolata
        // SISTEMA IBRIDO: Determina automaticamente se usare modalità legacy o isolata
        
        // 1. Se esplicitamente specificato legacyMode, rispettalo
        // 2. Se appVersion < 4.0, usa legacy mode per retrocompatibilità
        // 3. Se isolateStorage è esplicitamente false, usa legacy mode
        // 4. Altrimenti usa storage isolato (nuovo comportamento)
        
        const isLegacyVersion = config.appVersion && 
            parseFloat(config.appVersion.split('.')[0]) < 4;
        
        const useLegacyMode = config.legacyMode === true || 
                             isLegacyVersion || 
                             config.isolateStorage === false;
        
        // Genera namespace solo se NON siamo in legacy mode
        this.appNamespace = useLegacyMode ? '' : this.generateAppNamespace(config);
        
        // Log per debug
        if (config.debug) {
            console.log('CertificationSystem v4.1 - Modalità:', 
                useLegacyMode ? 'LEGACY (storage condiviso)' : 'ISOLATA (storage per app)',
                '\nNamespace:', this.appNamespace || 'nessuno (legacy)',
                '\nStorageKey finale:', this.appNamespace ? 
                    `${this.appNamespace}_${config.storageKey || 'cert_data'}` : 
                    (config.storageKey || 'cert_data')
            );
        }
        //#endregion
        
        this.config = {
            appName: config.appName || 'App',
            appVersion: config.appVersion || '4.1.0',
            // Storage key: con namespace se isolato, senza se legacy
            storageKey: this.appNamespace ? 
                `${this.appNamespace}_${config.storageKey || 'cert_data'}` : 
                (config.storageKey || 'cert_data'),
            originalStorageKey: config.storageKey || 'cert_data', // Mantieni riferimento originale
            appUrl: window.location.href,
            appPath: window.location.pathname,
            certUrl: config.certUrl || 'https://certificationsystem.netlify.app/',
            fields: config.fields || [],
            trackFocus: config.trackFocus || false,
            inactivityTimeout: config.inactivityTimeout || 120000,
            classroomMode: false,
            verificationMode: false,
            suspiciousResizeThreshold: config.suspiciousResizeThreshold || 100,
            requireFullscreen: config.requireFullscreen || false,
            legacyMode: useLegacyMode,
            isolateStorage: !useLegacyMode,
            debug: config.debug || false,
            ...config
        };
        
        //#region Migrazione Dati Legacy (opzionale)
        // Se richiesto, migra i dati da storage legacy a isolato
        if (config.migrateLegacyData && !useLegacyMode) {
            this.migrateLegacyData(config.storageKey || 'cert_data');
        }
        //#endregion
        
        //#region Inizializzazione e Recupero Stato
        // Carica info studente
        this.studentInfo = this.loadStudentInfo();
        
        // IMPORTANTE: Recupera modalità persistenti PRIMA di caricare i dati
        this.recoverPersistedModes();
        
        // Inizializza dati
        this.data = this.loadData();
        
        // Variabili di stato
        this.lastActivity = Date.now();
        this.isActive = true;
        this.timerInterval = null;
        this.focusLostCount = 0;
        this.totalFocusLostTime = 0;
        this.focusLostStart = null;
        
        // Tracking avanzato
        this.windowSize = { width: window.innerWidth, height: window.innerHeight };
        this.isFullscreen = false;
        this.suspiciousActivities = [];
        
        this.init();
        //#endregion
    }

    //#region Namespace Management per Isolamento Storage
    generateAppNamespace(config) {
        // Metodo 1: Se viene fornito un appId esplicito, usalo
        if (config.appId) {
            return config.appId;
        }
        
        // Metodo 2: Genera namespace dal percorso dell'URL
        const path = window.location.pathname;
        
        // Gestione path speciali per certificationsystem.netlify.app
        // Esempi:
        // /application/matematica/frazioni.html -> matematica_frazioni
        // /application/certificationSystem/application/grammatica/verbi.html -> grammatica_verbi
        // /test/app.html -> test_app
        
        // Rimuovi parti comuni del path
        const pathCleaned = path
            .replace(/\/application\/certificationSystem/g, '')
            .replace(/\/application/g, '');
        
        // Estrai le parti significative
        const pathParts = pathCleaned.split('/').filter(p => p);
        
        // Se siamo nella root o c'è solo un file, usa appName
        if (pathParts.length <= 1) {
            return (config.appName || 'app').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
        }
        
        // Prendi cartella + nome file (senza estensione)
        const folder = pathParts[pathParts.length - 2] || '';
        const file = (pathParts[pathParts.length - 1] || '').replace(/\.html?$/i, '');
        
        // Combina folder e file per namespace unico
        let namespace = folder;
        if (file && file !== 'index') {
            namespace += '_' + file;
        }
        
        // Pulisci e rendi sicuro il namespace
        namespace = namespace.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
        
        // Se ancora vuoto, fallback su appName
        if (!namespace) {
            namespace = (config.appName || 'app').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
        }
        
        return namespace;
    }
    
    migrateLegacyData(legacyKey) {
        // Tentativo di migrazione da storage legacy a isolato
        const legacyData = localStorage.getItem(legacyKey);
        const newKey = this.config.storageKey;
        
        if (legacyData && !localStorage.getItem(newKey)) {
            try {
                const parsed = JSON.parse(legacyData);
                
                // Verifica che i dati siano compatibili con questa app
                // Controlla appName se disponibile nei metadati
                if (parsed._meta && parsed._meta.appName === this.config.appName) {
                    console.log('Migrazione dati legacy per:', this.config.appName);
                    localStorage.setItem(newKey, legacyData);
                    
                    // Opzionale: rimuovi dati legacy dopo migrazione
                    // localStorage.removeItem(legacyKey);
                }
            } catch (e) {
                console.error('Errore migrazione dati legacy:', e);
            }
        }
    }
    //#endregion

    //#region Inizializzazione e Recupero Stato Persistente
    init() {
        this.startTimer();
        this.setupActivityTracking();
        
        // Setup tracking in base alle modalità
        if (this.config.classroomMode || this.config.verificationMode) {
            this.setupFocusTracking();
            this.setupAdvancedTracking();
        }
        
        // Se modalità verifica, notifica l'app
        if (this.config.verificationMode) {
            this.notifyVerificationMode(true);
        }
        
        // Registra apertura pagina se in modalità tracking
        if (this.config.classroomMode || this.config.verificationMode) {
            this.logEvent('page_load', {
                timestamp: Date.now(),
                mode: this.config.verificationMode ? 'verification' : 'classroom'
            });
        }
    }

    recoverPersistedModes() {
        // Recupera modalità persistenti da localStorage
        const persistedModes = localStorage.getItem(this.config.storageKey + '_modes');
        if (persistedModes) {
            try {
                const modes = JSON.parse(persistedModes);
                
                // Recupera modalità indipendentemente
                if (modes.verificationMode) {
                    this.config.verificationMode = true;
                    console.log('Modalità Verifica recuperata dopo refresh/riapertura');
                }
                
                if (modes.classroomMode) {
                    this.config.classroomMode = true;
                    console.log('Modalità Lavoro in Classe recuperata dopo refresh/riapertura');
                }
                
                // Registra il recupero
                if (modes.lastClosed) {
                    const reopenTime = Date.now() - modes.lastClosed;
                    if (reopenTime < 60000) { // Meno di 1 minuto
                        console.log('Probabile refresh della pagina');
                    } else {
                        console.log('Pagina riaperta dopo chiusura');
                    }
                }
            } catch (e) {
                console.error('Errore recupero modalità:', e);
            }
        }
    }

    getCurrentMode() {
        // Restituisce la modalità corrente come stringa
        if (this.config.verificationMode) return 'verification';
        if (this.config.classroomMode) return 'classroom';
        return 'normal';
    }

    persistModes() {
        // Salva stato modalità per sopravvivere a refresh
        const modes = {
            classroomMode: this.config.classroomMode,
            verificationMode: this.config.verificationMode,
            lastClosed: Date.now()
        };
        localStorage.setItem(this.config.storageKey + '_modes', JSON.stringify(modes));
    }
    //#endregion

    //#region Tracking Avanzato e Rilevamento Attività Sospette
    setupAdvancedTracking() {
        // SOLO per modalità Verifica - tracking estremo
        if (!this.config.verificationMode) return;
        
        // Tracking resize finestra
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                const newSize = { width: window.innerWidth, height: window.innerHeight };
                const sizeDiff = Math.abs(newSize.width - this.windowSize.width) + 
                                Math.abs(newSize.height - this.windowSize.height);
                
                // Registra resize
                this.logEvent('window_resize', {
                    from: {...this.windowSize},
                    to: {...newSize},
                    difference: sizeDiff,
                    timestamp: Date.now()
                });
                
                // Se resize sospetto in modalità verifica
                if (sizeDiff > this.config.suspiciousResizeThreshold) {
                    this.logSuspiciousActivity('suspicious_resize', {
                        from: {...this.windowSize},
                        to: {...newSize},
                        difference: sizeDiff
                    });
                }
                
                this.windowSize = newSize;
                
                // Callback
                if (this.config.onWindowResize) {
                    this.config.onWindowResize({
                        from: this.windowSize,
                        to: newSize,
                        suspicious: sizeDiff > this.config.suspiciousResizeThreshold
                    });
                }
            }, 300);
        });
        
        // Tracking cambio visibilità (tab nascosta)
        document.addEventListener('visibilitychange', () => {
            const isHidden = document.hidden;
            
            this.logEvent('visibility_change', {
                hidden: isHidden,
                timestamp: Date.now()
            });
            
            if (isHidden) {
                this.logSuspiciousActivity('tab_hidden', {
                    timestamp: Date.now()
                });
            }
        });
        
        // Tracking fullscreen
        document.addEventListener('fullscreenchange', () => {
            const wasFullscreen = this.isFullscreen;
            this.isFullscreen = !!document.fullscreenElement;
            
            if (wasFullscreen && !this.isFullscreen) {
                this.logEvent('fullscreen_exit', {
                    timestamp: Date.now()
                });
                
                this.logSuspiciousActivity('fullscreen_exit', {
                    timestamp: Date.now()
                });
            }
        });
        
        // Tracking tentativi di navigazione
        window.addEventListener('beforeunload', (e) => {
            // Salva stato prima di chiudere
            this.persistModes();
            this.saveData();
            
            // Mostra avviso
            e.preventDefault();
            e.returnValue = 'Sei in modalità verifica. Vuoi davvero uscire?';
            
            this.logEvent('exit_attempt', {
                timestamp: Date.now()
            });
        });
        
        // Tracking copia/incolla (possibile imbroglio)
        document.addEventListener('copy', () => {
            this.logSuspiciousActivity('copy_attempt', {
                timestamp: Date.now()
            });
        });
        
        document.addEventListener('paste', () => {
            this.logSuspiciousActivity('paste_attempt', {
                timestamp: Date.now()
            });
        });
        
        // Tracking apertura console sviluppatore (F12)
        let devtools = {open: false, orientation: null};
        const threshold = 160;
        
        setInterval(() => {
            if (window.outerHeight - window.innerHeight > threshold || 
                window.outerWidth - window.innerWidth > threshold) {
                if (!devtools.open) {
                    devtools.open = true;
                    this.logSuspiciousActivity('devtools_open', {
                        timestamp: Date.now()
                    });
                }
            } else {
                devtools.open = false;
            }
        }, 500);
    }

    logEvent(eventType, data) {
        if (!this.data._events) {
            this.data._events = [];
        }
        
        this.data._events.push({
            type: eventType,
            data: data,
            timestamp: Date.now()
        });
        
        this.saveData();
    }

    logSuspiciousActivity(type, details) {
        if (!this.data._suspiciousActivities) {
            this.data._suspiciousActivities = [];
        }
        
        const activity = {
            type: type,
            details: details,
            timestamp: Date.now()
        };
        
        this.data._suspiciousActivities.push(activity);
        this.suspiciousActivities.push(activity);
        
        this.saveData();
        
        // Notifica l'app
        if (this.config.onSuspiciousActivity) {
            this.config.onSuspiciousActivity(type, details);
        }
        
        // Alert visivo per lo studente
        if (this.config.verificationMode) {
            this.showWarning(`⚠️ Attività registrata: ${this.getSuspiciousActivityMessage(type)}`);
        }
    }

    getSuspiciousActivityMessage(type) {
        const messages = {
            'suspicious_resize': 'Ridimensionamento finestra',
            'tab_hidden': 'Tab nascosta',
            'fullscreen_exit': 'Uscita da schermo intero',
            'copy_attempt': 'Tentativo di copia',
            'paste_attempt': 'Tentativo di incolla',
            'devtools_open': 'Console sviluppatore aperta',
            'exit_attempt': 'Tentativo di uscita'
        };
        return messages[type] || 'Attività non consentita';
    }

    showWarning(message) {
        // Crea overlay di warning temporaneo
        const warning = document.createElement('div');
        warning.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f44336;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            font-weight: bold;
            z-index: 999999;
            animation: slideIn 0.3s ease;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        `;
        warning.textContent = message;
        document.body.appendChild(warning);
        
        setTimeout(() => {
            warning.remove();
        }, 3000);
    }
    //#endregion

    //#region Modalità Normale, Classe e Verifica
    toggleClassroomMode(enabled) {
        const wasEnabled = this.config.classroomMode;
        
        // Se attiva modalità classe, disattiva verifica
        if (enabled && this.config.verificationMode) {
            if (!confirm('Disattivare modalità Verifica e passare a Lavoro in Classe?')) {
                return false;
            }
            this.toggleVerificationMode(false);
        }
        
        this.config.classroomMode = enabled;
        
        if (enabled) {
            // Reset per nuova sessione classe
            this.data = this.createEmptyData();
            this.data._classroomSession = {
                startTime: Date.now(),
                endTime: null,
                mode: 'classroom'
            };
            
            // Setup tracking base (solo focus)
            this.setupFocusTracking();
            
            // Notifica app - modalità classe con aiuti
            if (this.config.onClassroomModeStart) {
                this.config.onClassroomModeStart();
            }
            
            this.logEvent('classroom_mode_enabled', {
                timestamp: Date.now()
            });
            
        } else if (wasEnabled) {
            // Disattivazione modalità classe
            if (this.data._classroomSession) {
                this.data._classroomSession.endTime = Date.now();
            }
            
            this.logEvent('classroom_mode_disabled', {
                timestamp: Date.now(),
                duration: Date.now() - (this.data._classroomSession?.startTime || 0)
            });
            
            if (this.config.onClassroomModeEnd) {
                this.config.onClassroomModeEnd();
            }
        }
        
        this.persistModes();
        this.saveData();
        return true;
    }

    toggleVerificationMode(enabled) {
        const wasEnabled = this.config.verificationMode;
        
        // Se attiva modalità verifica, disattiva classe
        if (enabled && this.config.classroomMode) {
            if (!confirm('Disattivare modalità Lavoro in Classe e passare a Verifica?')) {
                return false;
            }
            this.toggleClassroomMode(false);
        }
        
        this.config.verificationMode = enabled;
        
        if (enabled) {
            // Reset completo per verifica
            this.data = this.createEmptyData();
            this.data._verificationSession = {
                startTime: Date.now(),
                endTime: null,
                strictMode: true
            };
            
            // Setup tracking ESTREMO
            this.setupFocusTracking();
            this.setupAdvancedTracking();
            
            // Notifica app - modalità verifica senza aiuti
            if (this.config.onVerificationModeStart) {
                this.config.onVerificationModeStart();
            }
            
            this.logEvent('verification_mode_enabled', {
                timestamp: Date.now()
            });
            
        } else if (wasEnabled) {
            // Disattivazione modalità verifica
            if (this.data._verificationSession) {
                this.data._verificationSession.endTime = Date.now();
            }
            
            this.logEvent('verification_mode_disabled', {
                timestamp: Date.now(),
                duration: Date.now() - (this.data._verificationSession?.startTime || 0)
            });
            
            if (this.config.onVerificationModeEnd) {
                this.config.onVerificationModeEnd();
            }
        }
        
        this.persistModes();
        this.saveData();
        return true;
    }

    toggleNormalMode() {
        // Torna a modalità normale
        if (this.config.classroomMode) {
            this.toggleClassroomMode(false);
        }
        if (this.config.verificationMode) {
            this.toggleVerificationMode(false);
        }
        
        // Notifica app - modalità normale
        if (this.config.onNormalMode) {
            this.config.onNormalMode();
        }
        
        this.logEvent('normal_mode_enabled', {
            timestamp: Date.now()
        });
        
        this.persistModes();
        this.saveData();
    }

    notifyVerificationMode(enabled) {
        if (enabled && this.config.onVerificationModeStart) {
            this.config.onVerificationModeStart();
        } else if (!enabled && this.config.onVerificationModeEnd) {
            this.config.onVerificationModeEnd();
        }
    }
    //#endregion

    //#region Gestione Dati Studente
    loadStudentInfo() {
        const stored = localStorage.getItem('student_global_info');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error('Errore caricamento info studente:', e);
            }
        }
        return null;
    }

    saveStudentInfo(info) {
        this.studentInfo = info;
        localStorage.setItem('student_global_info', JSON.stringify(info));
        return info;
    }

    getStudentInfo() {
        return this.studentInfo;
    }

    promptStudentInfo() {
        const info = {
            nome: prompt('Inserisci il tuo nome:', this.studentInfo?.nome || ''),
            cognome: prompt('Inserisci il tuo cognome:', this.studentInfo?.cognome || ''),
            classe: prompt('Inserisci la tua classe:', this.studentInfo?.classe || '')
        };
        
        if (info.nome && info.cognome) {
            this.saveStudentInfo(info);
            return info;
        }
        return null;
    }
    //#endregion

    //#region Gestione Sessioni
    startClassroomSession() {
        const sessionId = 'session_' + Date.now();
        
        this.data._session = {
            id: sessionId,
            startTime: Date.now(),
            endTime: null,
            classroomMode: true,
            verificationMode: this.config.verificationMode,
            focusEvents: []
        };
        
        // Reset contatori per la sessione
        this.data._values = { t: 0 };
        this.config.fields.forEach(field => {
            if (field.type === 'text') {
                this.data._textFields[field.key] = field.defaultValue || '';
            } else {
                this.data._values[field.key] = field.defaultValue || 0;
            }
        });
        
        // Reset tracking focus
        this.focusLostCount = 0;
        this.totalFocusLostTime = 0;
        this.focusEvents = [];
        
        this.saveData();
        
        if (this.config.onSessionStart) {
            this.config.onSessionStart(sessionId);
        }
    }

    endClassroomSession() {
        if (this.data._session) {
            this.data._session.endTime = Date.now();
            this.data._session.focusEvents = this.focusEvents;
            
            if (!this.data._sessionHistory) {
                this.data._sessionHistory = [];
            }
            this.data._sessionHistory.push({...this.data._session});
            
            this.saveData();
            
            if (this.config.onSessionEnd) {
                this.config.onSessionEnd(this.data._session);
            }
            
            return this.generateCertLink();
        }
        return null;
    }

    isInClassroomSession() {
        return this.config.classroomMode && this.data._session && !this.data._session.endTime;
    }

    isInVerificationMode() {
        return this.config.verificationMode;
    }
    //#endregion

    //#region Gestione Dati e Storage
    loadData() {
        let storageKey = this.config.storageKey;
        
        if (this.config.verificationMode) {
            storageKey = this.config.storageKey + '_verification';
        } else if (this.config.classroomMode) {
            storageKey = this.config.storageKey + '_classroom';
        }
        
        const stored = localStorage.getItem(storageKey);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                
                // Se in modalità verifica/classe e c'è una sessione attiva, continua
                if ((this.config.verificationMode || this.config.classroomMode) && 
                    parsed._session && !parsed._session.endTime) {
                    return parsed;
                }
                
                // Altrimenti crea nuovi dati
                if (this.config.verificationMode || this.config.classroomMode) {
                    return this.createEmptyData();
                }
                
                // Modalità normale
                if (!parsed._meta) {
                    return this.migrateOldData(parsed);
                }
                return parsed;
            } catch (e) {
                console.error('Errore caricamento dati:', e);
            }
        }
        
        return this.createEmptyData();
    }

    createEmptyData() {
        const initialData = { 
            _meta: {
                appName: this.config.appName,
                appVersion: this.config.appVersion,
                appUrl: this.config.appUrl,
                appPath: this.config.appPath,
                namespace: this.appNamespace,
                legacyMode: this.config.legacyMode,
                startTime: Date.now(),
                lastUpdate: Date.now()
            },
            _values: {
                t: 0
            },
            _textFields: {},
            _studentInfo: this.studentInfo,
            _events: [],
            _suspiciousActivities: []
        };
        
        // Inizializza campi personalizzati
        this.config.fields.forEach(field => {
            if (field.type === 'text') {
                initialData._textFields[field.key] = field.defaultValue || '';
            } else {
                initialData._values[field.key] = field.defaultValue || 0;
            }
        });
        
        if (this.config.trackFocus || this.config.classroomMode || this.config.verificationMode) {
            initialData._values.fl = 0;
            initialData._values.flt = 0;
        }
        
        return initialData;
    }

    migrateOldData(oldData) {
        const newData = {
            _meta: {
                appName: this.config.appName,
                appVersion: this.config.appVersion,
                appUrl: this.config.appUrl,
                appPath: this.config.appPath,
                namespace: this.appNamespace,
                legacyMode: this.config.legacyMode,
                startTime: Date.now() - (oldData.t || 0) * 1000,
                lastUpdate: Date.now()
            },
            _values: {},
            _textFields: {},
            _studentInfo: this.studentInfo,
            _events: [],
            _suspiciousActivities: []
        };

        Object.keys(oldData).forEach(key => {
            if (typeof oldData[key] === 'number') {
                newData._values[key] = oldData[key];
            }
        });

        return newData;
    }

    saveData() {
        this.data._meta.lastUpdate = Date.now();
        this.data._studentInfo = this.studentInfo;
        
        let storageKey = this.config.storageKey;
        if (this.config.verificationMode) {
            storageKey = this.config.storageKey + '_verification';
        } else if (this.config.classroomMode) {
            storageKey = this.config.storageKey + '_classroom';
        }
        
        localStorage.setItem(storageKey, JSON.stringify(this.data));
        
        // Salva anche modalità persistenti
        this.persistModes();
    }

    resetData() {
        // In modalità verifica, richiedi conferma speciale
        if (this.config.verificationMode) {
            const confirm = window.confirm('⚠️ ATTENZIONE: Sei in modalità verifica!\n\nIl reset verrà registrato come attività sospetta.\n\nVuoi davvero procedere?');
            if (!confirm) return;
            
            // Log tentativo di reset in verifica
            this.logSuspiciousActivity('reset_attempt_in_verification', {
                timestamp: Date.now()
            });
        } else {
            const confirm = window.confirm('Sei sicuro di voler azzerare tutte le statistiche?');
            if (!confirm) return;
        }
        
        // Se in modalità classe/verifica, termina sessione
        if (this.isInClassroomSession()) {
            this.endClassroomSession();
        }
        
        // Reset completo
        this.data = this.createEmptyData();
        this.focusLostCount = 0;
        this.totalFocusLostTime = 0;
        this.focusEvents = [];
        this.suspiciousActivities = [];
        
        this.saveData();
        
        // Aggiorna pannello
        this.renderStatsPanel(document.querySelector('[id*="certStats"]')?.id || 'certStatsContainer');
        
        if (this.config.onReset) {
            this.config.onReset();
        }
    }
    //#endregion

    //#region Timer e Attività
    startTimer() {
        if (this.timerInterval) return;
        
        this.timerInterval = setInterval(() => {
            const now = Date.now();
            const inactiveTime = now - this.lastActivity;
            
            // In modalità verifica, conta sempre il tempo
            const shouldCount = this.config.verificationMode ? 
                true : 
                (this.config.classroomMode ? 
                    this.isActive : 
                    (inactiveTime < this.config.inactivityTimeout && this.isActive));
            
            if (shouldCount) {
                this.data._values.t++;
                this.saveData();
                
                if (this.config.onTimerUpdate) {
                    this.config.onTimerUpdate(this.data._values.t);
                }
            }
        }, 1000);
    }

    registerActivity() {
        this.lastActivity = Date.now();
    }

    setupActivityTracking() {
        ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'].forEach(event => {
            document.addEventListener(event, () => this.registerActivity());
        });
    }
    //#endregion

    //#region Focus Tracking
    setupFocusTracking() {
        // Rimuovi listener esistenti per evitare duplicati
        window.removeEventListener('blur', this.handleBlur);
        window.removeEventListener('focus', this.handleFocus);
        
        this.handleBlur = () => {
            this.isActive = false;
            this.focusLostCount++;
            this.focusLostStart = Date.now();
            
            // In modalità verifica, è più grave
            if (this.config.verificationMode) {
                this.logSuspiciousActivity('focus_lost', {
                    count: this.focusLostCount,
                    timestamp: Date.now()
                });
            }
            
            // Log evento dettagliato
            this.logEvent('focus_lost', {
                count: this.focusLostCount,
                timestamp: Date.now(),
                timeInSession: this.data._values.t
            });
            
            this.data._values.fl = this.focusLostCount;
            this.saveData();
            
            if (this.config.onFocusLost) {
                this.config.onFocusLost(this.focusLostCount);
            }
        };
        
        this.handleFocus = () => {
            this.isActive = true;
            this.lastActivity = Date.now();
            
            if (this.focusLostStart) {
                const lostTime = Math.floor((Date.now() - this.focusLostStart) / 1000);
                this.totalFocusLostTime += lostTime;
                this.data._values.flt = this.totalFocusLostTime;
                
                // Log evento dettagliato
                this.logEvent('focus_restored', {
                    duration: lostTime,
                    totalLostTime: this.totalFocusLostTime,
                    timestamp: Date.now(),
                    timeInSession: this.data._values.t
                });
                
                this.saveData();
                this.focusLostStart = null;
                
                if (this.config.onFocusRestored) {
                    this.config.onFocusRestored(lostTime);
                }
            }
        };
        
        window.addEventListener('blur', this.handleBlur);
        window.addEventListener('focus', this.handleFocus);
        
        // Rileva cambio tab anche senza blur
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (this.isActive) {
                    window.dispatchEvent(new Event('blur'));
                }
            } else {
                if (!this.isActive) {
                    window.dispatchEvent(new Event('focus'));
                }
            }
        });
    }
    //#endregion

    //#region Gestione Campi
    incrementField(fieldKey, amount = 1) {
        if (this.data._values.hasOwnProperty(fieldKey)) {
            this.data._values[fieldKey] += amount;
            this.saveData();
            
            if (this.config.onFieldUpdate) {
                this.config.onFieldUpdate(fieldKey, this.data._values[fieldKey]);
            }
        }
    }

    setField(fieldKey, value) {
        if (this.data._textFields.hasOwnProperty(fieldKey)) {
            this.data._textFields[fieldKey] = value;
        } else if (this.data._values.hasOwnProperty(fieldKey)) {
            this.data._values[fieldKey] = value;
        }
        
        this.saveData();
        
        if (this.config.onFieldUpdate) {
            this.config.onFieldUpdate(fieldKey, value);
        }
    }

    getField(fieldKey) {
        return this.data._values[fieldKey] || this.data._textFields[fieldKey] || 0;
    }

    getData() {
        return {
            ...this.data._values,
            ...this.data._textFields,
            _meta: this.data._meta,
            _studentInfo: this.studentInfo,
            _session: this.data._session,
            _verificationSession: this.data._verificationSession,
            _events: this.data._events,
            _suspiciousActivities: this.data._suspiciousActivities
        };
    }
    //#endregion

    //#region Certificazione
    generateCertData() {
        const certData = {
            meta: {
                appName: this.config.appName,
                appVersion: this.config.appVersion,
                appUrl: this.config.appUrl,
                appPath: this.config.appPath,
                namespace: this.appNamespace,
                legacyMode: this.config.legacyMode,
                generated: Date.now(),
                startTime: this.data._verificationSession?.startTime || 
                          this.data._session?.startTime || 
                          this.data._meta.startTime,
                endTime: this.data._verificationSession?.endTime || 
                        this.data._session?.endTime || 
                        this.data._meta.lastUpdate,
                classroomMode: this.config.classroomMode,
                verificationMode: this.config.verificationMode
            },
            studentInfo: this.studentInfo,
            values: this.data._values,
            textFields: this.data._textFields,
            fields: []
        };

        // Se modalità verifica, aggiungi dettagli completi
        if (this.config.verificationMode) {
            certData.verification = {
                session: this.data._verificationSession,
                suspiciousActivities: this.data._suspiciousActivities || [],
                events: this.data._events || [],
                violations: {
                    focusLost: this.data._values.fl || 0,
                    focusLostTime: this.data._values.flt || 0,
                    resizes: this.data._events?.filter(e => e.type === 'window_resize').length || 0,
                    suspiciousResizes: this.data._suspiciousActivities?.filter(a => a.type === 'suspicious_resize').length || 0,
                    copyPasteAttempts: this.data._suspiciousActivities?.filter(a => 
                        a.type === 'copy_attempt' || a.type === 'paste_attempt').length || 0,
                    devtoolsOpened: this.data._suspiciousActivities?.filter(a => a.type === 'devtools_open').length || 0
                }
            };
        }

        // Se modalità classe, aggiungi dettagli sessione
        if (this.config.classroomMode && this.data._session) {
            certData.session = {
                id: this.data._session.id,
                focusEvents: this.data._events?.filter(e => 
                    e.type === 'focus_lost' || e.type === 'focus_restored') || [],
                strictMode: this.config.verificationMode
            };
        }

        // Aggiungi definizioni dei campi
        this.config.fields.forEach(field => {
            certData.fields.push({
                key: field.key,
                label: field.label,
                type: field.type || 'number',
                unit: field.unit || '',
                showZero: field.showZero !== false
            });
        });

        // Aggiungi campi focus
        if (this.config.trackFocus || this.config.classroomMode || this.config.verificationMode) {
            certData.fields.push(
                { key: 'fl', label: 'Volte Finestra Lasciata', type: 'number' },
                { key: 'flt', label: 'Tempo Fuori Focus', type: 'time' }
            );
        }

        return certData;
    }

    generateCertLink() {
        const certData = this.generateCertData();
        const encoded = btoa(JSON.stringify(certData));
        return `${this.config.certUrl}?cert=${encoded}`;
    }

    copyCertLink() {
        const link = this.generateCertLink();
        navigator.clipboard.writeText(link).then(() => {
            alert('Link certificato copiato! Ora puoi inviarlo al docente.');
        }).catch(err => {
            console.error('Errore copia:', err);
            alert('Impossibile copiare automaticamente. Seleziona e copia manualmente.');
        });
    }

    getFormattedTime(seconds) {
        if (seconds < 60) {
            return `${seconds}s`;
        } else if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${minutes}m ${secs}s`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return `${hours}h ${minutes}m`;
        }
    }
    //#endregion

    //#region UI Helper
    renderFullPanel(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const config = {
            collapsible: options.collapsible !== false,
            showStudentControls: options.showStudentControls !== false,
            showClassroomToggle: options.showClassroomToggle !== false,
            showVerificationToggle: options.showVerificationToggle !== false,
            ...options
        };

        // CSS aggiornato per modalità verifica
        if (!document.getElementById('cert-system-styles')) {
            const style = document.createElement('style');
            style.id = 'cert-system-styles';
            style.innerHTML = `
                .cert-panel {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 15px;
                    color: white;
                    margin-top: 20px;
                    position: relative;
                }
                .cert-panel.verification-mode {
                    background: linear-gradient(135deg, #f44336 0%, #e91e63 100%);
                    animation: pulse-border 2s infinite;
                }
                .cert-legacy-badge {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: #ffc107;
                    color: #000;
                    padding: 5px 10px;
                    border-radius: 5px;
                    font-size: 0.8em;
                    font-weight: bold;
                }
                @keyframes pulse-border {
                    0%, 100% { box-shadow: 0 0 20px rgba(244, 67, 54, 0.5); }
                    50% { box-shadow: 0 0 40px rgba(244, 67, 54, 0.8); }
                }
                .cert-panel-header {
                    padding: 20px;
                    cursor: ${config.collapsible ? 'pointer' : 'default'};
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    user-select: none;
                }
                .cert-panel-header:hover {
                    background: ${config.collapsible ? 'rgba(255,255,255,0.1)' : 'transparent'};
                }
                .cert-panel-title {
                    font-size: 1.3em;
                    font-weight: bold;
                }
                .cert-collapse-icon {
                    font-size: 1.5em;
                    transition: transform 0.3s;
                    display: ${config.collapsible ? 'block' : 'none'};
                }
                .cert-panel.collapsed .cert-collapse-icon {
                    transform: rotate(180deg);
                }
                .cert-panel-content {
                    padding: 0 20px 20px 20px;
                    transition: all 0.3s ease;
                    max-height: 2000px;
                    opacity: 1;
                    overflow: hidden;
                }
                .cert-panel.collapsed .cert-panel-content {
                    max-height: 0;
                    padding: 0 20px;
                    opacity: 0;
                }
                /* Resto del CSS uguale... */
            `;
            document.head.appendChild(style);
        }

        // Genera HTML del pannello
        const isVerification = this.config.verificationMode;
        const isClassroom = this.config.classroomMode;
        const isLegacy = this.config.legacyMode;
        
        let html = `
            <div class="cert-panel ${isVerification ? 'verification-mode' : ''} ${container.dataset.collapsed === 'true' ? 'collapsed' : ''}" id="${containerId}-panel">
                ${isLegacy ? '<div class="cert-legacy-badge">LEGACY MODE</div>' : ''}
                <div class="cert-panel-header" ${config.collapsible ? `onclick="certSystemTogglePanel('${containerId}')"` : ''}>
                    <span class="cert-panel-title">
                        ${isVerification ? '🔒 MODALITÀ VERIFICA ATTIVA' : '📜 Certificato di Completamento'}
                    </span>
                    <span class="cert-collapse-icon">▼</span>
                </div>
                <div class="cert-panel-content">
        `;

        // Info modalità storage
        if (this.config.debug) {
            html += `
                <div style="background: rgba(0,0,0,0.2); padding: 10px; margin-bottom: 15px; border-radius: 5px; font-size: 0.9em;">
                    <strong>Debug Info:</strong><br>
                    App: ${this.config.appName} v${this.config.appVersion}<br>
                    Storage: ${this.config.legacyMode ? 'LEGACY (condiviso)' : 'ISOLATO'}<br>
                    ${this.appNamespace ? `Namespace: ${this.appNamespace}<br>` : ''}
                    StorageKey: ${this.config.storageKey}
                </div>
            `;
        }

        // Resto del codice HTML uguale alla versione 4.0...
        // [Continua con il resto del renderFullPanel come nella v4.0]
        
        container.innerHTML = html;
        
        // Render statistiche
        this.renderStatsPanel(containerId + '-stats');

        // Setup funzioni globali
        this.setupGlobalFunctions(containerId, options);
    }

    // Resto dei metodi UI uguali alla v4.0...
    renderStatsPanel(containerId) {
        // [Codice uguale alla v4.0]
    }

    setupButtons(generateBtnId, copyBtnId, resetBtnId, linkContainerId, studentBtnId) {
        // [Codice uguale alla v4.0]
    }

    setupGlobalFunctions(containerId, options) {
        // [Codice uguale alla v4.0]
    }
    //#endregion
}

// Export per uso con <script type="module">
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CertificationSystem;
}
