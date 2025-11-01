/**
 * State-of-the-Art Template Definitions
 * Nach NIST SP 800-123, ISO 27001, und Best Practices
 */

export interface TemplateDefinition {
  name: string;
  description: string;
  category: string;
  content: string;
  structure: object;
  isGlobal: boolean;
  isNistCompliant: boolean;
  nistFramework?: string;
  tags: string[];
}

/**
 * Server-Dokumentation (NIST SP 800-123)
 * Vollständige Server-Dokumentation nach Best Practices
 */
export const serverTemplate: TemplateDefinition = {
  name: 'Server-Dokumentation (NIST SP 800-123)',
  description: 'Standardisierte Serversystem-Dokumentation nach NIST SP 800-123 Richtlinien. Deckt alle kritischen Aspekte ab: Hardware, Software, Netzwerk, Sicherheit, Backup und Monitoring.',
  category: 'DOCUMENTATION',
  content: `<div class="template-document">
  <header class="doc-header">
    <h1>Server-Dokumentation</h1>
    <p class="metadata"><strong>Erstellt:</strong> {{createdDate}} | <strong>Zuletzt aktualisiert:</strong> {{updatedDate}}</p>
  </header>

  <section id="basic-info">
    <h2>1. Basis-Informationen</h2>
    <table class="info-table">
      <tr><td><strong>Hostname:</strong></td><td>{{hostname}}</td></tr>
      <tr><td><strong>IP-Adresse:</strong></td><td>{{ipAddress}}</td></tr>
      <tr><td><strong>Standort:</strong></td><td>{{location}}</td></tr>
      <tr><td><strong>Umgebung:</strong></td><td>{{environment}}</td></tr>
      <tr><td><strong>Verantwortlicher:</strong></td><td>{{owner}}</td></tr>
      <tr><td><strong>Administrator-Kontakt:</strong></td><td>{{adminContact}}</td></tr>
    </table>
  </section>

  <section id="hardware">
    <h2>2. Hardware-Spezifikationen</h2>
    <h3>CPU</h3>
    <ul>
      <li><strong>Modell:</strong> {{cpu}}</li>
      <li><strong>Kerne:</strong> {{cpuCores}}</li>
      <li><strong>Taktfrequenz:</strong> {{cpuFrequency}}</li>
    </ul>
    <h3>Arbeitsspeicher</h3>
    <ul>
      <li><strong>RAM:</strong> {{ramGb}} GB</li>
      <li><strong>Typ:</strong> {{ramType}}</li>
    </ul>
    <h3>Speicher-Konfiguration</h3>
    <p>{{storageConfig}}</p>
  </section>

  <section id="software">
    <h2>3. Software & Betriebssystem</h2>
    <table class="info-table">
      <tr><td><strong>Betriebssystem:</strong></td><td>{{operatingSystem}}</td></tr>
      <tr><td><strong>Version:</strong></td><td>{{osVersion}}</td></tr>
      <tr><td><strong>Patch-Level:</strong></td><td>{{patchLevel}}</td></tr>
      <tr><td><strong>Letztes Update:</strong></td><td>{{lastUpdate}}</td></tr>
    </table>
    <h3>Installierte Software</h3>
    <p>{{installedSoftware}}</p>
  </section>

  <section id="services">
    <h2>4. Dienste & Rollen</h2>
    <h3>Server-Rolle(n)</h3>
    <ul>{{serverRole}}</ul>
    <h3>Laufende Dienste</h3>
    <p>{{services}}</p>
    <h3>Ports & Schnittstellen</h3>
    <p>{{portsAndInterfaces}}</p>
  </section>

  <section id="network">
    <h2>5. Netzwerk-Konfiguration</h2>
    <table class="info-table">
      <tr><td><strong>Subnetz:</strong></td><td>{{subnet}}</td></tr>
      <tr><td><strong>Gateway:</strong></td><td>{{gateway}}</td></tr>
      <tr><td><strong>DNS-Server:</strong></td><td>{{dnsServers}}</td></tr>
      <tr><td><strong>VLAN-ID:</strong></td><td>{{vlan}}</td></tr>
    </table>
    <h3>Netzwerk-Interfaces</h3>
    <p>{{networkInterfaces}}</p>
  </section>

  <section id="security">
    <h2>6. Sicherheitskonfiguration</h2>
    <h3>Firewall</h3>
    <ul>
      <li><strong>Firewall aktiviert:</strong> {{firewallEnabled}}</li>
      <li><strong>Firewall-Regeln:</strong> {{firewallRules}}</li>
    </ul>
    <h3>Antivirus</h3>
    <p><strong>Antivirus-Software:</strong> {{antivirus}}</p>
    <h3>Verschlüsselung</h3>
    <p><strong>Verschlüsselung:</strong> {{encryption}}</p>
    <h3>Authentifizierung</h3>
    <p><strong>Authentifizierungsmethode:</strong> {{authentication}}</p>
    <h3>Zugriffskontrollen</h3>
    <p>{{accessControls}}</p>
  </section>

  <section id="backup">
    <h2>7. Backup-Konfiguration</h2>
    <table class="info-table">
      <tr><td><strong>Backup aktiviert:</strong></td><td>{{backupEnabled}}</td></tr>
      <tr><td><strong>Backup-Typ:</strong></td><td>{{backupType}}</td></tr>
      <tr><td><strong>Backup-Zeitplan:</strong></td><td>{{backupSchedule}}</td></tr>
      <tr><td><strong>Aufbewahrungsdauer:</strong></td><td>{{backupRetention}}</td></tr>
      <tr><td><strong>Backup-Speicherort:</strong></td><td>{{backupLocation}}</td></tr>
      <tr><td><strong>RPO (Recovery Point Objective):</strong></td><td>{{rpo}}</td></tr>
      <tr><td><strong>RTO (Recovery Time Objective):</strong></td><td>{{rto}}</td></tr>
    </table>
    <h3>Backup-Testverfahren</h3>
    <p>{{backupTestProcedure}}</p>
  </section>

  <section id="monitoring">
    <h2>8. Monitoring & Überwachung</h2>
    <table class="info-table">
      <tr><td><strong>Monitoring aktiviert:</strong></td><td>{{monitoringEnabled}}</td></tr>
      <tr><td><strong>Monitoring-Tool:</strong></td><td>{{monitoringTool}}</td></tr>
    </table>
    <h3>Überwachte Metriken</h3>
    <p>{{monitoredMetrics}}</p>
    <h3>Alarm-Schwellwerte</h3>
    <p>{{alertThresholds}}</p>
    <h3>Eskalationsverfahren</h3>
    <p>{{escalationProcedure}}</p>
  </section>

  <section id="documentation">
    <h2>9. Zusätzliche Dokumentation</h2>
    <h3>Change Log</h3>
    <p>{{changeLog}}</p>
    <h3>Notizen & Besonderheiten</h3>
    <p>{{notes}}</p>
    <h3>Verknüpfte Dokumentation</h3>
    <p>{{relatedDocs}}</p>
  </section>
</div>

<style>
.template-document { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
.doc-header { border-bottom: 3px solid #2563eb; padding-bottom: 1rem; margin-bottom: 2rem; }
.doc-header h1 { color: #1e40af; margin: 0; }
.metadata { color: #666; font-size: 0.9rem; }
section { margin-bottom: 3rem; }
h2 { color: #1e40af; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; margin-top: 2rem; }
h3 { color: #374151; margin-top: 1.5rem; }
.info-table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
.info-table td { padding: 0.75rem; border-bottom: 1px solid #e5e7eb; }
.info-table td:first-child { font-weight: 600; width: 35%; background-color: #f9fafb; }
ul { margin: 1rem 0; padding-left: 2rem; }
</style>`,
  structure: {
    sections: [
      { id: 'basic-info', title: 'Basis-Informationen', order: 1 },
      { id: 'hardware', title: 'Hardware-Spezifikationen', order: 2 },
      { id: 'software', title: 'Software & Betriebssystem', order: 3 },
      { id: 'services', title: 'Dienste & Rollen', order: 4 },
      { id: 'network', title: 'Netzwerk-Konfiguration', order: 5 },
      { id: 'security', title: 'Sicherheitskonfiguration', order: 6 },
      { id: 'backup', title: 'Backup-Konfiguration', order: 7 },
      { id: 'monitoring', title: 'Monitoring & Überwachung', order: 8 },
      { id: 'documentation', title: 'Zusätzliche Dokumentation', order: 9 }
    ],
    fields: [
      { id: 'hostname', label: 'Hostname', type: 'text', required: true },
      { id: 'ipAddress', label: 'IP-Adresse', type: 'text', required: true },
      { id: 'location', label: 'Standort', type: 'text', required: true },
      { id: 'environment', label: 'Umgebung', type: 'select', required: true }
    ]
  },
  isGlobal: true,
  isNistCompliant: true,
  nistFramework: 'NIST SP 800-123',
  tags: ['server', 'infrastructure', 'nist', 'hardware', 'software']
};

