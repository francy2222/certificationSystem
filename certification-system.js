/**
 * SISTEMA DI CERTIFICAZIONE MODULARE v4.1 - AUTO-ISOLAMENTO
 * Autore: Flejta & Claude
 * Licenza: MIT
 * Versione: 4.1.0
 * 
 * Changelog v4.1:
 * - ISOLAMENTO AUTOMATICO per ogni app basato su URL
 * - Risolve problema storage condiviso senza modifiche alle app
 * - Ogni app ha automaticamente il suo storage separato
 * - Namespace generato dal percorso URL dell'app
 */

class CertificationSystem {
    constructor(config) {
        //#region Generazione Namespace Automatico
        // SEMPRE genera namespace univoco basato sull'URL
        // Così ogni app ha automaticamente storage isolato
        this.appNamespace = this.generateAppNamespace(config);
        
        // Log per debug (può essere rimosso in produzione)
        if (config.debug || window.location.hostname === 'localhost') {
            console.log('🔒 CertificationSystem v4.1 - Storage Auto-Isolato');
            console.log('📍 URL:', window.location.pathname);
            console.log('🏷️ Namespace:', this.appNamespace);
            console.log('💾 Storage Key:', `${this.appNamespace}_${config.storageKey || 'cert_data'}`);
        }
        //#endregion
        
        this.config = {
            appName: config.appName || 'App',
            appVersion: config.appVersion || '4.1.0',
            // Storage key SEMPRE con namespace per isolamento automatico
            storageKey: `${this.appNamespace}_${config.storageKey || 'cert_data'}`,
            originalStorageKey: config.storageKey || 'cert_data', // Per riferimento
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
            debug: config.debug || false,
            ...config
        };
        
        //#region Inizializzazione e Recupero Stato
        // Carica info studente (rimane globale per tutte le app)
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
        // Se viene fornito un appId esplicito, usalo
        if (config.appId) {
            return config.appId;
        }
        
        // Genera namespace dal percorso URL
        const path = window.location.pathname;
        
        // Gestione path per certificationsystem.netlify.app
        // Rimuovi parti comuni e ripetitive
        const cleanPath = path
            .replace(/\/application\/certificationSystem/g, '') 
            .replace(/\/application/g, '');
        
        // Dividi il path in parti
        const pathParts = cleanPath.split('/').filter(p => p);
        
        // Se siamo nella root o c'è solo un file, usa appName
        if (pathParts.length === 0) {
            return (config.appName || 'app').toLowerCase().replace(/[^a-z0-9]/g, '_');
        }
        
        // Strategia: usa le ultime 2-3 parti significative del path
        let namespace = '';
        
        if (pathParts.length === 1) {
            // Solo un file nella root
            namespace = pathParts[0].replace(/\.html?$/i, '');
        } else {
            // Prendi cartella + file
            const folder = pathParts[pathParts.length - 2] || '';
            const file = (pathParts[pathParts.length - 1] || '').replace(/\.html?$/i, '');
            
            // Se il file si chiama index, usa solo la cartella
            if (file === 'index') {
                namespace = folder;
            } else {
                // Combina folder_file per namespace univoco
                namespace = folder ? `${folder}_${file}` : file;
            }
        }
        
        // Pulisci il namespace (solo lettere, numeri e underscore)
        namespace = namespace.toLowerCase().replace(/[^a-z0-9_]/g, '_');
        
        // Rimuovi underscore multipli
        namespace = namespace.replace(/_+/g, '_').replace(/^_|_$/g, '');
        
        // Se ancora vuoto, usa appName come fallback
        if (!namespace) {
            namespace = (config.appName || 'app').toLowerCase().replace(/[^a-z0-9]/g, '_');
        }
        
        return namespace;
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
                    if (this.config.debug) {
                        console.log('Modalità Verifica recuperata dopo refresh/riapertura');
                    }
                }
                
                if (modes.classroomMode) {
                    this.config.classroomMode = true;
                    if (this.config.debug) {
                        console.log('Modalità Lavoro in Classe recuperata dopo refresh/riapertura');
                    }
                }
                
