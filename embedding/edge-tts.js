/**
 * EDGE TTS MODULE - API Reversate da Microsoft Edge TTS
 * Autore: Flejta
 * Versione: 1.0.0
 * Licenza: MIT
 * 
 * ATTENZIONE: Usa API non documentate di Microsoft.
 * Token e versione potrebbero richiedere aggiornamenti periodici.
 */

class EdgeTTS {
    constructor(config = {}) {
        this.config = {
            token: config.token || "6A5AA1D4EAFF4E9FB37E23D68491D6F4",
            version: config.version || "1-130.0.2849.68",
            baseUrl: config.baseUrl || "wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1",
            timeout: config.timeout || 60,
            minDelay: config.minDelay || 150,
            maxRetries: config.maxRetries || 3,
            turnEndDelay: config.turnEndDelay || 500,
            debug: config.debug || false
        };
        
        this.currentSocket = null;
        this.isProcessing = false;
        
        if (this.config.debug) {
            console.log('EdgeTTS inizializzato:', this.config);
        }
    }

    //#region Utility Functions
    
    async generateSecMsGec() {
        const WIN_EPOCH = 11644473600;
        const S_TO_NS = 1e9;
        let ticks = (Date.now() / 1000) + WIN_EPOCH;
        ticks -= ticks % 300;
        ticks *= (S_TO_NS / 100);
        const stringToHash = `${ticks.toFixed(0)}${this.config.token}`;
        const encoder = new TextEncoder();
        const data = encoder.encode(stringToHash);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    }

    formatTimestamp() {
        const now = new Date();
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const pad = (num) => (num < 10 ? "0" : "") + num;
        return `${days[now.getUTCDay()]} ${months[now.getUTCMonth()]} ${pad(now.getUTCDate())} ${now.getUTCFullYear()} ${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())} GMT+0000 (Coordinated Universal Time)`;
    }