/**
 * Netzwerk-Dokumentation (ISO 27001)
 */
export const networkTemplate: TemplateDefinition = {
  name: 'Netzwerk-Dokumentation (ISO 27001)',
  description: 'Umfassende Netzwerk-Dokumentation nach ISO 27001 Standards. Enthält Topologie, IP-Adressierung, VLANs, Routing, Firewall-Regeln und Sicherheitsrichtlinien.',
  category: 'DOCUMENTATION',
  content: `<div class="template-document">
  <header class="doc-header">
    <h1>Netzwerk-Dokumentation</h1>
    <p class="metadata"><strong>Erstellt:</strong> {{createdDate}} | <strong>Version:</strong> {{version}}</p>
  </header>

  <section id="basic-info">
    <h2>1. Netzwerk-Basis</h2>
    <table class="info-table">
      <tr><td><strong>Netzwerk-Name:</strong></td><td>{{networkName}}</td></tr>
      <tr><td><strong>Netzwerk-Typ:</strong></td><td>{{networkType}}</td></tr>
      <tr><td><strong>Standort:</strong></td><td>{{location}}</td></tr>
      <tr><td><strong>Verantwortlicher:</strong></td><td>{{owner}}</td></tr>
      <tr><td><strong>Kontakt:</strong></td><td>{{contact}}</td></tr>
    </table>
  </section>

  <section id="topology">
    <h2>2. Netzwerk-Topologie</h2>
    <h3>Topologie-Typ</h3>
    <p><strong>{{topologyType}}</strong></p>
    <h3>Topologie-Diagramm</h3>
    <p>{{topologyDiagram}}</p>
    <h3>Beschreibung</h3>
    <p>{{topologyDescription}}</p>
  </section>

  <section id="addressing">
    <h2>3. IP-Adressierung</h2>
    <table class="info-table">
      <tr><td><strong>IP-Bereich:</strong></td><td>{{ipRange}}</td></tr>
      <tr><td><strong>Subnetzmaske:</strong></td><td>{{subnetMask}}</td></tr>
      <tr><td><strong>Gateway:</strong></td><td>{{gateway}}</td></tr>
      <tr><td><strong>DNS-Server:</strong></td><td>{{dnsServers}}</td></tr>
      <tr><td><strong>DHCP-Server:</strong></td><td>{{dhcpServer}}</td></tr>
    </table>
    <h3>VLAN-Konfiguration</h3>
    <p>{{vlanConfig}}</p>
    <h3>Statische IP-Adressen</h3>
    <p>{{staticIPs}}</p>
  </section>

  <section id="devices">
    <h2>4. Netzwerk-Geräte</h2>
    <h3>Router</h3>
    <p>{{routers}}</p>
    <h3>Switches</h3>
    <p>{{switches}}</p>
    <h3>Firewalls</h3>
    <p>{{firewalls}}</p>
    <h3>Access Points</h3>
    <p>{{accessPoints}}</p>
    <h3>Weitere Geräte</h3>
    <p>{{otherDevices}}</p>
  </section>

  <section id="security">
    <h2>5. Sicherheitskonfiguration</h2>
    <h3>Firewall-Regeln</h3>
    <p>{{firewallRules}}</p>
    <h3>Zugriffskontrollen</h3>
    <p>{{accessControls}}</p>
    <h3>Verschlüsselung</h3>
    <p>{{encryption}}</p>
    <h3>VPN-Konfiguration</h3>
    <p>{{vpnConfig}}</p>
    <h3>Intrusion Detection</h3>
    <p>{{intrusionDetection}}</p>
  </section>

  <section id="routing">
    <h2>6. Routing</h2>
    <h3>Routing-Protokoll</h3>
    <p>{{routingProtocol}}</p>
    <h3>Routing-Tabelle</h3>
    <p>{{routingTable}}</p>
    <h3>Standard-Route</h3>
    <p>{{defaultRoute}}</p>
  </section>

  <section id="monitoring">
    <h2>7. Monitoring & Wartung</h2>
    <table class="info-table">
      <tr><td><strong>Monitoring-Tool:</strong></td><td>{{monitoringTool}}</td></tr>
      <tr><td><strong>Überwachte Metriken:</strong></td><td>{{monitoredMetrics}}</td></tr>
    </table>
    <h3>Wartungsfenster</h3>
    <p>{{maintenanceWindows}}</p>
    <h3>Change Management</h3>
    <p>{{changeManagement}}</p>
  </section>

  <section id="documentation">
    <h2>8. Zusätzliche Dokumentation</h2>
    <h3>Notizen</h3>
    <p>{{notes}}</p>
    <h3>Verknüpfte Dokumentation</h3>
    <p>{{relatedDocs}}</p>
  </section>
</div>

<style>
.template-document { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
.doc-header { border-bottom: 3px solid #2563eb; padding-bottom: 1rem; margin-bottom: 2rem; }
.doc-header h1 { color: #1e40af; margin: 0; }
.metadata { color: #666; font-size: 0.9rem; }
section { margin-bottom: 3rem; }
h2 { color: #1e40af; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; margin-top: 2rem; }
h3 { color: #374151; margin-top: 1.5rem; }
.info-table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
.info-table td { padding: 0.75rem; border-bottom: 1px solid #e5e7eb; }
.info-table td:first-child { font-weight: 600; width: 35%; background-color: #f9fafb; }
ul { margin: 1rem 0; padding-left: 2rem; }
</style>`,
  structure: {
    sections: [
      { id: 'basic-info', title: 'Netzwerk-Basis', order: 1 },
      { id: 'topology', title: 'Netzwerk-Topologie', order: 2 },
      { id: 'addressing', title: 'IP-Adressierung', order: 3 },
      { id: 'devices', title: 'Netzwerk-Geräte', order: 4 },
      { id: 'security', title: 'Sicherheitskonfiguration', order: 5 },
      { id: 'routing', title: 'Routing', order: 6 },
      { id: 'monitoring', title: 'Monitoring & Wartung', order: 7 },
      { id: 'documentation', title: 'Zusätzliche Dokumentation', order: 8 }
    ]
  },
  isGlobal: true,
  isNistCompliant: true,
  nistFramework: 'ISO 27001',
  tags: ['network', 'topology', 'iso', 'infrastructure']
};

/**
 * Backup-Strategie Template
 */
