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
    // Nuovo metodo per pannello completo con UI integrata
    renderFullPanel(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Opzioni di configurazione
        const config = {
            collapsible: options.collapsible !== false,
            showStudentControls: options.showStudentControls !== false,
            showClassroomToggle: options.showClassroomToggle !== false,
            ...options
        };

        // CSS inline per garantire stile consistente
        if (!document.getElementById('cert-system-styles')) {
            const style = document.createElement('style');
            style.id = 'cert-system-styles';
            style.innerHTML = `
                .cert-panel {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 15px;
                    color: white;
                    margin-top: 20px;
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
                .cert-controls-bar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 15px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 10px;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                    gap: 10px;
                }
                .cert-student-info {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .cert-student-badge {
                    padding: 8px 15px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 8px;
                    font-weight: bold;
                }
                .cert-student-badge.registered {
                    background: rgba(76, 175, 80, 0.3);
                }
                .cert-classroom-toggle {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .cert-switch {
                    position: relative;
                    width: 60px;
                    height: 28px;
                    background: #ccc;
                    border-radius: 28px;
                    cursor: pointer;
                }
                .cert-switch.active {
                    background: #f44336;
                }
                .cert-switch::after {
                    content: '';
                    position: absolute;
                    width: 20px;
                    height: 20px;
                    background: white;
                    border-radius: 50%;
                    top: 4px;
                    left: 4px;
                    transition: transform 0.3s;
                }
                .cert-switch.active::after {
                    transform: translateX(32px);
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
                .cert-warning {
                    background: #ffc107;
                    color: #000;
                    padding: 15px;
                    border-radius: 10px;
                    margin: 15px 0;
                    text-align: center;
                    font-weight: bold;
                }
            `;
            document.head.appendChild(style);
        }

        // Genera HTML del pannello
        let html = `
            <div class="cert-panel ${container.dataset.collapsed === 'true' ? 'collapsed' : ''}" id="${containerId}-panel">
                <div class="cert-panel-header" ${config.collapsible ? `onclick="certSystemTogglePanel('${containerId}')"` : ''}>
                    <span class="cert-panel-title">📜 Certificato di Completamento</span>
                    <span class="cert-collapse-icon">▼</span>
                </div>
                <div class="cert-panel-content">
        `;

        // Barra controlli (studente + modalità classe)
        if (config.showStudentControls || config.showClassroomToggle) {
            html += '<div class="cert-controls-bar">';
            
            // Info studente
            if (config.showStudentControls) {
                const studentText = this.studentInfo && this.studentInfo.nome ? 
                    `👤 ${this.studentInfo.nome} ${this.studentInfo.cognome}` : 
                    '👤 Studente non registrato';
                const studentClass = this.studentInfo && this.studentInfo.nome ? 'registered' : '';
                
                html += `
                    <div class="cert-student-info">
                        <div class="cert-student-badge ${studentClass}">${studentText}</div>
                        <button class="cert-btn" onclick="certSystemPromptStudent('${this.config.storageKey}')">
                            📝 ${this.studentInfo ? 'Modifica' : 'Registra'}
                        </button>
                    </div>
                `;
            }
            
            // Toggle modalità classe
            if (config.showClassroomToggle) {
                const isActive = this.config.classroomMode;
                html += `
                    <div class="cert-classroom-toggle">
                        <label style="font-weight: bold;">🏫 Modalità Classe</label>
                        <div class="cert-switch ${isActive ? 'active' : ''}" 
                             onclick="certSystemToggleClassroom('${this.config.storageKey}', this)">
                        </div>
                    </div>
                `;
            }
            
            html += '</div>';
        }

        // Avviso modalità classe
        if (this.isInClassroomSession()) {
            html += `
                <div class="cert-warning">
                    ⚠️ MODALITÀ CLASSE ATTIVA - Tracking rigoroso del focus abilitato
                </div>
            `;
        }

        // Pannello statistiche
        html += '<div class="cert-stats" id="' + containerId + '-stats"></div>';
        
        // Bottoni azione
        html += `
            <div style="display: flex; justify-content: center; gap: 10px; margin-top: 20px; flex-wrap: wrap;">
                <button class="cert-btn cert-btn-primary" onclick="certSystemGenerateLink('${this.config.storageKey}')">
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
                <p style="text-align: center;">Link certificato generato:</p>
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

        // Aggiungi funzioni globali per gestione eventi
        if (!window.certSystemTogglePanel) {
            window.certSystemTogglePanel = (id) => {
                const panel = document.getElementById(id + '-panel');
                const container = document.getElementById(id);
                if (panel && container) {
                    panel.classList.toggle('collapsed');
                    container.dataset.collapsed = panel.classList.contains('collapsed');
                }
            };

            window.certSystemPromptStudent = (storageKey) => {
                // Trova l'istanza corretta
                if (this.config.storageKey === storageKey) {
                    this.promptStudentInfo();
                    this.renderFullPanel(containerId, options);
                }
            };

            window.certSystemToggleClassroom = (storageKey, element) => {
                if (this.config.storageKey === storageKey) {
                    const isActive = element.classList.contains('active');
                    if (!isActive) {
                        if (confirm('Attivare MODALITÀ CLASSE?\n\nQuesto comporta:\n• Tracking rigoroso\n• Nuova sessione\n• Registrazione di ogni cambio finestra\n\nContinuare?')) {
                            this.toggleClassroomMode(true);
                            element.classList.add('active');
                            this.renderFullPanel(containerId, options);
                        }
                    } else {
                        if (confirm('Disattivare modalità classe?')) {
                            this.toggleClassroomMode(false);
                            element.classList.remove('active');
                            this.renderFullPanel(containerId, options);
                        }
                    }
                }
            };

            window.certSystemGenerateLink = (storageKey) => {
                if (this.config.storageKey === storageKey) {
                    const link = this.generateCertLink();
                    document.getElementById(containerId + '-link').style.display = 'block';
                    document.getElementById(containerId + '-link-text').textContent = link;
                }
            };

            window.certSystemCopyLink = (containerId) => {
                const linkText = document.getElementById(containerId + '-link-text').textContent;
                navigator.clipboard.writeText(linkText).then(() => {
                    alert('Link certificato copiato!');
                });
            };

            window.certSystemResetData = (storageKey) => {
                if (this.config.storageKey === storageKey) {
                    this.resetData();
                }
            };
        }
    }

    renderStatsPanel(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Inizia con stringa vuota
        let statsHTML = '';

        // 1. Info studente (se presente)
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

        // 2. Modalità classe (se attiva)
        if (this.isInClassroomSession()) {
            statsHTML += `
                <div class="cert-stat" style="grid-column: span 2; background: #ffc107; color: #000;">
                    <div class="cert-stat-value" style="color: #000;">
                        🏫 MODALITÀ CLASSE ATTIVA
                    </div>
                    <div style="color: #000;">Tracking rigoroso abilitato</div>
                </div>
            `;
        }

        // 3. Tempo totale (sempre presente)
        statsHTML += `
            <div class="cert-stat">
                <div class="cert-stat-value">${this.getFormattedTime(this.data._values.t || 0)}</div>
                <div>Tempo Totale</div>
            </div>
        `;

        // 4. Campi personalizzati
        this.config.fields.forEach(field => {
            if (field.type === 'text') return; // Salta campi testo
            
            const value = this.data._values[field.key] || 0;
            let displayValue = value;
            
            // Gestione visualizzazione
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
                    <div>${field.label}</div>
                </div>
            `;
        });

        // 5. Focus tracking (se abilitato)
        if (this.config.trackFocus || this.config.classroomMode) {
            const focusCount = this.data._values.fl || 0;
            const focusTime = this.data._values.flt || 0;
            
            // Colore warning se troppe violazioni
            const warningStyle = focusCount > 2 ? 
                'background: rgba(244,67,54,0.2); border: 2px solid #f44336;' : '';
            
            statsHTML += `
                <div class="cert-stat" style="${warningStyle}">
                    <div class="cert-stat-value">${focusCount}</div>
                    <div>Volte Focus Perso</div>
                </div>
                <div class="cert-stat" style="${warningStyle}">
                    <div class="cert-stat-value">${this.getFormattedTime(focusTime)}</div>
                    <div>Tempo Focus Perso</div>
                </div>
            `;
        }

        // Aggiorna container
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