    generateUUID() {
        return "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, (c) =>
            (c === "x" ? (Math.random() * 16) | 0 : ((Math.random() * 16) & 0x3) | 0x8).toString(16)
        );
    }

    escapeSSML(text) {
        if (typeof text !== 'string') return "";
        return text.replace(/&/g, "&amp;")
                   .replace(/</g, "&lt;")
                   .replace(/>/g, "&gt;")
                   .replace(/"/g, "&quot;")
                   .replace(/'/g, "'");
    }

    normalizeText(text) {
        if (!text) return "";
        
        let normalized = text.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F\uFFF0-\uFFFF]/g, "");
        
        normalized = normalized
            .replace(/[\u2018\u2019\u0060\u00B4]/g, "'")
            .replace(/[\u201C\u201D\u201E\u201F\u00AB\u00BB]/g, '"')
            .replace(/[\u2013\u2014]/g, " - ")
            .replace(/\u2026/g, "...")
            .replace(/\u00A0/g, " ")
            .replace(/[\u00B0]/g, " gradi ")
            .replace(/[\u00A9]/g, " copyright ")
            .replace(/[\u00AE]/g, " registrato ")
            .replace(/[\u20AC]/g, " euro ")
            .replace(/[\u00A3]/g, " sterline ")
            .replace(/&[#\w]+;/g, " ");
        
        normalized = normalized
            .replace(/\t+/g, " ")
            .replace(/\n{3,}/g, "\n\n")
            .replace(/[ ]{2,}/g, " ")
            .replace(/\n[ ]+/g, "\n")
            .replace(/[ ]+\n/g, "\n");
        
        normalized = normalized
            .replace(/(\d+)°C/gi, "$1 gradi Celsius")
            .replace(/(\d+)°F/gi, "$1 gradi Fahrenheit")
            .replace(/(\d+)°/g, "$1 gradi")
            .replace(/(\d+)%/g, "$1 per cento")
            .replace(/\b(\d+)x(\d+)\b/gi, "$1 per $2");
        
        return normalized.trim();
    }

    //#endregion

    //#region Main TTS Function
    
    /**
     * Genera audio da testo usando Edge TTS
     * @param {string} text - Testo da sintetizzare
     * @param {Object} options - Opzioni per la sintesi
     * @param {string} options.voice - Nome voce (default: 'it-IT-IsabellaNeural')
     * @param {string} options.rate - Velocità (default: '+0%')
     * @param {string} options.pitch - Tono (default: '+0Hz')
     * @param {string} options.volume - Volume (default: '+0%')
     * @param {boolean} options.normalize - Normalizza testo (default: true)
     * @returns {Promise<Blob>} Blob audio MP3
     */
    async speak(text, options = {}) {
        const {
            voice = 'it-IT-IsabellaNeural',
            rate = '+0%',
            pitch = '+0Hz',
            volume = '+0%',
            normalize = true
        } = options;
        
        if (!text || text.trim() === '') {
            throw new Error('Testo vuoto');
        }
        
        // Normalizza se richiesto
        const processedText = normalize ? this.normalizeText(text) : text;
        
        if (this.config.debug) {
            console.log('EdgeTTS.speak:', {
                originalLength: text.length,
                processedLength: processedText.length,
                voice,
                rate,
                pitch,
                volume
            });
        }
        
        // Genera audio
        return await this._generateAudio(processedText, voice, rate, pitch, volume);
    }

    async _generateAudio(text, voice, rate, pitch, volume) {
        const secMsGecToken = await this.generateSecMsGec();
        const fullWssUrl = `${this.config.baseUrl}?TrustedClientToken=${this.config.token}&Sec-MS-GEC=${secMsGecToken}&Sec-MS-GEC-Version=${this.config.version}`;
        
        return new Promise((resolve, reject) => {
            let audioChunks = [];
            let receivedTurnEnd = false;
            let ws;
            let timeoutId;
            let resolveOrRejectCalled = false;

            const safeReject = (error) => {
                if (resolveOrRejectCalled) return;
                resolveOrRejectCalled = true;
                clearTimeout(timeoutId);
                if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
                    try {
                        ws.close(1000, "Error cleanup");
                    } catch (e) {}
                }
                this.currentSocket = null;
                reject(error);
            };

            const safeResolve = (blob) => {
                if (resolveOrRejectCalled) return;
                resolveOrRejectCalled = true;
                clearTimeout(timeoutId);
                if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
                    try {
                        ws.close(1000, "Success");
                    } catch (e) {}
                }
                this.currentSocket = null;
                resolve(blob);
            };

            // Timeout
            timeoutId = setTimeout(() => {
                if (!receivedTurnEnd) {
                    safeReject(new Error(`Timeout (${this.config.timeout}s) - turn.end non ricevuto`));
                } else if (audioChunks.length > 0) {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/mpeg' });
                    if (audioBlob.size > 100) {
                        if (this.config.debug) console.log('Timeout post turn.end ma dati validi');
                        safeResolve(audioBlob);
                    } else {
                        safeReject(new Error('Timeout post turn.end senza dati validi'));
                    }
                } else {
                    safeReject(new Error('Timeout post turn.end senza dati'));
                }
            }, this.config.timeout * 1000);

            // Crea WebSocket
            try {
                ws = new WebSocket(fullWssUrl);
                this.currentSocket = ws;
            } catch (e) {
                safeReject(new Error(`Errore creazione WebSocket: ${e.message}`));
                return;
            }

            ws.onopen = () => {
                if (resolveOrRejectCalled) return;
                
                // Invia configurazione
                const timestamp = this.formatTimestamp();
                const configMessage = `X-Timestamp:${timestamp}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n${JSON.stringify({
                    context: {
                        synthesis: {
                            audio: {
                                metadataoptions: {
                                    sentenceBoundaryEnabled: "false",
                                    wordBoundaryEnabled: "false"
                                },
                                outputFormat: "audio-24khz-48kbitrate-mono-mp3"
                            }
                        }
                    }
                })}`;
                ws.send(configMessage);

                // Prepara e invia SSML
                const voiceData = voice.split('-');
                const voiceLang = `${voiceData[0]}-${voiceData[1]}`;
                const escapedText = this.escapeSSML(text);
                const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='${voiceLang}'><voice name='${voice}'><prosody rate='${rate}' volume='${volume}' pitch='${pitch}'>${escapedText}</prosody></voice></speak>`;
                const requestId = this.generateUUID();
                const ssmlTimestamp = this.formatTimestamp();
                const ssmlMessage = `X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${ssmlTimestamp}Z\r\nPath:ssml\r\n\r\n${ssml}`;
                
                ws.send(ssmlMessage);
            };

            ws.onmessage = async (event) => {
                if (resolveOrRejectCalled) return;

                if (typeof event.data === 'string') {
                    if (event.data.includes('Path:turn.end')) {
                        if (receivedTurnEnd) return;
                        receivedTurnEnd = true;
                        
                        // Attendi dati residui
                        setTimeout(() => {
                            if (resolveOrRejectCalled) return;
                            
                            const audioBlob = new Blob(audioChunks, { type: 'audio/mpeg' });
                            
                            if (audioBlob.size < 100 && text.length > 10) {
                                safeReject(new Error(`Audio troppo piccolo (${audioBlob.size} bytes) per testo di ${text.length} caratteri`));
                            } else {
                                safeResolve(audioBlob);
                            }
                        }, this.config.turnEndDelay);
                    } else if (event.data.includes('error') || event.data.includes('Error')) {
                        if (this.config.debug) {
                            console.warn('Messaggio errore da WebSocket:', event.data);
                        }
                    }
                } else if (event.data instanceof Blob) {
                    try {
                        const arrayBuffer = await event.data.arrayBuffer();
                        if (arrayBuffer.byteLength < 2) return;
                        
                        const dataView = new DataView(arrayBuffer);
                        const headerLength = dataView.getUint16(0, false);
                        
                        if (headerLength <= 0 || headerLength + 2 > arrayBuffer.byteLength) {
                            return;
                        }
                        
                        const audioData = arrayBuffer.slice(headerLength + 2);
                        if (audioData.byteLength > 0) {
                            audioChunks.push(audioData);
                        }
                    } catch (error) {
                        if (this.config.debug) {
                            console.error('Errore processamento Blob audio:', error);
                        }
                    }
                }
            };

            ws.onerror = (errorEvent) => {
                let errorMsg = 'Errore WebSocket';
                if (errorEvent.message) errorMsg += `: ${errorEvent.message}`;
                if (this.config.debug) {
                    console.error('WebSocket error:', errorEvent);
                }
                safeReject(new Error(errorMsg));
            };

            ws.onclose = (event) => {
                if (!resolveOrRejectCalled && !receivedTurnEnd) {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/mpeg' });
                    if (audioBlob.size > 100 && event.code === 1000) {
                        safeResolve(audioBlob);
                    } else {
                        safeReject(new Error(`WebSocket chiuso (codice ${event.code}) prima di turn.end`));
                    }
                }
                this.currentSocket = null;
            };
        });
    }

    //#endregion

    //#region Helper Methods

    /**
     * Ferma qualsiasi sintesi in corso
     */
    stop() {
        if (this.currentSocket && this.currentSocket.readyState === WebSocket.OPEN) {
            this.currentSocket.close(1000, "User stop");
            this.currentSocket = null;
        }
    }

    /**
     * Verifica se una sintesi è in corso
     */
    isSpeaking() {
        return this.currentSocket !== null && this.currentSocket.readyState === WebSocket.OPEN;
    }

    /**
     * Lista delle voci disponibili (subset comune)
     */
    getVoices() {
        return [
            // Italiano
            { name: 'it-IT-IsabellaNeural', lang: 'it-IT', gender: 'F', label: 'Isabella (Italiano)' },
            { name: 'it-IT-ElsaNeural', lang: 'it-IT', gender: 'F', label: 'Elsa (Italiano)' },
            { name: 'it-IT-DiegoNeural', lang: 'it-IT', gender: 'M', label: 'Diego (Italiano)' },
            
            // Inglese US
            { name: 'en-US-JennyNeural', lang: 'en-US', gender: 'F', label: 'Jenny (Inglese US)' },
            { name: 'en-US-AriaNeural', lang: 'en-US', gender: 'F', label: 'Aria (Inglese US)' },
            { name: 'en-US-GuyNeural', lang: 'en-US', gender: 'M', label: 'Guy (Inglese US)' },
            
            // Inglese UK
            { name: 'en-GB-SoniaNeural', lang: 'en-GB', gender: 'F', label: 'Sonia (Inglese UK)' },
            { name: 'en-GB-RyanNeural', lang: 'en-GB', gender: 'M', label: 'Ryan (Inglese UK)' },
            
            // Francese
            { name: 'fr-FR-DeniseNeural', lang: 'fr-FR', gender: 'F', label: 'Denise (Francese)' },
            { name: 'fr-FR-HenriNeural', lang: 'fr-FR', gender: 'M', label: 'Henri (Francese)' },
            
            // Tedesco
            { name: 'de-DE-KatjaNeural', lang: 'de-DE', gender: 'F', label: 'Katja (Tedesco)' },
            { name: 'de-DE-ConradNeural', lang: 'de-DE', gender: 'M', label: 'Conrad (Tedesco)' },
            
            // Spagnolo
            { name: 'es-ES-ElviraNeural', lang: 'es-ES', gender: 'F', label: 'Elvira (Spagnolo)' },
            { name: 'es-ES-AlvaroNeural', lang: 'es-ES', gender: 'M', label: 'Alvaro (Spagnolo)' }
        ];
    }

    //#endregion
}

// Export per vari ambienti
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EdgeTTS;
}
if (typeof window !== 'undefined') {
    window.EdgeTTS = EdgeTTS;
}
