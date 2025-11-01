import React, { useState, useEffect } from 'react';

export default function ArtifactDemo() {
  const [containerConnected, setContainerConnected] = useState(false);
  const [certData, setCertData] = useState(null);
  const [score, setScore] = useState(0);
  const [libraryStatus, setLibraryStatus] = useState({});
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Notifica al container che siamo pronti
    sendToContainer({
      type: 'ARTIFACT_READY',
      timestamp: Date.now()
    });

    // Listener per messaggi dal container
    window.addEventListener('message', handleContainerMessage);

    return () => {
      window.removeEventListener('message', handleContainerMessage);
    };
  }, []);

  // Gestisce messaggi dal container
  function handleContainerMessage(event) {
    // In produzione, verifica event.origin
    const message = event.data;
    
    addMessage(`Ricevuto: ${message.type}`, 'received');
    console.log('Messaggio da container:', message);

    switch(message.type) {
      case 'CONTAINER_INFO':
        setContainerConnected(true);
        addMessage('✅ Connesso al container!', 'success');
        break;

      case 'LIBRARY_LOADED':
        setLibraryStatus(prev => ({
          ...prev,
          [message.name]: message.success ? 'loaded' : 'error'
        }));
        if (message.success) {
          addMessage(`✅ Libreria caricata: ${message.name}`, 'success');
        } else {
          addMessage(`❌ Errore caricamento: ${message.name}`, 'error');
        }
        break;

      case 'CERT_ACTION_RESULT':
        if (message.success) {
          addMessage(`✅ Azione completata: ${message.action}`, 'success');
          if (message.result !== undefined) {
            console.log('Risultato:', message.result);
          }
        }
        break;

      case 'CERT_DATA':
        if (message.success) {
          setCertData(message.data);
          setScore(message.data.score || 0);
        }
        break;

      case 'CERT_DATA_UPDATED':
        addMessage(`📊 Dati aggiornati: ${message.key} = ${message.value}`, 'info');
        break;
    }
  }

  // Invia messaggio al container
  function sendToContainer(message) {
    window.parent.postMessage(message, '*');
    addMessage(`Inviato: ${message.type}`, 'sent');
  }

  // Richiedi caricamento libreria
  function requestLibrary(url, name) {
    sendToContainer({
      type: 'LOAD_LIBRARY',
      url: url,
      name: name
    });
    setLibraryStatus(prev => ({
      ...prev,
      [name]: 'loading'
    }));
  }

  // Usa sistema certificazione
  function incrementScore(amount) {
    sendToContainer({
      type: 'CERT_ACTION',
      action: 'increment',
      key: 'score',
      value: amount
    });
    sendToContainer({
      type: 'CERT_ACTION',
      action: 'increment',
      key: 'actions',
      value: 1
    });
  }

  function getCertData() {
    sendToContainer({
      type: 'GET_CERT_DATA'
    });
  }

  function generateCertificate() {
    sendToContainer({
      type: 'CERT_ACTION',
      action: 'generateLink'
    });
  }

  function addMessage(text, type) {
    setMessages(prev => [...prev, { text, type, time: new Date().toLocaleTimeString() }].slice(-10));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800">
              🎨 Artifact Demo - Sistema Container
            </h1>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${containerConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600">
                {containerConnected ? 'Connesso' : 'Disconnesso'}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Azioni Certificazione */}
          <div className="bg-white rounded-lg shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              🎓 Sistema Certificazione
            </h2>
            
            <div className="mb-6">
              <div className="text-4xl font-bold text-center text-purple-600 mb-2">
                {score}
              </div>
              <div className="text-center text-gray-600">Punteggio Attuale</div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => incrementScore(10)}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition"
              >
                ✅ +10 Punti
              </button>
              
              <button
                onClick={() => incrementScore(50)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition"
              >
                🎯 +50 Punti
              </button>
              
              <button
                onClick={getCertData}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded-lg transition"
              >
                📊 Ottieni Dati
              </button>
              
              <button
                onClick={generateCertificate}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-4 rounded-lg transition"
              >
                📜 Genera Certificato
              </button>
            </div>

            {certData && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-sm font-mono text-gray-700">
                  <div><strong>Tempo:</strong> {certData.t || 0}s</div>
                  <div><strong>Azioni:</strong> {certData.actions || 0}</div>
                  <div><strong>Score:</strong> {certData.score || 0}</div>
                </div>
              </div>
            )}
          </div>

          {/* Richieste Librerie */}
          <div className="bg-white rounded-lg shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              📚 Caricamento Librerie
            </h2>
            
            <div className="space-y-3">
              <button
                onClick={() => requestLibrary('https://cdn.jsdelivr.net/npm/chart.js', 'Chart.js')}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-between"
              >
                <span>📊 Carica Chart.js</span>
                <span className="text-xs">
                  {libraryStatus['Chart.js'] === 'loading' && '⏳'}
                  {libraryStatus['Chart.js'] === 'loaded' && '✅'}
                  {libraryStatus['Chart.js'] === 'error' && '❌'}
                </span>
              </button>
              
              <button
                onClick={() => requestLibrary('https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js', 'Axios')}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-between"
              >
                <span>🌐 Carica Axios</span>
                <span className="text-xs">
                  {libraryStatus['Axios'] === 'loading' && '⏳'}
                  {libraryStatus['Axios'] === 'loaded' && '✅'}
                  {libraryStatus['Axios'] === 'error' && '❌'}
                </span>
              </button>
              
              <button
                onClick={() => requestLibrary('https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js', 'Lodash')}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-between"
              >
                <span>🔧 Carica Lodash</span>
                <span className="text-xs">
                  {libraryStatus['Lodash'] === 'loading' && '⏳'}
                  {libraryStatus['Lodash'] === 'loaded' && '✅'}
                  {libraryStatus['Lodash'] === 'error' && '❌'}
                </span>
              </button>
            </div>

            <div className="mt-4 text-xs text-gray-600">
              💡 Le librerie vengono caricate dinamicamente dal container parent
            </div>
          </div>
        </div>

        {/* Log Messaggi */}
        <div className="bg-white rounded-lg shadow-xl p-6 mt-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            💬 Log Comunicazione
          </h2>
          
          <div className="bg-gray-900 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
            {messages.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                Nessun messaggio ancora...
              </div>
            ) : (
              messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`mb-2 ${
                    msg.type === 'sent' ? 'text-blue-400' :
                    msg.type === 'received' ? 'text-purple-400' :
                    msg.type === 'success' ? 'text-green-400' :
                    msg.type === 'error' ? 'text-red-400' :
                    'text-gray-400'
                  }`}
                >
                  [{msg.time}] {msg.text}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Info */}
        <div className="bg-white rounded-lg shadow-xl p-6 mt-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            ℹ️ Come Funziona
          </h2>
          
          <div className="space-y-3 text-gray-700">
            <div className="flex items-start gap-3">
              <span className="text-2xl">1️⃣</span>
              <div>
                <strong>Artifact comunica con Container</strong>
                <p className="text-sm text-gray-600">
                  Usa window.postMessage() per inviare richieste al parent
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="text-2xl">2️⃣</span>
              <div>
                <strong>Container carica librerie</strong>
                <p className="text-sm text-gray-600">
                  Su richiesta, carica dinamicamente qualsiasi libreria JS
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="text-2xl">3️⃣</span>
              <div>
                <strong>Sistema Certificazione integrato</strong>
                <p className="text-sm text-gray-600">
                  L'artifact può usare il tuo sistema senza doverlo embedded
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
