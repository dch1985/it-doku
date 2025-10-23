import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateTemplateInput {
  title: string;
  category: string;
  content: string;
  type: string;
}

export class TemplateService {
  /**
   * Gibt alle Templates zurück
   */
  async getAllTemplates(filters?: { category?: string; type?: string }) {
    try {
      const where: any = {};

      if (filters?.category) {
        where.category = filters.category;
      }

      if (filters?.type) {
        where.type = filters.type;
      }

      const templates = await prisma.template.findMany({
        where,
        orderBy: {
          title: 'asc',
        },
      });

      return templates;
    } catch (error) {
      throw new Error(`Fehler beim Abrufen der Templates: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Gibt ein einzelnes Template zurück
   */
  async getTemplateById(id: string) {
    try {
      const template = await prisma.template.findUnique({
        where: { id },
        include: {
          documents: {
            select: {
              id: true,
              title: true,
              status: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 5,
          },
        },
      });

      if (!template) {
        throw new Error('Template nicht gefunden');
      }

      return template;
    } catch (error) {
      throw new Error(`Fehler beim Abrufen des Templates: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Erstellt ein neues Template (Admin-Funktion)
   */
  async createTemplate(data: CreateTemplateInput) {
    try {
      const template = await prisma.template.create({
        data: {
          title: data.title,
          category: data.category,
          content: data.content,
          type: data.type,
        },
      });

      return template;
    } catch (error) {
      throw new Error(`Fehler beim Erstellen des Templates: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Aktualisiert ein Template (Admin-Funktion)
   */
  async updateTemplate(id: string, data: Partial<CreateTemplateInput>) {
    try {
      const template = await prisma.template.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });

      return template;
    } catch (error) {
      throw new Error(`Fehler beim Aktualisieren des Templates: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Löscht ein Template (Admin-Funktion)
   */
  async deleteTemplate(id: string) {
    try {
      // Prüfe ob Dokumente dieses Template nutzen
      const documentsUsingTemplate = await prisma.document.count({
        where: { templateId: id },
      });

      if (documentsUsingTemplate > 0) {
        throw new Error(`Template kann nicht gelöscht werden: ${documentsUsingTemplate} Dokument(e) nutzen dieses Template`);
      }

      await prisma.template.delete({
        where: { id },
      });

      return { success: true, message: 'Template erfolgreich gelöscht' };
    } catch (error) {
      throw new Error(`Fehler beim Löschen des Templates: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Seed-Funktion: Erstellt vordefinierte NIST-konforme Templates
   */
  async seedTemplates() {
    try {
      const existingTemplates = await prisma.template.count();

      if (existingTemplates > 0) {
        return { message: 'Templates bereits vorhanden, Seed übersprungen' };
      }

      const templates = [
        {
          title: 'Server-Dokumentation',
          category: 'server',
          type: 'documentation',
          content: `# Server-Dokumentation

## 1. Allgemeine Informationen
**Server-Name:**
**IP-Adresse:**
**Standort:**
**Eigentümer:**
**Kritikalität:** [Hoch/Mittel/Niedrig]

## 2. Hardware-Spezifikationen
**Hersteller:**
**Modell:**
**CPU:**
**RAM:**
**Speicher:**

## 3. Betriebssystem
**OS:**
**Version:**
**Patch-Level:**
**Lizenz:**

## 4. Installierte Software
| Software | Version | Lizenz | Zweck |
|----------|---------|--------|-------|
|          |         |        |       |

## 5. Netzwerkkonfiguration
**Hostname:**
**Primäre IP:**
**Gateway:**
**DNS:**
**VLAN:**

## 6. Sicherheitsmaßnahmen
- [ ] Firewall konfiguriert
- [ ] Anti-Virus installiert
- [ ] Backup konfiguriert
- [ ] Monitoring aktiv
- [ ] Patch-Management eingerichtet

## 7. Backup-Strategie
**Backup-Typ:**
**Häufigkeit:**
**Speicherort:**
**Retention:**
**Letztes Backup:**

## 8. Wartung
**Letzte Wartung:**
**Nächste Wartung:**
**Verantwortlich:**

## 9. Notfall-Kontakte
| Name | Rolle | Telefon | E-Mail |
|------|-------|---------|--------|
|      |       |         |        |

## 10. Änderungshistorie
| Datum | Änderung | Durchgeführt von |
|-------|----------|------------------|
|       |          |                  |`,
        },
        {
          title: 'Netzwerk-Konfiguration',
          category: 'network',
          type: 'documentation',
          content: `# Netzwerk-Konfiguration

## 1. Geräte-Informationen
**Gerät:**
**Typ:** [Switch/Router/Firewall]
**Hersteller:**
**Modell:**
**Seriennummer:**

## 2. Standort
**Raum:**
**Rack:**
**Position:**

## 3. Management-Zugang
**Management-IP:**
**Zugangsmethode:** [SSH/HTTPS/Telnet]
**Authentifizierung:**
**Passwort-Verwaltung:**

## 4. Port-Konfiguration
| Port | Beschreibung | VLAN | Speed | Status |
|------|-------------|------|-------|--------|
|      |             |      |       |        |

## 5. VLAN-Konfiguration
| VLAN-ID | Name | Subnet | Gateway |
|---------|------|--------|---------|
|         |      |        |         |

## 6. Routing-Konfiguration
**Routing-Protokoll:**
**Static Routes:**
**Default Gateway:**

## 7. Sicherheitseinstellungen
- [ ] Port Security aktiviert
- [ ] DHCP Snooping
- [ ] 802.1X Authentifizierung
- [ ] ACLs konfiguriert
- [ ] Spanning Tree Protocol

## 8. QoS-Einstellungen
**QoS aktiviert:** [Ja/Nein]
**Priorisierung:**

## 9. Monitoring
**SNMP Community:**
**Syslog Server:**
**NetFlow aktiviert:**

## 10. Backup
**Letzte Config-Sicherung:**
**Backup-Speicherort:**
**Automatisiert:** [Ja/Nein]`,
        },
        {
          title: 'Backup-Prozedur',
          category: 'backup',
          type: 'procedure',
          content: `# Backup-Prozedur

## 1. Übersicht
**Zweck:**
**Gültigkeitsbereich:**
**Verantwortlich:**
**Letzte Aktualisierung:**

## 2. Backup-Strategie
**Backup-Typ:** [Voll/Inkrementell/Differentiell]
**Backup-Medium:**
**Speicherort:**
**Off-Site Backup:** [Ja/Nein]

## 3. Backup-Schedule
| System | Typ | Häufigkeit | Zeitpunkt | Retention |
|--------|-----|------------|-----------|-----------|
|        |     |            |           |           |

## 4. Backup-Prozess
### 4.1 Vorbereitung
1.
2.
3.

### 4.2 Durchführung
1.
2.
3.

### 4.3 Verifikation
1.
2.
3.

## 5. Restore-Prozedur
### 5.1 Einzelne Dateien
1.
2.
3.

### 5.2 System-Restore
1.
2.
3.

## 6. Test-Schedule
**Letzte Restore-Test:**
**Nächster Test:**
**Test-Ergebnis:**

## 7. Monitoring und Alerting
**Backup-Monitoring-Tool:**
**Benachrichtigung bei Fehler:**
**Eskalation:**

## 8. Compliance
- [ ] DSGVO-konform
- [ ] Verschlüsselung aktiviert
- [ ] Zugriffsrechte dokumentiert
- [ ] Audit-Log aktiviert

## 9. Disaster Recovery
**RTO (Recovery Time Objective):**
**RPO (Recovery Point Objective):**
**DR-Standort:**

## 10. Änderungshistorie
| Datum | Änderung | Genehmigt von |
|-------|----------|---------------|
|       |          |               |`,
        },
        {
          title: 'Incident-Report',
          category: 'troubleshoot',
          type: 'report',
          content: `# Incident-Report

## 1. Incident-Identifikation
**Incident-ID:**
**Datum/Uhrzeit:**
**Gemeldet von:**
**Priorität:** [Kritisch/Hoch/Mittel/Niedrig]
**Status:** [Offen/In Bearbeitung/Gelöst/Geschlossen]

## 2. Incident-Beschreibung
**Kurzbeschreibung:**

**Detaillierte Beschreibung:**


**Betroffene Systeme:**
-

**Betroffene Benutzer:**

## 3. Auswirkungen
**Geschäftliche Auswirkung:**

**Betroffene Dienste:**
-

**Anzahl betroffene Benutzer:**

**Downtime:**

## 4. Erste Reaktion
**Erstreaktion um:**
**Durchgeführt von:**

**Sofortmaßnahmen:**
1.
2.
3.

## 5. Ursachenanalyse
**Root Cause:**

**Beitragende Faktoren:**
-

**Fehlerquelle:**

## 6. Lösungsschritte
1.
2.
3.
4.

## 7. Wiederherstellung
**Dienst wiederhergestellt um:**
**Vollständig funktionsfähig um:**
**Wiederhergestellt von:**

## 8. Präventivmaßnahmen
**Empfohlene Maßnahmen:**
1.
2.
3.

**Verantwortlich:**
**Deadline:**

## 9. Lessons Learned
**Was lief gut:**
-

**Was lief nicht gut:**
-

**Verbesserungspotential:**
-

## 10. Kommunikation
**Benachrichtigte Stakeholder:**
-

**Kommunikationskanal:**

**Post-Incident-Review geplant:** [Ja/Nein]
**Termin:**

## 11. Genehmigung
**Erstellt von:**
**Geprüft von:**
**Genehmigt von:**
**Datum:** `,
        },
        {
          title: 'Change-Request',
          category: 'troubleshoot',
          type: 'request',
          content: `# Change-Request

## 1. Change-Informationen
**Change-ID:**
**Change-Typ:** [Standard/Normal/Emergency]
**Priorität:** [Hoch/Mittel/Niedrig]
**Status:** [Beantragt/Genehmigt/In Umsetzung/Abgeschlossen]

## 2. Antragsteller
**Name:**
**Abteilung:**
**E-Mail:**
**Telefon:**
**Datum:**

## 3. Change-Beschreibung
**Titel:**

**Detaillierte Beschreibung:**


**Begründung/Business Case:**


**Betroffene Systeme/Services:**
-

## 4. Implementierungsplan
**Geplantes Datum:**
**Geplante Zeit:**
**Geschätzte Dauer:**
**Durchführende Person(en):**

**Implementierungsschritte:**
1.
2.
3.
4.

## 5. Risikobewertung
**Risiko-Level:** [Hoch/Mittel/Niedrig]

**Identifizierte Risiken:**
-

**Risiko-Mitigation:**
-

**Auswirkung bei Fehlschlag:**

## 6. Rollback-Plan
**Rollback möglich:** [Ja/Nein]
**Rollback-Dauer:**

**Rollback-Schritte:**
1.
2.
3.

## 7. Test-Plan
**Pre-Change Tests:**
1.
2.

**Post-Change Tests:**
1.
2.
3.

## 8. Kommunikation
**Benachrichtigung erforderlich:** [Ja/Nein]
**Betroffene Stakeholder:**
-

**Kommunikationsplan:**

**Wartungsfenster-Ankündigung:**

## 9. Genehmigungen
**CAB (Change Advisory Board) Meeting:**
**CAB-Entscheidung:**

| Name | Rolle | Genehmigung | Datum |
|------|-------|-------------|-------|
|      |       |             |       |

## 10. Post-Implementation Review
**Change erfolgreich:** [Ja/Nein]
**Abgeschlossen am:**
**Dokumentation aktualisiert:** [Ja/Nein]

**Bemerkungen:**


**Lessons Learned:**
- `,
        },
      ];

      const createdTemplates = await prisma.template.createMany({
        data: templates,
      });

      return {
        success: true,
        message: `${createdTemplates.count} Templates erfolgreich erstellt`,
      };
    } catch (error) {
      throw new Error(`Fehler beim Seeden der Templates: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export const templateService = new TemplateService();
