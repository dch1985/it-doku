/**
 * PDF Export Utility
 * Export Dokumente als PDF
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Document } from '../types/document';

/**
 * Exportiert ein Dokument als PDF
 */
export const exportDocumentToPDF = async (document: Document): Promise<void> => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;
    
    let yPosition = margin;

    // Titel
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    const titleLines = pdf.splitTextToSize(document.title, contentWidth);
    pdf.text(titleLines, margin, yPosition);
    yPosition += titleLines.length * 8 + 10;

    // Metadaten
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100);
    
    const metadata = [
      `Kategorie: ${document.category}`,
      `Autor: ${document.author}`,
      `Erstellt: ${new Date(document.createdAt).toLocaleDateString('de-DE')}`,
      `Aktualisiert: ${new Date(document.updatedAt).toLocaleDateString('de-DE')}`,
    ];
    
    if (document.tags && document.tags.length > 0) {
      metadata.push(`Tags: ${document.tags.join(', ')}`);
    }
    
    metadata.forEach((line) => {
      pdf.text(line, margin, yPosition);
      yPosition += 5;
    });
    
    yPosition += 10;
    
    // Trennlinie
    pdf.setDrawColor(200);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Content
    pdf.setFontSize(11);
    pdf.setTextColor(0);
    pdf.setFont('helvetica', 'normal');
    
    const contentLines = pdf.splitTextToSize(document.content, contentWidth);
    
    contentLines.forEach((line: string) => {
      if (yPosition + 7 > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }
      pdf.text(line, margin, yPosition);
      yPosition += 7;
    });

    // Footer
    const totalPages = pdf.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(150);
      pdf.text(
        `Seite ${i} von ${totalPages} | IT-Dokumentation`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Save
    const fileName = `${document.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('Error exporting PDF:', error);
    throw new Error('Fehler beim Exportieren als PDF');
  }
};

/**
 * Exportiert HTML Element als PDF (für komplexere Layouts)
 */
export const exportHTMLToPDF = async (
  elementId: string,
  fileName: string
): Promise<void> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element nicht gefunden');
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * pageWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(fileName);
  } catch (error) {
    console.error('Error exporting HTML to PDF:', error);
    throw new Error('Fehler beim Exportieren als PDF');
  }
};

/**
 * Exportiert alle Dokumente als einzelne PDFs (ZIP würde extra Library benötigen)
 */
export const exportMultipleDocumentsToPDF = async (
  documents: Document[]
): Promise<void> => {
  try {
    for (const doc of documents) {
      await exportDocumentToPDF(doc);
      // Kleine Verzögerung zwischen Downloads
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  } catch (error) {
    console.error('Error exporting multiple PDFs:', error);
    throw new Error('Fehler beim Exportieren mehrerer PDFs');
  }
};
