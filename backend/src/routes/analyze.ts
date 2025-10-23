import { Router } from 'express';
import { AzureOpenAI } from 'openai';

const router = Router();

const azureClient = new AzureOpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  apiVersion: '2024-02-01',
  deployment: process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4',
});

router.post('/code', async (req, res) => {
  try {
    const { fileName, code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code ist erforderlich' });
    }

    console.log('[Code Analysis] Analyzing:', fileName);

    const prompt = `Analysiere den folgenden Code und erstelle eine detaillierte Dokumentation im JSON-Format:

DATEINAME: ${fileName}

CODE:
\`\`\`
${code}
\`\`\`

Erstelle eine JSON-Antwort mit folgender Struktur:
{
  "fileName": "${fileName}",
  "language": "Programmiersprache (z.B. TypeScript, Python, etc.)",
  "description": "Detaillierte Beschreibung was der Code macht (2-3 Sätze)",
  "functions": [
    {
      "name": "Funktionsname",
      "description": "Was die Funktion macht",
      "parameters": ["param1", "param2"],
      "returnType": "Rückgabetyp"
    }
  ],
  "dependencies": ["Liste der verwendeten Bibliotheken/Imports"],
  "usageExamples": "Verwendungsbeispiele",
  "complexity": "Niedrig/Mittel/Hoch",
  "recommendations": ["Verbesserungsvorschläge"]
}

WICHTIG: Antworte NUR mit dem JSON-Objekt, ohne zusätzlichen Text oder Markdown.`;

    const completion = await azureClient.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Du bist ein Experte für Code-Analyse und Dokumentation. Antworte immer nur mit validen JSON-Objekten ohne zusätzlichen Text.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0]?.message?.content || '';
    
    let cleanedResponse = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const analysisResult = JSON.parse(cleanedResponse);

    console.log('[Code Analysis] Success!');
    res.json(analysisResult);

  } catch (error) {
    console.error('[Code Analysis] Error:', error);
    
    res.status(500).json({ 
      error: 'Code-Analyse fehlgeschlagen',
      details: error instanceof Error ? error.message : 'Unbekannter Fehler'
    });
  }
});

export default router;