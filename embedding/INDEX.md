# 📋 Embedding System - File Index

Riferimento rapido ai file del sistema.

---

## 📄 File Principali

### artifact-container.html
**Cosa fa:** Container principale che carica artifact e fornisce API  
**Quando passarlo a Claude:** Sempre, per modifiche al container  
**Dipendenze:** `../certification-system.js`, `./js/edge-tts.js`

### js/edge-tts.js
**Cosa fa:** Modulo TTS standalone con API Edge reversate  
**Quando passarlo a Claude:** Per modifiche TTS o debug sintesi vocale  
**Standalone:** Sì, può essere usato senza container

---

## 📚 Documentazione

### README.md
**Tipo:** Guida pratica rapida  
**Contenuto:** 
- Quick start
- Esempi d'uso completi
- Troubleshooting comune
**Quando passarlo a Claude:** Per capire come funziona tutto

### PROTOCOLLO.md
**Tipo:** Riferimento tecnico API  
**Contenuto:**
- Sintassi messaggi completa
- Tutti i parametri
- Esempi tecnici per ogni API
**Quando passarlo a Claude:** Per dettagli tecnici o nuove funzioni

---

## 🎨 Esempi

### artifact-demo.jsx
**Cosa fa:** Esempio React completo con TTS + Certificazione  
**Quando passarlo a Claude:** Come riferimento per nuovi artifact

---

## 🔧 Quick Reference

### Per Claude: "Voglio creare un artifact"
Passa:
- ✅ README.md
- ✅ PROTOCOLLO.md

### Per Claude: "Debug/modifica container"
Passa:
- ✅ artifact-container.html
- ✅ PROTOCOLLO.md
- ✅ Descrizione problema/modifica

### Per Claude: "Problema con TTS"
Passa:
- ✅ js/edge-tts.js
- ✅ artifact-container.html (sezione TTS handlers)
- ✅ Descrizione problema

### Per Claude: "Aggiungi nuova funzione"
Passa:
- ✅ artifact-container.html
- ✅ PROTOCOLLO.md
- ✅ Descrizione funzione voluta

---

## 🌳 Struttura Completa

```
embedding/
├── INDEX.md                    ← QUESTO FILE
├── README.md                   ← Guida pratica
├── PROTOCOLLO.md               ← API reference tecnica
├── artifact-container.html     ← Container principale
├── artifact-demo.jsx           ← Esempio React
└── js/
    └── edge-tts.js             ← Modulo TTS standalone
```

---

## 💾 Set File Consigliati da Salvare Localmente

Se vuoi lavorare offline o avere un backup rapido:

**Set Minimo (per consultazione):**
```
embedding/README.md
embedding/PROTOCOLLO.md
```

**Set Completo (per sviluppo):**
```
embedding/README.md
embedding/PROTOCOLLO.md
embedding/artifact-container.html
embedding/js/edge-tts.js
../certification-system.js (parent)
```

---

## 📝 Note

- **README.md** e **PROTOCOLLO.md** sono complementari, non sostitutivi
- **edge-tts.js** è standalone e può essere usato anche senza container
- **artifact-container.html** dipende da entrambi gli script parent

---

Ultimo aggiornamento: 2025-01-30
