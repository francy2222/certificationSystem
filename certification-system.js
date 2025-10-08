/**
 * SISTEMA DI CERTIFICAZIONE MODULARE v3.0
 * Autore: Flejta & Claude
 * Licenza: MIT
 * Versione: 3.0.0
 * 
 * Changelog v3.0:
 * - Aggiunto sistema dati studente persistenti
 * - Modalità Lavoro in Classe con sessioni isolate
 * - Tracking focus avanzato per verifiche
 * - Fix bug reset pannello statistiche
 * - Gestione sessioni multiple
 */

class CertificationSystem {
    constructor(config) {
        this.config = {
            appName: config.appName || 'App',
            appVersion: config.appVersion || '1.0.0',
            storageKey: config.storageKey || 'cert_data',
            certUrl: config.certUrl || 'https://certificationsystem.netlify.app/',
            fields: config.fields || [],
            trackFocus: config.trackFocus || false,
            inactivityTimeout: config.inactivityTimeout || 120000,
            classroomMode: config.classroomMode || false,
            ...config
        };
        
        // Carica info studente se disponibili
        this.studentInfo = this.loadStudentInfo();
        
        // Inizializza dati (considerando modalità classe)
        this.data = this.loadData();
        
        // Variabili di stato
        this.lastActivity = Date.now();
        this.isActive = true;
        this.timerInterval = null;
        this.focusLostCount = 0;
        this.totalFocusLostTime = 0;
        this.focusLostStart = null;
        
        // Dettagli focus per modalità classe
        this.focusEvents = [];
        
        this.init();
    }

    //#region Inizializzazione e Dati Studente
    init() {
        this.startTimer();
        this.setupActivityTracking();
        
        // In modalità classe, tracking focus è SEMPRE attivo
        if (this.config.classroomMode || this.config.trackFocus) {
            this.setupFocusTracking();
        }
        
        // Se modalità classe, registra inizio sessione
        if (this.config.classroomMode && !this.data._session) {
            this.startClassroomSession();
        }
    }

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
        // Metodo helper per richiedere info studente
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

    //#region Modalità Classe
    startClassroomSession() {
        const sessionId = 'session_' + Date.now();
        
        this.data._session = {
            id: sessionId,
            startTime: Date.now(),
            endTime: null,
            classroomMode: true,
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
        
        // Notifica inizio sessione
        if (this.config.onSessionStart) {
            this.config.onSessionStart(sessionId);
        }
    }

    endClassroomSession() {
        if (this.data._session) {
            this.data._session.endTime = Date.now();
            this.data._session.focusEvents = this.focusEvents;
            
            // Salva sessione nello storico
            if (!this.data._sessionHistory) {
                this.data._sessionHistory = [];
            }
            this.data._sessionHistory.push({...this.data._session});
            
            this.saveData();
            
            if (this.config.onSessionEnd) {
                this.config.onSessionEnd(this.data._session);
            }
            
            // Genera certificato automaticamente per la sessione
            return this.generateCertLink();
        }
        return null;
    }

    isInClassroomSession() {
        return this.config.classroomMode && this.data._session && !this.data._session.endTime;
    }
    //#endregion

    //#region Gestione Dati
    loadData() {
        let storageKey = this.config.storageKey;
        
        // In modalità classe, usa chiave specifica per sessione
        if (this.config.classroomMode) {
            storageKey = this.config.storageKey + '_classroom';
        }
        
        const stored = localStorage.getItem(storageKey);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                
                // Se in modalità classe e c'è già una sessione attiva, continua quella
                if (this.config.classroomMode && parsed._session && !parsed._session.endTime) {
                    return parsed;
                }
                
                // Altrimenti se in modalità classe, inizia nuova sessione
                if (this.config.classroomMode) {
                    return this.createEmptyData();
                }
                
                // Modalità normale: carica dati esistenti o migra
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
                startTime: Date.now(),
                lastUpdate: Date.now()
            },
            _values: {
                t: 0
            },
            _textFields: {},
            _studentInfo: this.studentInfo
        };
        
