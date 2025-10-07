/**
 * SISTEMA DI CERTIFICAZIONE MODULARE
 * Autore: Flejta & Claude
 * Licenza: MIT
 * Versione: 1.0.0
 * 
 * Sistema flessibile per tracciare e certificare l'attività degli studenti
 * con supporto localStorage, timer intelligente e campi personalizzabili.
 */

class CertificationSystem {
    constructor(config) {
        this.config = {
            appName: config.appName || 'App',
            storageKey: config.storageKey || 'cert_data',
            certUrl: config.certUrl || 'https://certificationsystem.netlify.app/',
            fields: config.fields || [],
            trackFocus: config.trackFocus || false,
            inactivityTimeout: config.inactivityTimeout || 120000, // 2 minuti default
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
                return JSON.parse(stored);
            } catch (e) {
                console.error('Errore caricamento dati:', e);
            }
        }
        
        // Inizializza dati vuoti
        const initialData = { t: 0 }; // t = tempo totale
        
        // Inizializza campi personalizzati
        this.config.fields.forEach(field => {
            initialData[field.key] = 0;
        });
        
        if (this.config.trackFocus) {
            initialData.fl = 0; // focus lost count
            initialData.flt = 0; // focus lost time (secondi)
        }
        
        return initialData;
    }

    saveData() {
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
                this.data.t++;
                this.saveData();
                
                if (this.config.onTimerUpdate) {
                    this.config.onTimerUpdate(this.data.t);
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
            this.data.fl = this.focusLostCount;
            this.saveData();
        });

        window.addEventListener('focus', () => {
            this.isActive = true;
            this.lastActivity = Date.now();
            
            if (this.focusLostStart) {
                const lostTime = Math.floor((Date.now() - this.focusLostStart) / 1000);
                this.totalFocusLostTime += lostTime;
                this.data.flt = this.totalFocusLostTime;
                this.saveData();
                this.focusLostStart = null;
            }
        });
    }
    //#endregion

    //#region Gestione Dati
    incrementField(fieldKey, amount = 1) {
        if (this.data.hasOwnProperty(fieldKey)) {
            this.data[fieldKey] += amount;
            this.saveData();
            
            if (this.config.onFieldUpdate) {
                this.config.onFieldUpdate(fieldKey, this.data[fieldKey]);
            }
        }
    }

    setField(fieldKey, value) {
        if (this.data.hasOwnProperty(fieldKey)) {
            this.data[fieldKey] = value;
            this.saveData();
            
            if (this.config.onFieldUpdate) {
                this.config.onFieldUpdate(fieldKey, this.data[fieldKey]);
            }
        }
    }

    getField(fieldKey) {
        return this.data[fieldKey] || 0;
    }

    getData() {
        return { ...this.data };
    }

    resetData() {
        const confirm = window.confirm('Sei sicuro di voler azzerare tutte le statistiche?');
        if (confirm) {
            this.data = this.loadData(); // Ricarica dati vuoti
            Object.keys(this.data).forEach(key => {
                this.data[key] = 0;
            });
            this.saveData();
            
            if (this.config.onReset) {
                this.config.onReset();
            }
        }
    }
    //#endregion

    //#region Certificazione
    generateCertLink() {
        const encoded = btoa(JSON.stringify(this.data));
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
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    //#endregion

    //#region UI Helper
    renderStatsPanel(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        let statsHTML = `
            <div class="cert-stat">
                <div class="cert-stat-value">${this.getFormattedTime(this.data.t)}</div>
                <div>Tempo Totale</div>
            </div>
        `;

        this.config.fields.forEach(field => {
            const value = this.data[field.key];
            const displayValue = (field.showZero === false && value === 0) ? '-' : value;
            
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
                    <div class="cert-stat-value">${this.data.fl || 0}</div>
                    <div>Volte Focus Perso</div>
                </div>
                <div class="cert-stat">
                    <div class="cert-stat-value">${this.getFormattedTime(this.data.flt || 0)}</div>
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
