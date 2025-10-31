import { useState, useCallback } from 'react';
import { Upload, FileCode, Sparkles, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface AnalysisResult {
  fileName: string;
  language: string;
  description: string;
  functions?: Array<{
    name: string;
    description: string;
    parameters: string[];
    returnType: string;
  }>;
  dependencies?: string[];
  usageExamples?: string;
  complexity?: string;
  recommendations?: string[];
}

export function CodeAnalysisPage() {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const validExtensions = ['.js', '.ts', '.tsx', '.jsx', '.py', '.java', '.cs', '.cpp', '.c', '.go', '.rs', '.php'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExtension)) {
      setError('Ungültiger Dateityp. Unterstützt werden: ' + validExtensions.join(', '));
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setError('Datei zu groß. Maximum: 5MB');
      return;
    }
    
    setFile(file);
    setError(null);
    setResult(null);
  };

  const analyzeCode = async () => {
    if (!file) return;

    setAnalyzing(true);
    setError(null);

    try {
      const fileContent = await file.text();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const fullUrl = `${apiUrl}/api/analyze/code`;
      
      console.log('[Frontend] API URL:', fullUrl);
      console.log('[Frontend] Analyzing file:', file.name);
      
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          code: fileContent,
        }),
      });

      console.log('[Frontend] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Frontend] Error response:', errorText);
        throw new Error(`Analyse fehlgeschlagen (${response.status})`);
      }

      const responseText = await response.text();
      console.log('[Frontend] Response text:', responseText);
      
      const data = JSON.parse(responseText);
      console.log('[Frontend] Parsed data:', data);
      
      setResult(data);
    } catch (err) {
      console.error('[Frontend] Error:', err);
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setAnalyzing(false);
    }
  };

  const saveAsDocument = async () => {
    if (!result) return;

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Code Dokumentation: ${result.fileName}`,
          content: result.description,
          category: 'CODE_ANALYSIS',
          status: 'PUBLISHED',
        }),
      });

      if (response.ok) {
        alert('✅ Als Dokument gespeichert!');
      }
    } catch (err) {
      alert('❌ Fehler beim Speichern');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <FileCode className="w-10 h-10 text-cyan-400" />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Code Analyse
            </span>
            <span className="px-3 py-1 text-sm font-bold bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-full">
              AI-Powered
            </span>
          </h1>
          <p className="text-gray-400">
            Lade eine Code-Datei hoch und lass die KI sie analysieren und dokumentieren.
          </p>
        </div>

        {/* Debug Info */}
        <div className="mb-4 p-4 bg-blue-900/20 border border-blue-800 rounded-xl">
          <div className="flex items-center gap-2 text-blue-300 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>API URL: {import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/analyze/code</span>
          </div>
        </div>

        {/* Upload Area */}
        <div className="mb-8">
          <div
            className={`
              relative border-2 border-dashed rounded-2xl p-12 text-center
              transition-all duration-300
              ${dragActive 
                ? 'border-cyan-500 bg-cyan-500/10' 
                : 'border-gray-700 hover:border-gray-600 bg-gray-800/30'
              }
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleChange}
              accept=".js,.ts,.tsx,.jsx,.py,.java,.cs,.cpp,.c,.go,.rs,.php"
            />
            
            <Upload className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            
            <h3 className="text-xl font-semibold text-white mb-2">
              Datei hierher ziehen oder
            </h3>
            
            <label
              htmlFor="file-upload"
              className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-cyan-500/20 transition-all cursor-pointer"
            >
              Datei auswählen
            </label>
            
            <p className="text-sm text-gray-500 mt-4">
              Unterstützt: JS, TS, Python, Java, C#, C++, Go, Rust, PHP (max. 5MB)
            </p>
          </div>

          {/* Selected File */}
          {file && (
            <div className="mt-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileCode className="w-6 h-6 text-cyan-400" />
                <div>
                  <div className="text-white font-medium">{file.name}</div>
                  <div className="text-sm text-gray-400">
                    {(file.size / 1024).toFixed(2)} KB
                  </div>
                </div>
              </div>
              
              <button
                onClick={analyzeCode}
                disabled={analyzing}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-xl hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analysiere...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Mit AI Analysieren
                  </>
                )}
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 p-4 bg-red-900/20 border border-red-800 rounded-xl flex items-center gap-3">
              <XCircle className="w-6 h-6 text-red-400" />
              <div>
                <div className="text-red-300 font-medium">Fehler</div>
                <div className="text-red-400 text-sm">{error}</div>
              </div>
            </div>
          )}
        </div>

        {/* Analysis Result */}
        {result && (
          <div className="space-y-6">
            {/* Success Banner */}
            <div className="p-4 bg-green-900/20 border border-green-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-400" />
                <span className="text-green-300 font-medium">Analyse erfolgreich!</span>
              </div>
              <button
                onClick={saveAsDocument}
                className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700"
              >
                Als Dokument speichern
              </button>
            </div>

            {/* Overview */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Übersicht</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-400">Datei</div>
                  <div className="text-white font-medium">{result.fileName}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Sprache</div>
                  <div className="text-white font-medium">{result.language}</div>
                </div>
                {result.functions && (
                  <div>
                    <div className="text-sm text-gray-400">Funktionen</div>
                    <div className="text-white font-medium">{result.functions.length}</div>
                  </div>
                )}
                {result.complexity && (
                  <div>
                    <div className="text-sm text-gray-400">Komplexität</div>
                    <div className="text-white font-medium">{result.complexity}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Beschreibung</h2>
              <p className="text-gray-300 leading-relaxed">{result.description}</p>
            </div>

            {/* Functions */}
            {result.functions && result.functions.length > 0 && (
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-2xl p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Funktionen</h2>
                <div className="space-y-4">
                  {result.functions.map((func, index) => (
                    <div key={index} className="p-4 bg-gray-800/30 rounded-xl">
                      <div className="text-cyan-400 font-mono font-bold mb-2">{func.name}()</div>
                      <p className="text-gray-300 mb-2">{func.description}</p>
                      <div className="text-sm text-gray-400">
                        <span className="font-medium">Parameter:</span> {func.parameters?.join(', ') || 'Keine'}
                      </div>
                      <div className="text-sm text-gray-400">
                        <span className="font-medium">Rückgabe:</span> {func.returnType}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dependencies */}
            {result.dependencies && result.dependencies.length > 0 && (
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-2xl p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Dependencies</h2>
                <div className="flex flex-wrap gap-2">
                  {result.dependencies.map((dep, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-lg text-sm font-mono"
                    >
                      {dep}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations && result.recommendations.length > 0 && (
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-2xl p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Empfehlungen</h2>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="text-cyan-400 mt-1">•</span>
                      <span className="text-gray-300">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CodeAnalysisPage;