        // Inizializza campi personalizzati
        this.config.fields.forEach(field => {
            if (field.type === 'text') {
                initialData._textFields[field.key] = field.defaultValue || '';
            } else {
                initialData._values[field.key] = field.defaultValue || 0;
            }
        });
        
        if (this.config.trackFocus || this.config.classroomMode) {
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
                startTime: Date.now() - (oldData.t || 0) * 1000,
                lastUpdate: Date.now()
            },
            _values: {},
            _textFields: {},
            _studentInfo: this.studentInfo
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
        if (this.config.classroomMode) {
            storageKey = this.config.storageKey + '_classroom';
        }
        
        localStorage.setItem(storageKey, JSON.stringify(this.data));
    }

    resetData() {
        const confirm = window.confirm('Sei sicuro di voler azzerare tutte le statistiche?');
        if (confirm) {
            // Se in modalità classe, termina sessione
            if (this.isInClassroomSession()) {
                this.endClassroomSession();
            }
            
            // Reset completo
            this.data = this.createEmptyData();
            this.focusLostCount = 0;
            this.totalFocusLostTime = 0;
            this.focusEvents = [];
            
            this.saveData();
            
            // IMPORTANTE: Aggiorna immediatamente il pannello visivo
            this.renderStatsPanel(document.querySelector('[id*="certStats"]')?.id || 'certStatsContainer');
            
            if (this.config.onReset) {
                this.config.onReset();
            }
        }
    }
    //#endregion

    //#region Timer e Attività
    startTimer() {
        if (this.timerInterval) return;
        
        this.timerInterval = setInterval(() => {
            const now = Date.now();
            const inactiveTime = now - this.lastActivity;
            
            // In modalità classe, conta sempre il tempo se la finestra è attiva
            const shouldCount = this.config.classroomMode ? 
                this.isActive : 
                (inactiveTime < this.config.inactivityTimeout && this.isActive);
            
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

    //#region Focus Tracking Avanzato
    setupFocusTracking() {
        window.addEventListener('blur', () => {
            this.isActive = false;
            this.focusLostCount++;
            this.focusLostStart = Date.now();
            
            // In modalità classe, registra evento dettagliato
            if (this.config.classroomMode) {
                this.focusEvents.push({
                    type: 'blur',
                    timestamp: Date.now(),
                    timeInSession: this.data._values.t
                });
            }
            
            this.data._values.fl = this.focusLostCount;
            this.saveData();
            
            // Callback per notifica immediata
            if (this.config.onFocusLost) {
                this.config.onFocusLost(this.focusLostCount);
            }
        });

        window.addEventListener('focus', () => {
            this.isActive = true;
            this.lastActivity = Date.now();
            
            if (this.focusLostStart) {
                const lostTime = Math.floor((Date.now() - this.focusLostStart) / 1000);
                this.totalFocusLostTime += lostTime;
                this.data._values.flt = this.totalFocusLostTime;
                
                // In modalità classe, registra durata fuori focus
                if (this.config.classroomMode) {
                    this.focusEvents.push({
                        type: 'focus',
                        timestamp: Date.now(),
                        timeInSession: this.data._values.t,
                        duration: lostTime
                    });
                }
                
                this.saveData();
                this.focusLostStart = null;
                
                // Callback per notifica
                if (this.config.onFocusRestored) {
                    this.config.onFocusRestored(lostTime);
                }
            }
        });

        // Rileva cambio tab anche senza blur (per alcuni browser)
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
            _session: this.data._session
        };
    }
    //#endregion

    //#region Certificazione
    generateCertData() {
        const certData = {
            meta: {
                appName: this.config.appName,
                appVersion: this.config.appVersion,
                generated: Date.now(),
                startTime: this.data._session?.startTime || this.data._meta.startTime,
                endTime: this.data._session?.endTime || this.data._meta.lastUpdate,
                classroomMode: this.config.classroomMode
            },
            studentInfo: this.studentInfo,
            values: this.data._values,
            textFields: this.data._textFields,
            fields: []
        };

        // Se modalità classe, aggiungi dettagli sessione
        if (this.config.classroomMode && this.data._session) {
            certData.session = {
                id: this.data._session.id,
                focusEvents: this.focusEvents,
                strictMode: true
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
        if (this.config.trackFocus || this.config.classroomMode) {
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

    addTextNote(fieldKey, text) {
        if (!this.data._textFields.hasOwnProperty(fieldKey)) {
            this.data._textFields[fieldKey] = '';
        }
        this.data._textFields[fieldKey] = text;
        this.saveData();
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
    renderStatsPanel(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        let statsHTML = `
            <div class="cert-stat">
                <div class="cert-stat-value">${this.getFormattedTime(this.data._values.t)}</div>
                <div>Tempo Totale</div>
            </div>
        `;

        // Mostra info studente se disponibili
        if (this.studentInfo) {
            statsHTML = `
                <div class="cert-stat" style="grid-column: span 2;">
                    <div class="cert-stat-value" style="font-size: 1.2em;">
                        👤 ${this.studentInfo.nome} ${this.studentInfo.cognome}
                    </div>
                    <div>Classe: ${this.studentInfo.classe || 'N/D'}</div>
                </div>
            ` + statsHTML;
        }

        // Se modalità classe, mostra avviso
        if (this.isInClassroomSession()) {
            statsHTML = `
                <div class="cert-stat" style="grid-column: span 2; background: #ffc107;">
                    <div class="cert-stat-value" style="color: #000;">
                        🏫 MODALITÀ CLASSE ATTIVA
                    </div>
                    <div style="color: #000;">Tracking rigoroso abilitato</div>
                </div>
            ` + statsHTML;
        }

        this.config.fields.forEach(field => {
            if (field.type === 'text') return;
            
            const value = this.data._values[field.key] || 0;
            let displayValue = value;
            
            if (field.showZero === false && value === 0) {
                displayValue = '-';
            }
            
            if (field.type === 'percentage' && value !== 0) {
                displayValue = value + '%';
            } else if (field.type === 'time') {
                displayValue = this.getFormattedTime(value);
            }
            
            statsHTML += `
                <div class="cert-stat">
                    <div class="cert-stat-value">${displayValue}</div>
                    <div>${field.label}</div>
                </div>
            `;
        });

        // Mostra tracking focus con warning se necessario
        if (this.config.trackFocus || this.config.classroomMode) {
            const focusWarning = this.data._values.fl > 2 ? 'style="background: #ffebee; border-color: #f44336;"' : '';
            
            statsHTML += `
                <div class="cert-stat" ${focusWarning}>
                    <div class="cert-stat-value">${this.data._values.fl || 0}</div>
                    <div>Volte Focus Perso</div>
                </div>
                <div class="cert-stat">
                    <div class="cert-stat-value">${this.getFormattedTime(this.data._values.flt || 0)}</div>
                    <div>Tempo Focus Perso</div>
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
                // In modalità classe, termina sessione prima di generare
                if (this.isInClassroomSession()) {
                    if (confirm('Vuoi terminare la sessione classe e generare il certificato?')) {
                        this.endClassroomSession();
                    } else {
                        return;
                    }
                }
                
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

    // Metodi helper per modalità classe
    toggleClassroomMode(enabled) {
        this.config.classroomMode = enabled;
        
        if (enabled) {
            this.startClassroomSession();
        } else if (this.isInClassroomSession()) {
            this.endClassroomSession();
        }
        
        this.renderStatsPanel(document.querySelector('[id*="certStats"]')?.id || 'certStatsContainer');
    }
    //#endregion
}

// Export per uso con <script type="module">
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CertificationSystem;
}