                // Registra il recupero
                if (modes.lastClosed) {
                    const reopenTime = Date.now() - modes.lastClosed;
                    if (reopenTime < 60000) { // Meno di 1 minuto
                        if (this.config.debug) console.log('Probabile refresh della pagina');
                    } else {
                        if (this.config.debug) console.log('Pagina riaperta dopo chiusura');
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

        // CSS per il pannello
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
                .cert-stats {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                    gap: 15px;
                    margin-top: 20px;
                }
                .cert-stat {
                    background: rgba(255,255,255,0.2);
                    padding: 15px;
                    border-radius: 8px;
                    text-align: center;
                    transition: all 0.3s;
                }
                .cert-stat:hover {
                    background: rgba(255,255,255,0.3);
                    transform: translateY(-2px);
                }
                .cert-stat-value {
                    font-size: 1.8em;
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                .cert-stat-label {
                    font-size: 0.9em;
                    opacity: 0.9;
                }
                .cert-btn {
                    padding: 10px 20px;
                    background: rgba(255,255,255,0.2);
                    color: white;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: bold;
                    transition: all 0.3s;
                }
                .cert-btn:hover {
                    background: rgba(255,255,255,0.3);
                    transform: translateY(-2px);
                }
                .cert-btn-primary {
                    background: rgba(255,255,255,0.9);
                    color: #667eea;
                }
                .cert-btn-danger {
                    background: #f44336;
                    border-color: #f44336;
                }
            `;
            document.head.appendChild(style);
        }

        // Genera HTML del pannello
        const isVerification = this.config.verificationMode;
        const isClassroom = this.config.classroomMode;
        
        let html = `
            <div class="cert-panel ${isVerification ? 'verification-mode' : ''}" id="${containerId}-panel">
                <div class="cert-panel-header" ${config.collapsible ? `onclick="certSystemTogglePanel('${containerId}')"` : ''}>
                    <span class="cert-panel-title">
                        ${isVerification ? '🔒 MODALITÀ VERIFICA ATTIVA' : '📜 Certificato di Completamento'}
                    </span>
                    <span class="cert-collapse-icon">▼</span>
                </div>
                <div class="cert-panel-content">
        `;

        // Info debug se attivo
        if (this.config.debug) {
            html += `
                <div style="background: rgba(0,0,0,0.2); padding: 10px; margin-bottom: 15px; border-radius: 5px; font-size: 0.9em;">
                    <strong>Debug Info:</strong><br>
                    App: ${this.config.appName} v${this.config.appVersion}<br>
                    Namespace: ${this.appNamespace}<br>
                    StorageKey: ${this.config.storageKey}
                </div>
            `;
        }

        // Resto del pannello...
        html += '<div class="cert-stats" id="' + containerId + '-stats"></div>';
        
        // Bottoni azione
        html += `
            <div style="display: flex; justify-content: center; gap: 10px; margin-top: 20px; flex-wrap: wrap;">
                <button class="cert-btn cert-btn-primary" onclick="certSystemGenerateLink('${this.config.storageKey}', '${containerId}')">
                    📋 Genera Certificato
                </button>
                <button class="cert-btn cert-btn-danger" onclick="certSystemResetData('${this.config.storageKey}')">
                    🔄 Reset Dati
                </button>
            </div>
        `;
        
        // Container per link generato
        html += `
            <div id="${containerId}-link" style="display: none; margin-top: 20px;">
                <p style="text-align: center;">Link certificato:</p>
                <div style="background: white; color: #667eea; padding: 15px; border-radius: 8px; 
                            word-break: break-all; font-family: monospace; margin: 10px 0;">
                    <span id="${containerId}-link-text"></span>
                </div>
                <div style="text-align: center;">
                    <button class="cert-btn" onclick="certSystemCopyLink('${containerId}')">📋 Copia Link</button>
                </div>
            </div>
        `;
        
        html += '</div></div>';
        
        container.innerHTML = html;
        
        // Render statistiche
        this.renderStatsPanel(containerId + '-stats');

        // Setup funzioni globali
        if (!window.certSystemTogglePanel) {
            window.certSystemTogglePanel = (id) => {
                const panel = document.getElementById(id + '-panel');
                if (panel) {
                    panel.classList.toggle('collapsed');
                }
            };
            
            // Mantieni riferimento all'istanza per le funzioni globali
            if (!window.certSystemInstances) {
                window.certSystemInstances = {};
            }
            window.certSystemInstances[this.config.storageKey] = this;
            
            window.certSystemGenerateLink = (storageKey, containerId) => {
                const instance = window.certSystemInstances[storageKey];
                if (instance) {
                    const link = instance.generateCertLink();
                    const linkContainer = document.getElementById(containerId + '-link');
                    const linkText = document.getElementById(containerId + '-link-text');
                    if (linkContainer && linkText) {
                        linkText.textContent = link;
                        linkContainer.style.display = 'block';
                    }
                }
            };
            
            window.certSystemCopyLink = (containerId) => {
                const linkText = document.getElementById(containerId + '-link-text');
                if (linkText) {
                    const link = linkText.textContent;
                    navigator.clipboard.writeText(link).then(() => {
                        alert('Link certificato copiato! Ora puoi inviarlo al docente.');
                    }).catch(err => {
                        console.error('Errore copia:', err);
                        alert('Impossibile copiare automaticamente. Seleziona e copia manualmente.');
                    });
                }
            };
            
            window.certSystemResetData = (storageKey) => {
                const instance = window.certSystemInstances[storageKey];
                if (instance) {
                    instance.resetData();
                }
            };
        }
    }

    renderStatsPanel(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        let statsHTML = '';

        // Info studente
        if (this.studentInfo && this.studentInfo.nome) {
            statsHTML += `
                <div class="cert-stat" style="grid-column: span 2; background: rgba(76,175,80,0.2);">
                    <div class="cert-stat-value" style="font-size: 1.2em;">
                        👤 ${this.studentInfo.nome} ${this.studentInfo.cognome}
                    </div>
                    <div>Classe: ${this.studentInfo.classe || 'N/D'}</div>
                </div>
            `;
        }

        // Tempo totale
        statsHTML += `
            <div class="cert-stat">
                <div class="cert-stat-value">${this.getFormattedTime(this.data._values.t || 0)}</div>
                <div class="cert-stat-label">Tempo Totale</div>
            </div>
        `;

        // Campi personalizzati
        this.config.fields.forEach(field => {
            if (field.type === 'text') return;
            
            const value = this.data._values[field.key] || 0;
            let displayValue = value;
            
            if (field.showZero === false && value === 0) {
                displayValue = '-';
            } else if (field.type === 'percentage' && value !== 0) {
                displayValue = value + '%';
            } else if (field.type === 'time') {
                displayValue = this.getFormattedTime(value);
            }
            
            statsHTML += `
                <div class="cert-stat">
                    <div class="cert-stat-value">${displayValue}</div>
                    <div class="cert-stat-label">${field.label}</div>
                </div>
            `;
        });

        // Focus tracking
        if (this.config.trackFocus || this.config.classroomMode || this.config.verificationMode) {
            const focusCount = this.data._values.fl || 0;
            const focusTime = this.data._values.flt || 0;
            
            const warningStyle = focusCount > 2 ? 
                'background: rgba(244,67,54,0.2); border: 2px solid #f44336;' : '';
            
            statsHTML += `
                <div class="cert-stat" style="${warningStyle}">
                    <div class="cert-stat-value">${focusCount}</div>
                    <div class="cert-stat-label">Focus Perso</div>
                </div>
                <div class="cert-stat" style="${warningStyle}">
                    <div class="cert-stat-value">${this.getFormattedTime(focusTime)}</div>
                    <div class="cert-stat-label">Tempo Fuori Focus</div>
                </div>
            `;
        }

        container.innerHTML = statsHTML;
    }

    setupButtons(generateBtnId, copyBtnId, resetBtnId, linkContainerId, studentBtnId) {
        const generateBtn = document.getElementById(generateBtnId);
        const copyBtn = document.getElementById(copyBtnId);
        const resetBtn = document.getElementById(resetBtnId);
        const linkContainer = document.getElementById(linkContainerId);
        const studentBtn = document.getElementById(studentBtnId);

        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                const link = this.generateCertLink();
                const linkDisplay = linkContainer.querySelector('.cert-link');
                if (linkDisplay) {
                    linkDisplay.textContent = link;
                }
                linkContainer.style.display = 'block';
            });
        }

        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyCertLink());
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetData());
        }

        if (studentBtn) {
            studentBtn.addEventListener('click', () => {
                this.promptStudentInfo();
                this.renderStatsPanel(document.querySelector('[id*="certStats"]')?.id || 'certStatsContainer');
            });
        }
    }
    //#endregion
}

// Export per uso con <script type="module">
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CertificationSystem;
}