export const backupTemplate: TemplateDefinition = {
  name: 'Backup-Strategie & Disaster Recovery',
  description: 'Umfassende Backup-Strategie und Disaster Recovery Planung nach Best Practices. Enthält Strategie, Zeitplan, Retention, RTO/RPO und Testverfahren.',
  category: 'DOCUMENTATION',
  content: `<div class="template-document">
  <header class="doc-header">
    <h1>Backup-Strategie & Disaster Recovery</h1>
    <p class="metadata"><strong>Erstellt:</strong> {{createdDate}} | <strong>Version:</strong> {{version}}</p>
  </header>

  <section id="overview">
    <h2>1. Übersicht</h2>
    <table class="info-table">
      <tr><td><strong>System/Anwendung:</strong></td><td>{{systemName}}</td></tr>
      <tr><td><strong>Verantwortlicher:</strong></td><td>{{owner}}</td></tr>
      <tr><td><strong>Kontakt:</strong></td><td>{{contact}}</td></tr>
      <tr><td><strong>Kritikalität:</strong></td><td>{{criticality}}</td></tr>
    </table>
  </section>

  <section id="strategy">
    <h2>2. Backup-Strategie</h2>
    <h3>Backup-Typen</h3>
    <p>{{backupTypes}}</p>
    <h3>Strategie-Übersicht</h3>
    <p>{{strategyOverview}}</p>
    <h3>Backup-Methodik</h3>
    <p>{{backupMethodology}}</p>
  </section>

  <section id="schedule">
    <h2>3. Backup-Zeitplan</h2>
    <table class="info-table">
      <tr><td><strong>Vollständiges Backup:</strong></td><td>{{fullBackupSchedule}}</td></tr>
      <tr><td><strong>Inkrementelles Backup:</strong></td><td>{{incrementalBackupSchedule}}</td></tr>
      <tr><td><strong>Differenzielles Backup:</strong></td><td>{{differentialBackupSchedule}}</td></tr>
    </table>
    <h3>Backup-Fenster</h3>
    <p>{{backupWindows}}</p>
  </section>

  <section id="retention">
    <h2>4. Aufbewahrungsrichtlinie</h2>
    <table class="info-table">
      <tr><td><strong>Tägliche Backups:</strong></td><td>{{dailyRetention}}</td></tr>
      <tr><td><strong>Wöchentliche Backups:</strong></td><td>{{weeklyRetention}}</td></tr>
      <tr><td><strong>Monatliche Backups:</strong></td><td>{{monthlyRetention}}</td></tr>
      <tr><td><strong>Jährliche Backups:</strong></td><td>{{yearlyRetention}}</td></tr>
    </table>
  </section>

  <section id="objectives">
    <h2>5. Recovery Objectives</h2>
    <table class="info-table">
      <tr><td><strong>RPO (Recovery Point Objective):</strong></td><td>{{rpo}}</td></tr>
      <tr><td><strong>RTO (Recovery Time Objective):</strong></td><td>{{rto}}</td></tr>
      <tr><td><strong>Maximaler Datenverlust:</strong></td><td>{{maxDataLoss}}</td></tr>
      <tr><td><strong>Maximale Ausfallzeit:</strong></td><td>{{maxDowntime}}</td></tr>
    </table>
  </section>

  <section id="storage">
    <h2>6. Backup-Speicherung</h2>
    <h3>Primärer Speicherort</h3>
    <p>{{primaryStorage}}</p>
    <h3>Sekundärer Speicherort (Offsite)</h3>
    <p>{{offsiteStorage}}</p>
    <h3>Cloud-Backup</h3>
    <p>{{cloudBackup}}</p>
    <h3>Verschlüsselung</h3>
    <p>{{encryption}}</p>
  </section>

  <section id="procedures">
    <h2>7. Wiederherstellungsverfahren</h2>
    <h3>Vollständige Systemwiederherstellung</h3>
    <ol>{{fullRestoreProcedure}}</ol>
    <h3>Datei-Wiederherstellung</h3>
    <ol>{{fileRestoreProcedure}}</ol>
    <h3>Notfall-Wiederherstellung</h3>
    <ol>{{emergencyRestoreProcedure}}</ol>
  </section>

  <section id="testing">
    <h2>8. Backup-Testverfahren</h2>
    <h3>Test-Zeitplan</h3>
    <p>{{testSchedule}}</p>
    <h3>Test-Prozedur</h3>
    <ol>{{testProcedure}}</ol>
    <h3>Letzter Test</h3>
    <p>{{lastTest}}</p>
    <h3>Test-Ergebnisse</h3>
    <p>{{testResults}}</p>
  </section>

  <section id="monitoring">
    <h2>9. Monitoring & Alerting</h2>
    <table class="info-table">
      <tr><td><strong>Monitoring-Tool:</strong></td><td>{{monitoringTool}}</td></tr>
      <tr><td><strong>Alerts:</strong></td><td>{{alerts}}</td></tr>
    </table>
    <h3>Überwachte Metriken</h3>
    <p>{{monitoredMetrics}}</p>
  </section>
</div>

<style>
.template-document { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
.doc-header { border-bottom: 3px solid #10b981; padding-bottom: 1rem; margin-bottom: 2rem; }
.doc-header h1 { color: #059669; margin: 0; }
.metadata { color: #666; font-size: 0.9rem; }
section { margin-bottom: 3rem; }
h2 { color: #059669; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; margin-top: 2rem; }
h3 { color: #374151; margin-top: 1.5rem; }
.info-table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
.info-table td { padding: 0.75rem; border-bottom: 1px solid #e5e7eb; }
.info-table td:first-child { font-weight: 600; width: 35%; background-color: #f9fafb; }
ol { margin: 1rem 0; padding-left: 2rem; }
</style>`,
  structure: {
    sections: [
      { id: 'overview', title: 'Übersicht', order: 1 },
      { id: 'strategy', title: 'Backup-Strategie', order: 2 },
      { id: 'schedule', title: 'Backup-Zeitplan', order: 3 },
      { id: 'retention', title: 'Aufbewahrungsrichtlinie', order: 4 },
      { id: 'objectives', title: 'Recovery Objectives', order: 5 },
      { id: 'storage', title: 'Backup-Speicherung', order: 6 },
      { id: 'procedures', title: 'Wiederherstellungsverfahren', order: 7 },
      { id: 'testing', title: 'Backup-Testverfahren', order: 8 },
      { id: 'monitoring', title: 'Monitoring & Alerting', order: 9 }
    ]
  },
  isGlobal: true,
  isNistCompliant: false,
  tags: ['backup', 'disaster-recovery', 'operations', 'strategy']
};

/**
 * Runbook Template
 */
export const runbookTemplate: TemplateDefinition = {
  name: 'Runbook - Operative Verfahren',
  description: 'Schritt-für-Schritt Anleitungen für operative Aufgaben, Wartungen und Troubleshooting-Prozeduren.',
  category: 'DOCUMENTATION',
  content: `<div class="template-document">
  <header class="doc-header">
    <h1>Runbook: {{procedureName}}</h1>
    <p class="metadata"><strong>Erstellt:</strong> {{createdDate}} | <strong>Version:</strong> {{version}} | <strong>Verantwortlich:</strong> {{owner}}</p>
  </header>

  <section id="overview">
    <h2>1. Übersicht</h2>
    <table class="info-table">
      <tr><td><strong>Verfahren:</strong></td><td>{{procedureName}}</td></tr>
      <tr><td><strong>Zweck:</strong></td><td>{{purpose}}</td></tr>
      <tr><td><strong>Kategorie:</strong></td><td>{{category}}</td></tr>
      <tr><td><strong>Geschätzter Zeitaufwand:</strong></td><td>{{estimatedTime}}</td></tr>
      <tr><td><strong>Ausführungshäufigkeit:</strong></td><td>{{frequency}}</td></tr>
    </table>
  </section>

  <section id="prerequisites">
    <h2>2. Voraussetzungen</h2>
    <h3>Erforderliche Berechtigungen</h3>
    <ul>{{requiredPermissions}}</ul>
    <h3>Erforderliche Tools/Software</h3>
    <ul>{{requiredTools}}</ul>
    <h3>Erforderliche Zugriffe</h3>
    <ul>{{requiredAccess}}</ul>
    <h3>Vorbedingungen</h3>
    <p>{{prerequisites}}</p>
  </section>

  <section id="steps">
    <h2>3. Verfahrensschritte</h2>
    <h3>Schritt 1: {{step1Title}}</h3>
    <p>{{step1Description}}</p>
    <pre>{{step1Commands}}</pre>
    <p><strong>Erwartetes Ergebnis:</strong> {{step1ExpectedResult}}</p>

    <h3>Schritt 2: {{step2Title}}</h3>
    <p>{{step2Description}}</p>
    <pre>{{step2Commands}}</pre>
    <p><strong>Erwartetes Ergebnis:</strong> {{step2ExpectedResult}}</p>

    <h3>Weitere Schritte</h3>
    <p>{{additionalSteps}}</p>
  </section>

  <section id="verification">
    <h2>4. Verifizierung</h2>
    <h3>Erfolgskriterien</h3>
    <ul>{{successCriteria}}</ul>
    <h3>Verifizierungsschritte</h3>
    <ol>{{verificationSteps}}</ol>
    <h3>Rollback-Kriterien</h3>
    <p>{{rollbackCriteria}}</p>
  </section>

  <section id="troubleshooting">
    <h2>5. Fehlerbehebung</h2>
    <h3>Häufige Probleme</h3>
    <table class="info-table">
      <tr><th>Problem</th><th>Lösung</th></tr>
      <tr><td>{{problem1}}</td><td>{{solution1}}</td></tr>
      <tr><td>{{problem2}}</td><td>{{solution2}}</td></tr>
    </table>
    <h3>Eskalationspfad</h3>
    <p>{{escalationPath}}</p>
  </section>

  <section id="rollback">
    <h2>6. Rollback-Verfahren</h2>
    <h3>Wann Rollback durchführen?</h3>
    <p>{{rollbackConditions}}</p>
    <h3>Rollback-Schritte</h3>
    <ol>{{rollbackSteps}}</ol>
  </section>

  <section id="contacts">
    <h2>7. Kontakte & Eskalation</h2>
    <table class="info-table">
      <tr><td><strong>Primärer Kontakt:</strong></td><td>{{primaryContact}}</td></tr>
      <tr><td><strong>Sekundärer Kontakt:</strong></td><td>{{secondaryContact}}</td></tr>
      <tr><td><strong>Notfall-Kontakt:</strong></td><td>{{emergencyContact}}</td></tr>
    </table>
  </section>
</div>

<style>
.template-document { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
.doc-header { border-bottom: 3px solid #f59e0b; padding-bottom: 1rem; margin-bottom: 2rem; }
.doc-header h1 { color: #d97706; margin: 0; }
.metadata { color: #666; font-size: 0.9rem; }
section { margin-bottom: 3rem; }
h2 { color: #d97706; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; margin-top: 2rem; }
h3 { color: #374151; margin-top: 1.5rem; }
.info-table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
.info-table td, .info-table th { padding: 0.75rem; border-bottom: 1px solid #e5e7eb; }
.info-table td:first-child, .info-table th:first-child { font-weight: 600; width: 35%; background-color: #f9fafb; }
.info-table th { background-color: #f3f4f6; }
pre { background-color: #f9fafb; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; }
ol, ul { margin: 1rem 0; padding-left: 2rem; }
</style>`,
  structure: {
    sections: [
      { id: 'overview', title: 'Übersicht', order: 1 },
      { id: 'prerequisites', title: 'Voraussetzungen', order: 2 },
      { id: 'steps', title: 'Verfahrensschritte', order: 3 },
      { id: 'verification', title: 'Verifizierung', order: 4 },
      { id: 'troubleshooting', title: 'Fehlerbehebung', order: 5 },
      { id: 'rollback', title: 'Rollback-Verfahren', order: 6 },
      { id: 'contacts', title: 'Kontakte & Eskalation', order: 7 }
    ]
  },
  isGlobal: true,
  isNistCompliant: false,
  tags: ['runbook', 'operations', 'procedures', 'troubleshooting']
};

