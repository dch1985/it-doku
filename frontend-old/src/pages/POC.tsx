import { useState, FormEvent } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface AnalysisResult {
  success: boolean;
  documentationId: string;
  analysis: {
    description: string;
    functions: Array<{
      name: string;
      parameters: string[];
      returns: string;
      description: string;
    }>;
    dependencies: string[];
    usageExamples?: string;
    mainPurpose: string;
  };
}

export default function POC() {
  const [code, setCode] = useState(`// Beispiel TypeScript Code
import express from 'express';
import jwt from 'jsonwebtoken';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

export const authenticateUser = (token: string): User | null => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as User;
    return decoded;
  } catch (error) {
    console.error('Authentication failed:', error);
    return null;
  }
};

export const generateToken = (user: User): string => {
  return jwt.sign(user, process.env.JWT_SECRET!, { expiresIn: '7d' });
};`);

  const [language, setLanguage] = useState('typescript');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const analyzeCode = async () => {
    if (!code.trim()) {
      setError('Bitte gib Code ein');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          filePath: `example.${language === 'typescript' ? 'ts' : 'js'}`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analyse fehlgeschlagen');
      }

      const result = await response.json();
      setAnalysisResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) throw new Error('Chat failed');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      const assistantId = Date.now().toString();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          assistantContent += decoder.decode(value);
          
          setMessages(prev => {
            const hasAssistant = prev[prev.length - 1]?.id === assistantId;
            if (hasAssistant) {
              return [...prev.slice(0, -1), {
                id: assistantId,
                role: 'assistant' as const,
                content: assistantContent,
              }];
            }
            return [...prev, {
              id: assistantId,
              role: 'assistant' as const,
              content: assistantContent,
            }];
          });
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      setError('Chat-Anfrage fehlgeschlagen');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🚀 KI-Dokumentations-Plattform - PoC
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Teste den End-to-End Flow: Code → AI-Analyse → Konversationelle Suche
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                1️⃣ Code Eingeben & Analysieren
              </h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sprache:
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="typescript">TypeScript</option>
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                </select>
              </div>

              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-64 p-3 border border-gray-300 dark:border-gray-600 rounded-md 
                         font-mono text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="// Füge deinen Code hier ein..."
              />

              <button
                onClick={analyzeCode}
                disabled={isAnalyzing || !code.trim()}
                className="mt-4 w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 
                         text-white font-medium rounded-md"
              >
                {isAnalyzing ? 'Analysiere...' : '🤖 Mit KI Analysieren'}
              </button>

              {error && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800 dark:text-red-200">❌ {error}</p>
                </div>
              )}

              {analysisResult && (
                <div className="mt-6 space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800">✅ Analyse erfolgreich!</p>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      📝 Beschreibung:
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {analysisResult.analysis.mainPurpose}
                    </p>
                  </div>

                  {analysisResult.analysis.functions.length > 0 && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        🔧 Funktionen:
                      </h3>
                      <ul className="space-y-2">
                        {analysisResult.analysis.functions.map((fn, idx) => (
                          <li key={idx} className="text-sm">
                            <code className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                              {fn.name}
                            </code>
                            <p className="ml-4 mt-1 text-gray-700 dark:text-gray-300">
                              {fn.description}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysisResult.analysis.dependencies.length > 0 && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        📦 Dependencies:
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.analysis.dependencies.map((dep, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-xs rounded-full"
                          >
                            {dep}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col h-[600px]">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                2️⃣ Dokumentation Durchsuchen
              </h2>

              <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-md">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <p>💬 Stelle Fragen zur analysierten Dokumentation</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-100 dark:bg-blue-900 ml-8'
                          : 'bg-white dark:bg-gray-800 mr-8'
                      }`}
                    >
                      <div className="text-xs font-semibold mb-1 text-gray-600">
                        {message.role === 'user' ? '👤 Du' : '🤖 KI'}
                      </div>
                      <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Stelle eine Frage..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 border rounded-md bg-white dark:bg-gray-700"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 
                           text-white rounded-md"
                >
                  Senden
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}