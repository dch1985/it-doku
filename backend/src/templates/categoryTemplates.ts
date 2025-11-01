/**
 * Category-based default templates
 * These are applied automatically when creating documents based on their category
 */

export interface CategoryTemplate {
  category: string
  title: string
  content: string
  structure?: any
}

/**
 * Default templates for each category
 */
export const categoryTemplates: Record<string, CategoryTemplate> = {
  DOCUMENTATION: {
    category: 'DOCUMENTATION',
    title: 'Dokumentation',
    content: `
<div class="doc-header" style="border-color: #3b82f6;">
  <h1>{{title}}</h1>
  <div class="doc-meta">
    <p><strong>Kategorie:</strong> {{category}}</p>
    <p><strong>Erstellt:</strong> {{createdDate}}</p>
    <p><strong>Version:</strong> {{version}}</p>
  </div>
</div>

<section>
  <h2>1. Übersicht</h2>
  <p>{{overview}}</p>
</section>

<section>
  <h2>2. Beschreibung</h2>
  <p>{{description}}</p>
</section>

<section>
  <h2>3. Anforderungen</h2>
  <ul>
    <li>{{requirement1}}</li>
    <li>{{requirement2}}</li>
    <li>{{requirement3}}</li>
  </ul>
</section>

<section>
  <h2>4. Implementierung</h2>
  <p>{{implementation}}</p>
</section>

<section>
  <h2>5. Test und Validierung</h2>
  <p>{{testing}}</p>
</section>

<section>
  <h2>6. Wartung</h2>
  <p>{{maintenance}}</p>
</section>
    `.trim(),
    structure: {
      sections: [
        { id: 'overview', title: 'Übersicht', order: 1 },
        { id: 'description', title: 'Beschreibung', order: 2 },
        { id: 'requirements', title: 'Anforderungen', order: 3 },
        { id: 'implementation', title: 'Implementierung', order: 4 },
        { id: 'testing', title: 'Test und Validierung', order: 5 },
        { id: 'maintenance', title: 'Wartung', order: 6 }
      ]
    }
  },

  CODE_ANALYSIS: {
    category: 'CODE_ANALYSIS',
    title: 'Code-Analyse',
    content: `
<div class="doc-header" style="border-color: #10b981;">
  <h1>{{title}}</h1>
  <div class="doc-meta">
    <p><strong>Kategorie:</strong> Code-Analyse</p>
    <p><strong>Analyse-Datum:</strong> {{createdDate}}</p>
    <p><strong>Version:</strong> {{version}}</p>
  </div>
</div>

<section>
  <h2>1. Code-Übersicht</h2>
  <table class="info-table">
    <tr>
      <td><strong>Dateiname:</strong></td>
      <td>{{filename}}</td>
    </tr>
    <tr>
      <td><strong>Sprache:</strong></td>
      <td>{{language}}</td>
    </tr>
    <tr>
      <td><strong>Zeilen:</strong></td>
      <td>{{lines}}</td>
    </tr>
    <tr>
      <td><strong>Komplexität:</strong></td>
      <td>{{complexity}}</td>
    </tr>
  </table>
</section>

<section>
  <h2>2. Qualitätsmetriken</h2>
  <p>{{metrics}}</p>
</section>

<section>
  <h2>3. Gefundene Probleme</h2>
  <ul>
    <li>{{issue1}}</li>
    <li>{{issue2}}</li>
  </ul>
</section>

<section>
  <h2>4. Empfehlungen</h2>
  <p>{{recommendations}}</p>
</section>
    `.trim(),
    structure: {
      sections: [
        { id: 'overview', title: 'Code-Übersicht', order: 1 },
        { id: 'metrics', title: 'Qualitätsmetriken', order: 2 },
        { id: 'issues', title: 'Gefundene Probleme', order: 3 },
        { id: 'recommendations', title: 'Empfehlungen', order: 4 }
      ]
    }
  },

  KNOWLEDGE_BASE: {
    category: 'KNOWLEDGE_BASE',
    title: 'Wissensbasis-Eintrag',
    content: `
<div class="doc-header" style="border-color: #8b5cf6;">
  <h1>{{title}}</h1>
  <div class="doc-meta">
    <p><strong>Kategorie:</strong> Wissensbasis</p>
    <p><strong>Erstellt:</strong> {{createdDate}}</p>
    <p><strong>Version:</strong> {{version}}</p>
  </div>
</div>

<section>
  <h2>Zusammenfassung</h2>
  <p>{{summary}}</p>
</section>

<section>
  <h2>Details</h2>
  <p>{{details}}</p>
</section>

<section>
  <h2>Verwandte Themen</h2>
  <ul>
    <li>{{related1}}</li>
    <li>{{related2}}</li>
  </ul>
</section>

<section>
  <h2>Quellen</h2>
  <p>{{sources}}</p>
</section>
    `.trim(),
    structure: {
      sections: [
        { id: 'summary', title: 'Zusammenfassung', order: 1 },
        { id: 'details', title: 'Details', order: 2 },
        { id: 'related', title: 'Verwandte Themen', order: 3 },
        { id: 'sources', title: 'Quellen', order: 4 }
      ]
    }
  },

  MEETING_NOTES: {
    category: 'MEETING_NOTES',
    title: 'Meeting-Notizen',
    content: `
<div class="doc-header" style="border-color: #f59e0b;">
  <h1>{{title}}</h1>
  <div class="doc-meta">
    <p><strong>Kategorie:</strong> Meeting-Notizen</p>
    <p><strong>Datum:</strong> {{meetingDate}}</p>
    <p><strong>Version:</strong> {{version}}</p>
  </div>
</div>

<section>
  <h2>Meeting-Informationen</h2>
  <table class="info-table">
    <tr>
      <td><strong>Datum:</strong></td>
      <td>{{meetingDate}}</td>
    </tr>
    <tr>
      <td><strong>Uhrzeit:</strong></td>
      <td>{{meetingTime}}</td>
    </tr>
    <tr>
      <td><strong>Ort:</strong></td>
      <td>{{location}}</td>
    </tr>
    <tr>
      <td><strong>Teilnehmer:</strong></td>
      <td>{{participants}}</td>
    </tr>
  </table>
</section>

<section>
  <h2>Agenda</h2>
  <ol>
    <li>{{agendaItem1}}</li>
    <li>{{agendaItem2}}</li>
    <li>{{agendaItem3}}</li>
  </ol>
</section>

<section>
  <h2>Diskussionspunkte</h2>
  <p>{{discussion}}</p>
</section>

<section>
  <h2>Entscheidungen</h2>
  <ul>
    <li>{{decision1}}</li>
    <li>{{decision2}}</li>
  </ul>
</section>

<section>
  <h2>Action Items</h2>
  <ul>
    <li>{{actionItem1}} - <strong>Verantwortlich:</strong> {{owner1}}</li>
    <li>{{actionItem2}} - <strong>Verantwortlich:</strong> {{owner2}}</li>
  </ul>
</section>

<section>
  <h2>Nächstes Meeting</h2>
  <p>{{nextMeeting}}</p>
</section>
    `.trim(),
    structure: {
      sections: [
        { id: 'info', title: 'Meeting-Informationen', order: 1 },
        { id: 'agenda', title: 'Agenda', order: 2 },
        { id: 'discussion', title: 'Diskussionspunkte', order: 3 },
        { id: 'decisions', title: 'Entscheidungen', order: 4 },
        { id: 'actions', title: 'Action Items', order: 5 },
        { id: 'next', title: 'Nächstes Meeting', order: 6 }
      ]
    }
  },

  TUTORIAL: {
    category: 'TUTORIAL',
    title: 'Tutorial',
    content: `
<div class="doc-header" style="border-color: #ec4899;">
  <h1>{{title}}</h1>
  <div class="doc-meta">
    <p><strong>Kategorie:</strong> Tutorial</p>
    <p><strong>Erstellt:</strong> {{createdDate}}</p>
    <p><strong>Version:</strong> {{version}}</p>
  </div>
</div>

<section>
  <h2>Überblick</h2>
  <p>{{overview}}</p>
</section>

<section>
  <h2>Voraussetzungen</h2>
  <ul>
    <li>{{prerequisite1}}</li>
    <li>{{prerequisite2}}</li>
  </ul>
</section>

<section>
  <h2>Schritt-für-Schritt Anleitung</h2>
  
  <h3>Schritt 1: {{step1Title}}</h3>
  <p>{{step1Description}}</p>
  <pre><code>{{step1Code}}</code></pre>
  
  <h3>Schritt 2: {{step2Title}}</h3>
  <p>{{step2Description}}</p>
  <pre><code>{{step2Code}}</code></pre>
  
  <h3>Schritt 3: {{step3Title}}</h3>
  <p>{{step3Description}}</p>
  <pre><code>{{step3Code}}</code></pre>
</section>

<section>
  <h2>Zusammenfassung</h2>
  <p>{{summary}}</p>
</section>

<section>
  <h2>Weiterführende Informationen</h2>
  <p>{{additionalInfo}}</p>
</section>
    `.trim(),
    structure: {
      sections: [
        { id: 'overview', title: 'Überblick', order: 1 },
        { id: 'prerequisites', title: 'Voraussetzungen', order: 2 },
        { id: 'steps', title: 'Schritt-für-Schritt Anleitung', order: 3 },
        { id: 'summary', title: 'Zusammenfassung', order: 4 },
        { id: 'additional', title: 'Weiterführende Informationen', order: 5 }
      ]
    }
  },

  API_SPEC: {
    category: 'API_SPEC',
    title: 'API-Spezifikation',
    content: `
<div class="doc-header" style="border-color: #06b6d4;">
  <h1>{{title}}</h1>
  <div class="doc-meta">
    <p><strong>Kategorie:</strong> API-Spezifikation</p>
    <p><strong>Erstellt:</strong> {{createdDate}}</p>
    <p><strong>Version:</strong> {{version}}</p>
  </div>
</div>

<section>
  <h2>1. API-Übersicht</h2>
  <table class="info-table">
    <tr>
      <td><strong>Base URL:</strong></td>
      <td>{{baseUrl}}</td>
    </tr>
    <tr>
      <td><strong>Version:</strong></td>
      <td>{{apiVersion}}</td>
    </tr>
    <tr>
      <td><strong>Protokoll:</strong></td>
      <td>{{protocol}}</td>
    </tr>
    <tr>
      <td><strong>Authentifizierung:</strong></td>
      <td>{{authentication}}</td>
    </tr>
  </table>
</section>

<section>
  <h2>2. Endpoints</h2>
  
  <h3>2.1 {{endpoint1Name}}</h3>
  <table class="info-table">
    <tr>
      <td><strong>Method:</strong></td>
      <td>{{endpoint1Method}}</td>
    </tr>
    <tr>
      <td><strong>URL:</strong></td>
      <td>{{endpoint1Url}}</td>
    </tr>
    <tr>
      <td><strong>Beschreibung:</strong></td>
      <td>{{endpoint1Description}}</td>
    </tr>
  </table>
  
  <h4>Request</h4>
  <pre><code>{{endpoint1Request}}</code></pre>
  
  <h4>Response</h4>
  <pre><code>{{endpoint1Response}}</code></pre>
</section>

<section>
  <h2>3. Fehlerbehandlung</h2>
  <p>{{errorHandling}}</p>
</section>

<section>
  <h2>4. Beispiele</h2>
  <pre><code>{{examples}}</code></pre>
</section>
    `.trim(),
    structure: {
      sections: [
        { id: 'overview', title: 'API-Übersicht', order: 1 },
        { id: 'endpoints', title: 'Endpoints', order: 2 },
        { id: 'errors', title: 'Fehlerbehandlung', order: 3 },
        { id: 'examples', title: 'Beispiele', order: 4 }
      ]
    }
  }
}