/**
 * Security Policy Template (NIST SP 800-53)
 */
export const securityPolicyTemplate: TemplateDefinition = {
  name: 'Security Policy (NIST SP 800-53)',
  description: 'Umfassende Sicherheitsrichtlinie nach NIST SP 800-53 Standards. Enthält Zugriffskontrollen, Verschlüsselung, Incident Response und Compliance-Anforderungen.',
  category: 'DOCUMENTATION',
  content: `<div class="template-document">
  <header class="doc-header">
    <h1>Security Policy</h1>
    <p class="metadata"><strong>Erstellt:</strong> {{createdDate}} | <strong>Version:</strong> {{version}} | <strong>Standard:</strong> NIST SP 800-53</p>
  </header>

  <section id="overview">
    <h2>1. Übersicht</h2>
    <table class="info-table">
      <tr><td><strong>Richtlinien-Name:</strong></td><td>{{policyName}}</td></tr>
      <tr><td><strong>Gültigkeitsbereich:</strong></td><td>{{scope}}</td></tr>
      <tr><td><strong>Verantwortlicher:</strong></td><td>{{owner}}</td></tr>
      <tr><td><strong>Genehmigt von:</strong></td><td>{{approvedBy}}</td></tr>
      <tr><td><strong>Nächste Überprüfung:</strong></td><td>{{nextReview}}</td></tr>
    </table>
  </section>

  <section id="controls">
    <h2>2. Sicherheitskontrollen</h2>
    <h3>Zugriffskontrollen (AC)</h3>
    <p>{{accessControls}}</p>
    <h3>Authentifizierung (AU)</h3>
    <p>{{authentication}}</p>
    <h3>Verschlüsselung (SC)</h3>
    <p>{{encryption}}</p>
    <h3>Audit-Logging (AU)</h3>
    <p>{{auditLogging}}</p>
  </section>

  <section id="incident-response">
    <h2>3. Incident Response</h2>
    <h3>Eskalationspfad</h3>
    <p>{{escalationPath}}</p>
    <h3>Reaktionsverfahren</h3>
    <ol>{{responseProcedure}}</ol>
    <h3>Kontakte</h3>
    <p>{{incidentContacts}}</p>
  </section>

  <section id="compliance">
    <h2>4. Compliance</h2>
    <h3>Erfüllte Standards</h3>
    <ul>{{complianceStandards}}</ul>
    <h3>Audit-Anforderungen</h3>
    <p>{{auditRequirements}}</p>
    <h3>Reporting</h3>
    <p>{{reportingRequirements}}</p>
  </section>

  <section id="procedures">
    <h2>5. Sicherheitsverfahren</h2>
    <h3>Passwort-Richtlinie</h3>
    <p>{{passwordPolicy}}</p>
    <h3>Zugriffsmanagement</h3>
    <p>{{accessManagement}}</p>
    <h3>Datenklassifizierung</h3>
    <p>{{dataClassification}}</p>
  </section>
</div>

<style>
.template-document { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
.doc-header { border-bottom: 3px solid #dc2626; padding-bottom: 1rem; margin-bottom: 2rem; }
.doc-header h1 { color: #b91c1c; margin: 0; }
.metadata { color: #666; font-size: 0.9rem; }
section { margin-bottom: 3rem; }
h2 { color: #b91c1c; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; margin-top: 2rem; }
h3 { color: #374151; margin-top: 1.5rem; }
.info-table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
.info-table td { padding: 0.75rem; border-bottom: 1px solid #e5e7eb; }
.info-table td:first-child { font-weight: 600; width: 35%; background-color: #f9fafb; }
ol, ul { margin: 1rem 0; padding-left: 2rem; }
</style>`,
  structure: {
    sections: [
      { id: 'overview', title: 'Übersicht', order: 1 },
      { id: 'controls', title: 'Sicherheitskontrollen', order: 2 },
      { id: 'incident-response', title: 'Incident Response', order: 3 },
      { id: 'compliance', title: 'Compliance', order: 4 },
      { id: 'procedures', title: 'Sicherheitsverfahren', order: 5 }
    ]
  },
  isGlobal: true,
  isNistCompliant: true,
  nistFramework: 'NIST SP 800-53',
  tags: ['security', 'policy', 'nist', 'compliance', 'incident-response']
};

/**
 * Change Log Template
 */
