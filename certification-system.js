/**
 * SISTEMA DI CERTIFICAZIONE MODULARE v2.0
 * Autore: Flejta & Claude
 * Licenza: MIT
 * Versione: 2.0.0
 * 
 * Changelog v2.0:
 * - Aggiunto supporto per metadati nel certificato
 * - Incluse etichette dei campi nel certificato
 * - Aggiunto timestamp di generazione
 * - Supporto per campi testuali personalizzati
 * - Migliorata compatibilità con lettore universale
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
            ...config
        };
        
        this.data = this.loadData();
        this.lastActivity = Date.now();
        this.isActive = true;
        this.timerInterval = null;
        this.focusLostCount = 0;
        this.totalFocusLostTime = 0;
        this.focusLostStart = null;
        
        this.init();
    }

    //#region Inizializzazione
    init() {
        this.startTimer();
        this.setupActivityTracking();
        
        if (this.config.trackFocus) {
            this.setupFocusTracking();
        }
    }

    loadData() {
        const stored = localStorage.getItem(this.config.storageKey);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                // Migrazione da vecchio formato se necessario
                if (!parsed._meta) {
                    return this.migrateOldData(parsed);
                }
                return parsed;
            } catch (e) {
                console.error('Errore caricamento dati:', e);
            }
        }
        
        // Inizializza dati vuoti con metadati
        const initialData = { 
            _meta: {
                appName: this.config.appName,
                appVersion: this.config.appVersion,
                startTime: Date.now(),
                lastUpdate: Date.now()
            },
            _values: {
                t: 0 // tempo totale in secondi
            },
            _textFields: {} // per campi testuali personalizzati
        };
        
        // Inizializza campi numerici personalizzati
        this.config.fields.forEach(field => {
            if (field.type === 'text') {
                initialData._textFields[field.key] = field.defaultValue || '';
            } else {
                initialData._values[field.key] = field.defaultValue || 0;
            }
        });
        
        if (this.config.trackFocus) {
            initialData._values.fl = 0; // focus lost count
            initialData._values.flt = 0; // focus lost time (secondi)
        }
        
        return initialData;
    }

    migrateOldData(oldData) {
        // Migra da vecchio formato piatto a nuovo formato con metadati
        const newData = {
            _meta: {
                appName: this.config.appName,
                appVersion: this.config.appVersion,
                startTime: Date.now() - (oldData.t || 0) * 1000,
                lastUpdate: Date.now()
            },
            _values: {},
            _textFields: {}
        };

        // Copia tutti i valori numerici
        Object.keys(oldData).forEach(key => {
            if (typeof oldData[key] === 'number') {
                newData._values[key] = oldData[key];
            }
        });

        return newData;
    }

    saveData() {
        this.data._meta.lastUpdate = Date.now();
        localStorage.setItem(this.config.storageKey, JSON.stringify(this.data));
    }
    //#endregion

    //#region Timer e Attività
    startTimer() {
        if (this.timerInterval) return;
        
        this.timerInterval = setInterval(() => {
            const now = Date.now();
            const inactiveTime = now - this.lastActivity;
            
            if (inactiveTime < this.config.inactivityTimeout && this.isActive) {
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

    setupFocusTracking() {
        window.addEventListener('blur', () => {
            this.isActive = false;
            this.focusLostCount++;
            this.focusLostStart = Date.now();
            this.data._values.fl = this.focusLostCount;
            this.saveData();
        });

        window.addEventListener('focus', () => {
            this.isActive = true;
            this.lastActivity = Date.now();
            
            if (this.focusLostStart) {
                const lostTime = Math.floor((Date.now() - this.focusLostStart) / 1000);
                this.totalFocusLostTime += lostTime;
                this.data._values.flt = this.totalFocusLostTime;
                this.saveData();
                this.focusLostStart = null;
            }
        });
    }
    //#endregion

    //#region Gestione Dati
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
        // Determina se è un campo testuale o numerico
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
            _meta: this.data._meta
        };
    }

    resetData() {
        const confirm = window.confirm('Sei sicuro di voler azzerare tutte le statistiche?');
        if (confirm) {
            // Reimposta completamente i dati
            this.data = this.loadData();
            
            // Reimposta tutti i valori a 0
            Object.keys(this.data._values).forEach(key => {
                this.data._values[key] = 0;
            });
            
            // Reimposta campi testuali
            Object.keys(this.data._textFields).forEach(key => {
                this.data._textFields[key] = '';
            });
            
            // Aggiorna metadati
            this.data._meta.startTime = Date.now();
            this.data._meta.lastUpdate = Date.now();
            
            this.saveData();
            
            if (this.config.onReset) {
                this.config.onReset();
            }
        }
    }
    //#endregion

    //#region Certificazione
    generateCertData() {
        // Crea oggetto certificato con metadati completi
        const certData = {
            meta: {
                appName: this.config.appName,
                appVersion: this.config.appVersion,
                generated: Date.now(),
                startTime: this.data._meta.startTime,
                endTime: this.data._meta.lastUpdate
            },
            values: this.data._values,
            textFields: this.data._textFields,
            fields: [] // Definizioni dei campi con etichette
        };

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

        // Aggiungi campi di sistema
        if (this.config.trackFocus) {
            certData.fields.push(
                { key: 'fl', label: 'Volte Focus Perso', type: 'number' },
                { key: 'flt', label: 'Tempo Focus Perso', type: 'time' }
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

    // Aggiunge testo personalizzato al certificato
    addTextNote(fieldKey, text) {
        if (!this.data._textFields.hasOwnProperty(fieldKey)) {
            // Crea campo testo al volo se non esiste
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

        this.config.fields.forEach(field => {
            if (field.type === 'text') {
                // Salta campi testuali nel pannello statistiche
                return;
            }
            
            const value = this.data._values[field.key];
            let displayValue = value;
            
            // Gestione visualizzazione zero
            if (field.showZero === false && value === 0) {
                displayValue = '-';
            }
            
            // Formattazione speciale per tipo
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

        if (this.config.trackFocus) {
            statsHTML += `
                <div class="cert-stat">
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

    setupButtons(generateBtnId, copyBtnId, resetBtnId, linkContainerId) {
        const generateBtn = document.getElementById(generateBtnId);
        const copyBtn = document.getElementById(copyBtnId);
        const resetBtn = document.getElementById(resetBtnId);
        const linkContainer = document.getElementById(linkContainerId);

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
    }
    //#endregion
}

// Export per uso con <script type="module">
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CertificationSystem;
}