/**
 * Get template for a category
 */
export function getCategoryTemplate(category: string): CategoryTemplate | null {
  return categoryTemplates[category] || null
}

/**
 * Apply template to content with replacements
 */
export function applyCategoryTemplate(template: CategoryTemplate, title: string, customFields?: Record<string, any>): string {
  let content = template.content
  
  // Replace title
  content = content.replace(/\{\{title\}\}/g, title)
  
  // Replace dates
  const now = new Date().toLocaleDateString('de-DE')
  content = content.replace(/\{\{createdDate\}\}/g, now)
  content = content.replace(/\{\{updatedDate\}\}/g, now)
  
  // Replace version
  content = content.replace(/\{\{version\}\}/g, '1.0')
  
  // Replace category
  content = content.replace(/\{\{category\}\}/g, template.category)
  
  // Replace custom fields if provided
  if (customFields && typeof customFields === 'object') {
    Object.entries(customFields).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`
      content = content.replace(new RegExp(placeholder, 'g'), String(value || ''))
    })
  }
  
  // Replace remaining placeholders with styled fill-in text
  content = content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    // Keep some structural placeholders, but replace others
    const structuralPlaceholders = ['createdDate', 'updatedDate', 'version', 'title', 'category']
    if (structuralPlaceholders.includes(key)) {
      return match // Keep if not replaced above
    }
    return '<span class="placeholder-text" style="color: #9ca3af; font-style: italic;">[Bitte ausfüllen]</span>'
  })
  
  return content
}