export const changeLogTemplate: TemplateDefinition = {
  name: 'Change Log - Änderungsprotokoll',
  description: 'Strukturiertes Änderungsprotokoll für Systeme, Anwendungen und Konfigurationen. Enthält Change-Tracking, Genehmigungen und Verifizierung.',
  category: 'DOCUMENTATION',
  content: `<div class="template-document">
  <header class="doc-header">
    <h1>Change Log: {{systemName}}</h1>
    <p class="metadata"><strong>Erstellt:</strong> {{createdDate}}</p>
  </header>

  <section id="overview">
    <h2>1. Übersicht</h2>
    <table class="info-table">
      <tr><td><strong>System/Anwendung:</strong></td><td>{{systemName}}</td></tr>
      <tr><td><strong>Verantwortlicher:</strong></td><td>{{owner}}</td></tr>
      <tr><td><strong>Zeitraum:</strong></td><td>{{period}}</td></tr>
    </table>
  </section>

  <section id="changes">
    <h2>2. Änderungen</h2>
    <div class="change-entry">
      <h3>Änderung #{{changeNumber}}</h3>
      <table class="info-table">
        <tr><td><strong>Datum:</strong></td><td>{{changeDate}}</td></tr>
        <tr><td><strong>Typ:</strong></td><td>{{changeType}}</td></tr>
        <tr><td><strong>Beschreibung:</strong></td><td>{{changeDescription}}</td></tr>
        <tr><td><strong>Durchgeführt von:</strong></td><td>{{performedBy}}</td></tr>
        <tr><td><strong>Genehmigt von:</strong></td><td>{{approvedBy}}</td></tr>
        <tr><td><strong>Status:</strong></td><td>{{status}}</td></tr>
      </table>
      <h4>Details</h4>
      <p>{{changeDetails}}</p>
      <h4>Verifizierung</h4>
      <p>{{verification}}</p>
      <h4>Rollback-Pläne</h4>
      <p>{{rollbackPlans}}</p>
    </div>
  </section>

  <section id="summary">
    <h2>3. Zusammenfassung</h2>
    <table class="info-table">
      <tr><td><strong>Gesamt-Änderungen:</strong></td><td>{{totalChanges}}</td></tr>
      <tr><td><strong>Erfolgreich:</strong></td><td>{{successfulChanges}}</td></tr>
      <tr><td><strong>Fehlgeschlagen:</strong></td><td>{{failedChanges}}</td></tr>
      <tr><td><strong>Rollbacks:</strong></td><td>{{rollbacks}}</td></tr>
    </table>
  </section>
</div>

<style>
.template-document { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
.doc-header { border-bottom: 3px solid #6366f1; padding-bottom: 1rem; margin-bottom: 2rem; }
.doc-header h1 { color: #4f46e5; margin: 0; }
.metadata { color: #666; font-size: 0.9rem; }
section { margin-bottom: 3rem; }
h2 { color: #4f46e5; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; margin-top: 2rem; }
h3 { color: #374151; margin-top: 1.5rem; }
h4 { color: #6b7280; margin-top: 1rem; }
.info-table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
.info-table td { padding: 0.75rem; border-bottom: 1px solid #e5e7eb; }
.info-table td:first-child { font-weight: 600; width: 35%; background-color: #f9fafb; }
.change-entry { background-color: #f9fafb; padding: 1.5rem; border-radius: 0.5rem; margin-bottom: 2rem; border-left: 4px solid #6366f1; }
</style>`,
  structure: {
    sections: [
      { id: 'overview', title: 'Übersicht', order: 1 },
      { id: 'changes', title: 'Änderungen', order: 2 },
      { id: 'summary', title: 'Zusammenfassung', order: 3 }
    ]
  },
  isGlobal: true,
  isNistCompliant: false,
  tags: ['changelog', 'change-management', 'tracking']
};

/**
 * Betriebshandbuch (BHB) - Vollständige Betriebsdokumentation
 * Nach BSI IT-Grundschutz Mustergliederung
 */
export const betriebshandbuchTemplate: TemplateDefinition = {
  name: 'Betriebshandbuch (BHB) - Vollständige Betriebsdokumentation',
  description: 'Umfassendes Betriebshandbuch nach BSI IT-Grundschutz Mustergliederung. Deckt alle Lebenszyklusphasen ab: Planung, Einrichtung, Betrieb, Notfall, Beendigung und Test.',
  category: 'DOCUMENTATION',
  content: `<div class="template-document">
  <header class="doc-header">
    <h1>Betriebshandbuch (BHB)</h1>
    <p class="metadata"><strong>Erstellt:</strong> {{createdDate}} | <strong>Version:</strong> {{version}} | <strong>System/Anwendung:</strong> {{systemName}}</p>
  </header>

  <section id="geltungsbereich">
    <h2>A. Geltungsbereich und Governance</h2>
    
    <h3>A.1 Geltungsbereich</h3>
    <table class="info-table">
      <tr><td><strong>Funktion/Aufgabe:</strong></td><td>{{functionDescription}}</td></tr>
      <tr><td><strong>Verarbeitete Daten:</strong></td><td>{{processedData}}</td></tr>
      <tr><td><strong>Physikalischer Aufbau:</strong></td><td>{{physicalStructure}}</td></tr>
      <tr><td><strong>Logischer Aufbau:</strong></td><td>{{logicalStructure}}</td></tr>
      <tr><td><strong>Benutzerkreis/Zielgruppe:</strong></td><td>{{userGroup}}</td></tr>
    </table>
    <h4>Diagramm/Grafik</h4>
    <p>{{diagram}}</p>

    <h3>A.2 Rollen und Rechte</h3>
    <table class="info-table">
      <tr><th>Rolle</th><th>Verantwortlichkeiten</th><th>Zugriffsrechte</th></tr>
      <tr><td>{{role1}}</td><td>{{responsibility1}}</td><td>{{accessRights1}}</td></tr>
      <tr><td>{{role2}}</td><td>{{responsibility2}}</td><td>{{accessRights2}}</td></tr>
    </table>
    <h4>Prozess zur Beantragung/Überprüfung von Berechtigungen</h4>
    <p>{{authorizationProcess}}</p>

    <h3>A.3 Vereinbarungen</h3>
    <h4>Service-Level-Vereinbarungen (SLA)</h4>
    <p>{{sla}}</p>
    <h4>Betriebsvereinbarungen (OLA)</h4>
    <p>{{ola}}</p>
    <h4>Verträge mit Dienstleistern</h4>
    <p>{{vendorContracts}}</p>

    <h3>A.4 Glossar</h3>
    <table class="info-table">
      <tr><th>Abkürzung/Begriff</th><th>Bedeutung</th></tr>
      <tr><td>{{term1}}</td><td>{{definition1}}</td></tr>
      <tr><td>{{term2}}</td><td>{{definition2}}</td></tr>
    </table>
  </section>

  <section id="lebenszyklus">
    <h2>B. Lebenszyklusphasen</h2>

    <h3>B.1 Planung</h3>
    <h4>Anforderungsanalyse</h4>
    <p><strong>Funktionale Anforderungen:</strong> {{functionalRequirements}}</p>
    <p><strong>Nicht-funktionale Anforderungen:</strong> {{nonFunctionalRequirements}}</p>
    <h4>Auswahlkriterien</h4>
    <ul>{{selectionCriteria}}</ul>
    <h4>Auswahl/Beschaffung</h4>
    <p>{{procurement}}</p>

    <h3>B.2 Einrichtung</h3>
    <h4>Aufbau (physisch/logisch)</h4>
    <p>{{setup}}</p>
    <h4>Deployment-Plan</h4>
    <p>{{deploymentPlan}}</p>
    <h4>Installation</h4>
    <ol>{{installationSteps}}</ol>
    <h4>Konfiguration</h4>
    <p>{{configuration}}</p>
    <h4>Test</h4>
    <p><strong>Unit-Tests:</strong> {{unitTests}}</p>
    <p><strong>Integrations-Tests:</strong> {{integrationTests}}</p>
    <p><strong>System-Tests:</strong> {{systemTests}}</p>
    <h4>Umsetzung</h4>
    <p><strong>Migration:</strong> {{migration}}</p>
    <p><strong>Schulung:</strong> {{training}}</p>
    <p><strong>Start des Betriebs:</strong> {{operationStart}}</p>

    <h3>B.3 Betrieb</h3>
    <h4>Bereitstellung und Konfiguration</h4>
    <table class="info-table">
      <tr><td><strong>Verfügbarkeit:</strong></td><td>{{availability}}</td></tr>
      <tr><td><strong>Wartungsfenster:</strong></td><td>{{maintenanceWindows}}</td></tr>
      <tr><td><strong>Konfigurationsmanagement:</strong></td><td>{{configManagement}}</td></tr>
    </table>
    <h4>Überwachung</h4>
    <p><strong>Alarmsysteme:</strong> {{alarmSystems}}</p>
    <p><strong>Leistungsprüfung:</strong> {{performanceMonitoring}}</p>
    <h4>Patch- und Änderungsmanagement</h4>
    <p><strong>Prozess:</strong> {{changeProcess}}</p>
    <p><strong>Zeitplan:</strong> {{changeSchedule}}</p>
    <h4>Datensicherung</h4>
    <p><strong>Strategien:</strong> {{backupStrategies}}</p>
    <p><strong>Wiederherstellungsverfahren:</strong> {{restoreProcedures}}</p>
    <h4>Schutz vor Schadsoftware</h4>
    <p>{{malwareProtection}}</p>

    <h3>B.4 Notfall</h3>
    <h4>Notfallmanagement</h4>
    <p><strong>Notfallpläne:</strong> {{emergencyPlans}}</p>
    <h4>Vorbereitung und Übungen</h4>
    <p><strong>Schulungen:</strong> {{emergencyTraining}}</p>
    <h4>Not-Betrieb und Rückkehr</h4>
    <p><strong>Verfahren zur Wiederherstellung:</strong> {{recoveryProcedures}}</p>

    <h3>B.5 Beendigung</h3>
    <h4>Außerbetriebnahme</h4>
    <p><strong>Sichere Einstellung von Diensten:</strong> {{serviceShutdown}}</p>
    <p><strong>Archivierung:</strong> {{archiving}}</p>
    <h4>Rückbau</h4>
    <p><strong>Physischer Rückbau:</strong> {{physicalRemoval}}</p>
    <p><strong>Logischer Rückbau:</strong> {{logicalRemoval}}</p>
    <p><strong>Sichere Löschung:</strong> {{secureDeletion}}</p>

    <h3>B.6 Test und Freigabe</h3>
    <h4>Funktionale Tests</h4>
    <p><strong>Testfälle:</strong> {{testCases}}</p>
    <p><strong>Dokumentation der Ergebnisse:</strong> {{testResults}}</p>
    <h4>Abweichungen und Ausnahmen</h4>
    <p><strong>Identifikation:</strong> {{deviations}}</p>
    <p><strong>Genehmigungsverfahren:</strong> {{approvalProcess}}</p>
    <h4>Freigabe</h4>
    <p><strong>Formelle Freigabeentscheidung:</strong> {{formalApproval}}</p>
  </section>
</div>

<style>
.template-document { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
.doc-header { border-bottom: 3px solid #2563eb; padding-bottom: 1rem; margin-bottom: 2rem; }
.doc-header h1 { color: #1e40af; margin: 0; }
.metadata { color: #666; font-size: 0.9rem; }
section { margin-bottom: 3rem; }
h2 { color: #1e40af; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; margin-top: 2rem; }
h3 { color: #374151; margin-top: 1.5rem; }
h4 { color: #6b7280; margin-top: 1rem; }
.info-table { border-collapse: collapse; width: 100%; margin: 1rem 0; border: 1px solid #e5e7eb; }
.info-table td, .info-table th { padding: 0.75rem; border-bottom: 1px solid #e5e7eb; }
.info-table td:first-child, .info-table th:first-child { font-weight: 600; width: 35%; background-color: #f9fafb; }
.info-table th { background-color: #f3f4f6; }
ol, ul { margin: 1rem 0; padding-left: 2rem; }
</style>`,
  structure: {
    sections: [
      { id: 'geltungsbereich', title: 'Geltungsbereich und Governance', order: 1 },
      { id: 'lebenszyklus', title: 'Lebenszyklusphasen', order: 2 }
    ]
  },
  isGlobal: true,
  isNistCompliant: true,
  nistFramework: 'BSI IT-Grundschutz',
  tags: ['betriebshandbuch', 'bhb', 'bsi', 'lebenszyklus', 'betriebsdokumentation']
};

/**
 * ISO 27001 ISMS Dokumentation
 */
export const iso27001Template: TemplateDefinition = {
  name: 'ISO 27001 ISMS Dokumentation',
  description: 'Vollständige Dokumentation für ein Informationssicherheits-Managementsystem nach ISO 27001. Enthält alle Pflichtdokumente für die Zertifizierung.',
  category: 'DOCUMENTATION',
  content: `<div class="template-document">
  <header class="doc-header" style="border-bottom-color: #dc2626;">
    <h1>ISO 27001 ISMS Dokumentation</h1>
    <p class="metadata"><strong>Erstellt:</strong> {{createdDate}} | <strong>Version:</strong> {{version}} | <strong>Standard:</strong> ISO 27001</p>
  </header>

  <section id="scope">
    <h2>1. Umfang des ISMS</h2>
    <table class="info-table">
      <tr><td><strong>Geltungsbereich:</strong></td><td>{{scope}}</td></tr>
      <tr><td><strong>Organisationseinheiten:</strong></td><td>{{organizationalUnits}}</td></tr>
      <tr><td><strong>Standorte:</strong></td><td>{{locations}}</td></tr>
      <tr><td><strong>IT-Systeme:</strong></td><td>{{itSystems}}</td></tr>
      <tr><td><strong>Prozesse:</strong></td><td>{{processes}}</td></tr>
    </table>
  </section>

  <section id="policy">
    <h2>2. Informationssicherheitspolitik</h2>
    <h3>Politik-Erklärung</h3>
    <p>{{policyStatement}}</p>
    <h3>Informationssicherheitsziele</h3>
    <ul>{{securityObjectives}}</ul>
    <h3>Verantwortlichkeiten</h3>
    <p>{{responsibilities}}</p>
  </section>

  <section id="risk">
    <h2>3. Risikobewertung und Risikobehandlungsmethodik</h2>
    <h3>Risikobehandlungsmethodik</h3>
    <p>{{riskMethodology}}</p>
    <h3>Identifizierte Risiken</h3>
    <table class="info-table">
      <tr><th>Risiko</th><th>Wahrscheinlichkeit</th><th>Auswirkung</th><th>Risikobewertung</th></tr>
      <tr><td>{{risk1}}</td><td>{{probability1}}</td><td>{{impact1}}</td><td>{{rating1}}</td></tr>
      <tr><td>{{risk2}}</td><td>{{probability2}}</td><td>{{impact2}}</td><td>{{rating2}}</td></tr>
    </table>
    <h3>Akzeptierte Risiken</h3>
    <p>{{acceptedRisks}}</p>
  </section>

  <section id="soa">
    <h2>4. Erklärung der Anwendbarkeit (Statement of Applicability)</h2>
    <h3>Angewandte Maßnahmen</h3>
    <table class="info-table">
      <tr><th>ISO 27001 Kontrolle</th><th>Anwendbarkeit</th><th>Begründung</th></tr>
      <tr><td>A.5.1.1 - Richtlinien für Informationssicherheit</td><td>{{appliedA5_1_1}}</td><td>{{justificationA5_1_1}}</td></tr>
      <tr><td>A.9.4.1 - Zugriffsrechte</td><td>{{appliedA9_4_1}}</td><td>{{justificationA9_4_1}}</td></tr>
    </table>
    <h3>Nicht angewandte Maßnahmen</h3>
    <p>{{excludedMeasures}}</p>
  </section>

  <section id="treatment">
    <h2>5. Risikobehandlungsplan</h2>
    <table class="info-table">
      <tr><th>Risiko</th><th>Behandlungsoption</th><th>Maßnahmen</th><th>Verantwortlich</th><th>Termin</th></tr>
      <tr><td>{{risk1}}</td><td>{{treatmentOption1}}</td><td>{{measures1}}</td><td>{{responsible1}}</td><td>{{deadline1}}</td></tr>
    </table>
  </section>

  <section id="roles">
    <h2>6. Sicherheitsrollen und Verantwortlichkeiten</h2>
    <table class="info-table">
      <tr><th>Rolle</th><th>Verantwortlichkeiten</th><th>Berechtigungen</th></tr>
      <tr><td>Informationssicherheitsbeauftragter (ISB)</td><td>{{isbResponsibilities}}</td><td>{{isbPermissions}}</td></tr>
      <tr><td>Systemadministrator</td><td>{{adminResponsibilities}}</td><td>{{adminPermissions}}</td></tr>
    </table>
  </section>
</div>

<style>
.template-document { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
.doc-header { border-bottom: 3px solid #dc2626; padding-bottom: 1rem; margin-bottom: 2rem; }
.doc-header h1 { color: #b91c1c; margin: 0; }
.metadata { color: #666; font-size: 0.9rem; }
section { margin-bottom: 3rem; }
h2 { color: #b91c1c; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; margin-top: 2rem; }
h3 { color: #374151; margin-top: 1.5rem; }
.info-table { border-collapse: collapse; width: 100%; margin: 1rem 0; border: 1px solid #e5e7eb; }
.info-table td, .info-table th { padding: 0.75rem; border-bottom: 1px solid #e5e7eb; }
.info-table td:first-child, .info-table th:first-child { font-weight: 600; width: 35%; background-color: #f9fafb; }
.info-table th { background-color: #f3f4f6; }
ul { margin: 1rem 0; padding-left: 2rem; }
</style>`,
  structure: {
    sections: [
      { id: 'scope', title: 'Umfang des ISMS', order: 1 },
      { id: 'policy', title: 'Informationssicherheitspolitik', order: 2 },
      { id: 'risk', title: 'Risikobewertung', order: 3 },
      { id: 'soa', title: 'Erklärung der Anwendbarkeit', order: 4 },
      { id: 'treatment', title: 'Risikobehandlungsplan', order: 5 },
      { id: 'roles', title: 'Sicherheitsrollen', order: 6 }
    ]
  },
  isGlobal: true,
  isNistCompliant: true,
  nistFramework: 'ISO 27001',
  tags: ['iso27001', 'isms', 'sicherheit', 'compliance', 'risiko']
};

/**
 * Serverwartungs-Checkliste
 */
export const serverMaintenanceTemplate: TemplateDefinition = {
  name: 'Serverwartungs-Checkliste',
  description: 'Praktische Checkliste für regelmäßige Serverwartung nach operativen Best Practices. Enthält tägliche, wöchentliche, monatliche und jährliche Aufgaben.',
  category: 'DOCUMENTATION',
  content: `<div class="template-document">
  <header class="doc-header" style="border-bottom-color: #f59e0b;">
    <h1>Serverwartungs-Checkliste</h1>
    <p class="metadata"><strong>Erstellt:</strong> {{createdDate}} | <strong>Server:</strong> {{serverName}} | <strong>Verantwortlich:</strong> {{responsible}}</p>
  </header>

  <section id="daily">
    <h2>1. Tägliche Aufgaben</h2>
    <table class="info-table">
      <tr><th>Aufgabe</th><th>Status</th><th>Bemerkungen</th><th>Datum</th></tr>
      <tr><td>Backup-Status prüfen</td><td>{{backupStatus}}</td><td>{{backupNotes}}</td><td>{{backupDate}}</td></tr>
      <tr><td>Kritische System-Alerts überprüfen</td><td>{{alertsStatus}}</td><td>{{alertsNotes}}</td><td>{{alertsDate}}</td></tr>
      <tr><td>Performance-Monitoring (CPU, RAM, Festplatte)</td><td>{{performanceStatus}}</td><td>{{performanceNotes}}</td><td>{{performanceDate}}</td></tr>
      <tr><td>Antivirus-Status prüfen</td><td>{{antivirusStatus}}</td><td>{{antivirusNotes}}</td><td>{{antivirusDate}}</td></tr>
    </table>
  </section>

  <section id="weekly">
    <h2>2. Wöchentliche Aufgaben</h2>
    <table class="info-table">
      <tr><th>Aufgabe</th><th>Status</th><th>Bemerkungen</th><th>Datum</th></tr>
      <tr><td>Nicht-kritische Patches installieren</td><td>{{patchesWeeklyStatus}}</td><td>{{patchesWeeklyNotes}}</td><td>{{patchesWeeklyDate}}</td></tr>
      <tr><td>Speicherplatz-Analyse durchführen</td><td>{{storageAnalysisStatus}}</td><td>{{storageAnalysisNotes}}</td><td>{{storageAnalysisDate}}</td></tr>
      <tr><td>Test-Restore (Datei-Ebene) durchführen</td><td>{{testRestoreWeeklyStatus}}</td><td>{{testRestoreWeeklyNotes}}</td><td>{{testRestoreWeeklyDate}}</td></tr>
      <tr><td>Hardware-Status prüfen (RAID/SMART-Werte)</td><td>{{hardwareStatus}}</td><td>{{hardwareNotes}}</td><td>{{hardwareDate}}</td></tr>
      <tr><td>Externe Erreichbarkeit kritischer Dienste prüfen</td><td>{{reachabilityStatus}}</td><td>{{reachabilityNotes}}</td><td>{{reachabilityDate}}</td></tr>
    </table>
  </section>

  <section id="monthly">
    <h2>3. Monatliche Aufgaben</h2>
    <table class="info-table">
      <tr><th>Aufgabe</th><th>Status</th><th>Bemerkungen</th><th>Datum</th></tr>
      <tr><td>Kritische OS-Updates installieren (Patch-Day)</td><td>{{osUpdatesStatus}}</td><td>{{osUpdatesNotes}}</td><td>{{osUpdatesDate}}</td></tr>
      <tr><td>Anwendungsupdates einspielen</td><td>{{appUpdatesStatus}}</td><td>{{appUpdatesNotes}}</td><td>{{appUpdatesDate}}</td></tr>
      <tr><td>Benutzerkonten-Review (insb. administrative Rechte)</td><td>{{userReviewStatus}}</td><td>{{userReviewNotes}}</td><td>{{userReviewDate}}</td></tr>
      <tr><td>Bereinigung (temporäre Dateien)</td><td>{{cleanupStatus}}</td><td>{{cleanupNotes}}</td><td>{{cleanupDate}}</td></tr>
      <tr><td>Test-Restore (Anwendungs-Ebene, z.B. Datenbank)</td><td>{{testRestoreMonthlyStatus}}</td><td>{{testRestoreMonthlyNotes}}</td><td>{{testRestoreMonthlyDate}}</td></tr>
    </table>
  </section>

  <section id="yearly">
    <h2>4. Quartalsweise / Jährliche Aufgaben</h2>
    <table class="info-table">
      <tr><th>Aufgabe</th><th>Intervall</th><th>Status</th><th>Bemerkungen</th><th>Datum</th></tr>
      <tr><td>Serverraum prüfen</td><td>{{serverRoomInterval}}</td><td>{{serverRoomStatus}}</td><td>{{serverRoomNotes}}</td><td>{{serverRoomDate}}</td></tr>
      <tr><td>Server herunterfahren und reinigen (Staub entfernen)</td><td>{{cleaningInterval}}</td><td>{{cleaningStatus}}</td><td>{{cleaningNotes}}</td><td>{{cleaningDate}}</td></tr>
      <tr><td>Lüfter und Kabelverbindungen kontrollieren</td><td>{{hardwareCheckInterval}}</td><td>{{hardwareCheckStatus}}</td><td>{{hardwareCheckNotes}}</td><td>{{hardwareCheckDate}}</td></tr>
      <tr><td>Passwort-Rotation (administrative Passwörter)</td><td>{{passwordRotationInterval}}</td><td>{{passwordRotationStatus}}</td><td>{{passwordRotationNotes}}</td><td>{{passwordRotationDate}}</td></tr>
      <tr><td>Dokumentations-Audit</td><td>Jährlich</td><td>{{documentationAuditStatus}}</td><td>{{documentationAuditNotes}}</td><td>{{documentationAuditDate}}</td></tr>
      <tr><td>Disaster-Recovery-Test</td><td>Jährlich</td><td>{{drTestStatus}}</td><td>{{drTestNotes}}</td><td>{{drTestDate}}</td></tr>
    </table>
  </section>
</div>

<style>
.template-document { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
.doc-header { border-bottom: 3px solid #f59e0b; padding-bottom: 1rem; margin-bottom: 2rem; }
.doc-header h1 { color: #d97706; margin: 0; }
.metadata { color: #666; font-size: 0.9rem; }
section { margin-bottom: 3rem; }
h2 { color: #d97706; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; margin-top: 2rem; }
.info-table { border-collapse: collapse; width: 100%; margin: 1rem 0; border: 1px solid #e5e7eb; }
.info-table td, .info-table th { padding: 0.75rem; border-bottom: 1px solid #e5e7eb; }
.info-table th { background-color: #f3f4f6; font-weight: 600; text-align: left; }
.info-table tr:hover { background-color: #f9fafb; }
</style>`,
  structure: {
    sections: [
      { id: 'daily', title: 'Tägliche Aufgaben', order: 1 },
      { id: 'weekly', title: 'Wöchentliche Aufgaben', order: 2 },
      { id: 'monthly', title: 'Monatliche Aufgaben', order: 3 },
      { id: 'yearly', title: 'Quartalsweise / Jährliche Aufgaben', order: 4 }
    ]
  },
  isGlobal: true,
  isNistCompliant: false,
  tags: ['server', 'wartung', 'checkliste', 'maintenance', 'operations']
};

/**
 * ISO 20000 Service Definition (YaSM)
 */
export const iso20000ServiceDefinitionTemplate: TemplateDefinition = {
  name: 'ISO 20000 Service Definition (YaSM)',
  description: 'Service Definition nach ISO 20000 / YaSM Standard. Dokumentiert Service-Eigenschaften, Service-Level und Abhängigkeiten.',
  category: 'DOCUMENTATION',
  content: `<div class="template-document">
  <header class="doc-header" style="border-bottom-color: #6366f1;">
    <h1>Service Definition</h1>
    <p class="metadata"><strong>Erstellt:</strong> {{createdDate}} | <strong>Standard:</strong> ISO 20000 / YaSM</p>
  </header>

  <section id="overview">
    <h2>1. Service-Übersicht</h2>
    <table class="info-table">
      <tr><td><strong>Service-Name:</strong></td><td>{{serviceName}}</td></tr>
      <tr><td><strong>Service-Kategorie:</strong></td><td>{{serviceCategory}}</td></tr>
      <tr><td><strong>Service-Beschreibung:</strong></td><td>{{serviceDescription}}</td></tr>
      <tr><td><strong>Service-Eigentümer:</strong></td><td>{{serviceOwner}}</td></tr>
      <tr><td><strong>Service-Manager:</strong></td><td>{{serviceManager}}</td></tr>
    </table>
  </section>

  <section id="characteristics">
    <h2>2. Service-Eigenschaften</h2>
    <h3>Funktionale Eigenschaften</h3>
    <ul>{{functionalCharacteristics}}</ul>
    <h3>Nicht-funktionale Eigenschaften</h3>
    <ul>{{nonFunctionalCharacteristics}}</ul>
    <h3>Service-Komponenten</h3>
    <p>{{serviceComponents}}</p>
  </section>

  <section id="sla">
    <h2>3. Service-Level-Vereinbarungen (SLA)</h2>
    <table class="info-table">
      <tr><th>Service-Level</th><th>Zielwert</th><th>Messmethode</th></tr>
      <tr><td>Verfügbarkeit</td><td>{{availabilityTarget}}</td><td>{{availabilityMeasurement}}</td></tr>
      <tr><td>Reaktionszeit</td><td>{{responseTimeTarget}}</td><td>{{responseTimeMeasurement}}</td></tr>
      <tr><td>Auflösungszeit</td><td>{{resolutionTimeTarget}}</td><td>{{resolutionTimeMeasurement}}</td></tr>
    </table>
  </section>

  <section id="dependencies">
    <h2>4. Service-Abhängigkeiten</h2>
    <h3>Abhängige Services</h3>
    <p>{{dependentServices}}</p>
    <h3>Abhängige Systeme</h3>
    <p>{{dependentSystems}}</p>
    <h3>Externe Abhängigkeiten</h3>
    <p>{{externalDependencies}}</p>
  </section>
</div>

<style>
.template-document { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
.doc-header { border-bottom: 3px solid #6366f1; padding-bottom: 1rem; margin-bottom: 2rem; }
.doc-header h1 { color: #4f46e5; margin: 0; }
.metadata { color: #666; font-size: 0.9rem; }
section { margin-bottom: 3rem; }
h2 { color: #4f46e5; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; margin-top: 2rem; }
h3 { color: #374151; margin-top: 1.5rem; }
.info-table { border-collapse: collapse; width: 100%; margin: 1rem 0; border: 1px solid #e5e7eb; }
.info-table td, .info-table th { padding: 0.75rem; border-bottom: 1px solid #e5e7eb; }
.info-table td:first-child, .info-table th:first-child { font-weight: 600; width: 35%; background-color: #f9fafb; }
.info-table th { background-color: #f3f4f6; }
ul { margin: 1rem 0; padding-left: 2rem; }
</style>`,
  structure: {
    sections: [
      { id: 'overview', title: 'Service-Übersicht', order: 1 },
      { id: 'characteristics', title: 'Service-Eigenschaften', order: 2 },
      { id: 'sla', title: 'Service-Level-Vereinbarungen', order: 3 },
      { id: 'dependencies', title: 'Service-Abhängigkeiten', order: 4 }
    ]
  },
  isGlobal: true,
  isNistCompliant: true,
  nistFramework: 'ISO 20000',
  tags: ['iso20000', 'yasm', 'service', 'sla', 'itil']
};

/**
 * Systemakte (Modular)
 */
export const systemakteTemplate: TemplateDefinition = {
  name: 'Systemakte - Modulare Systemdokumentation',
  description: 'Modulare Systemakte nach IT-Grundschutz-Kompendium Struktur. Enthält alle systembezogenen Informationen für CMDB-Integration.',
  category: 'DOCUMENTATION',
  content: `<div class="template-document">
  <header class="doc-header">
    <h1>Systemakte: {{systemName}}</h1>
    <p class="metadata"><strong>Erstellt:</strong> {{createdDate}} | <strong>CMDB-ID:</strong> {{cmdbId}}</p>
  </header>

  <section id="basic">
    <h2>1. Basisinformationen</h2>
    <table class="info-table">
      <tr><td><strong>System-Name:</strong></td><td>{{systemName}}</td></tr>
      <tr><td><strong>System-Typ:</strong></td><td>{{systemType}}</td></tr>
      <tr><td><strong>Version:</strong></td><td>{{version}}</td></tr>
      <tr><td><strong>Standort:</strong></td><td>{{location}}</td></tr>
      <tr><td><strong>Kritikalität:</strong></td><td>{{criticality}}</td></tr>
    </table>
  </section>

  <section id="components">
    <h2>2. Systemkomponenten</h2>
    <h3>Hardware-Komponenten</h3>
    <p>{{hardwareComponents}}</p>
    <h3>Software-Komponenten</h3>
    <p>{{softwareComponents}}</p>
    <h3>Netzwerk-Komponenten</h3>
    <p>{{networkComponents}}</p>
  </section>

  <section id="config">
    <h2>3. Konfiguration</h2>
    <h3>Konfigurationsparameter</h3>
    <p>{{configurationParameters}}</p>
    <h3>Abhängigkeiten</h3>
    <p>{{dependencies}}</p>
  </section>

  <section id="security">
    <h2>4. Sicherheitsinformationen</h2>
    <table class="info-table">
      <tr><td><strong>Sicherheitsstufe:</strong></td><td>{{securityLevel}}</td></tr>
      <tr><td><strong>Zugriffskontrollen:</strong></td><td>{{accessControls}}</td></tr>
      <tr><td><strong>Verschlüsselung:</strong></td><td>{{encryption}}</td></tr>
    </table>
  </section>
</div>

<style>
.template-document { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
.doc-header { border-bottom: 3px solid #2563eb; padding-bottom: 1rem; margin-bottom: 2rem; }
.doc-header h1 { color: #1e40af; margin: 0; }
.metadata { color: #666; font-size: 0.9rem; }
section { margin-bottom: 3rem; }
h2 { color: #1e40af; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; margin-top: 2rem; }
h3 { color: #374151; margin-top: 1.5rem; }
.info-table { border-collapse: collapse; width: 100%; margin: 1rem 0; border: 1px solid #e5e7eb; }
.info-table td { padding: 0.75rem; border-bottom: 1px solid #e5e7eb; }
.info-table td:first-child { font-weight: 600; width: 35%; background-color: #f9fafb; }
</style>`,
  structure: {
    sections: [
      { id: 'basic', title: 'Basisinformationen', order: 1 },
      { id: 'components', title: 'Systemkomponenten', order: 2 },
      { id: 'config', title: 'Konfiguration', order: 3 },
      { id: 'security', title: 'Sicherheitsinformationen', order: 4 }
    ]
  },
  isGlobal: true,
  isNistCompliant: true,
  nistFramework: 'BSI IT-Grundschutz',
  tags: ['systemakte', 'cmdb', 'systemdokumentation', 'modular']
};

/**
 * Export all templates
 */
export const stateOfTheArtTemplates: TemplateDefinition[] = [
  serverTemplate,
  networkTemplate,
  backupTemplate,
  runbookTemplate,
  securityPolicyTemplate,
  changeLogTemplate,
  betriebshandbuchTemplate,
  iso27001Template,
  serverMaintenanceTemplate,
  iso20000ServiceDefinitionTemplate,
  systemakteTemplate
];

