import jsPDF from 'jspdf'
import { Document as DocxDocument, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } from 'docx'

export interface Document {
  id: number | string
  title: string
  category: string
  updated: string
  size?: string
  status: string
  content?: string
}

// Export single document to PDF
export const exportSingleDocumentPDF = (doc: Document) => {
  const pdf = new jsPDF()
  
  // Title
  pdf.setFontSize(20)
  pdf.setFont('helvetica', 'bold')
  pdf.text(doc.title, 20, 20)
  
  // Metadata
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(100)
  pdf.text(`Category: ${doc.category}`, 20, 30)
  pdf.text(`Status: ${doc.status}`, 20, 37)
  pdf.text(`Last Updated: ${doc.updated}`, 20, 44)
  
  // Reset
  pdf.setTextColor(0)
  pdf.setFontSize(10)
  
  // Content
  let yPosition = 60
  
  // Strip HTML tags for PDF
  const textContent = doc.content 
    ? stripHtmlTags(doc.content)
    : 'No content available'
  
  // Split into lines that fit the page width
  const lines = pdf.splitTextToSize(textContent, 170)
  
  lines.forEach((line: string) => {
    if (yPosition > 270) {
      pdf.addPage()
      yPosition = 20
    }
    pdf.text(line, 20, yPosition)
    yPosition += 7
  })
  
  // Footer
  pdf.setFontSize(8)
  pdf.setTextColor(150)
  pdf.text(
    `Page 1 of ${pdf.getNumberOfPages()}`,
    pdf.internal.pageSize.getWidth() - 40,
    pdf.internal.pageSize.getHeight() - 10
  )
  
  pdf.save(`${doc.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.pdf`)
}

// Export single document to Word
export const exportSingleDocumentWord = async (doc: Document) => {
  const children: Paragraph[] = []
  
  // Title
  children.push(
    new Paragraph({
      text: doc.title,
      heading: HeadingLevel.TITLE,
      spacing: { after: 200 },
    })
  )
  
  // Metadata
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Category: ', bold: true }),
        new TextRun({ text: doc.category }),
      ],
    })
  )
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Status: ', bold: true }),
        new TextRun({ text: doc.status }),
      ],
    })
  )
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Last Updated: ', bold: true }),
        new TextRun({ text: doc.updated }),
      ],
    })
  )
  
  children.push(new Paragraph({ text: '' }))
  children.push(new Paragraph({ text: '---', spacing: { after: 200 } }))
  
  // Content
  if (doc.content) {
    const textContent = stripHtmlTags(doc.content)
    const paragraphs = textContent.split('\n').filter(p => p.trim())
    
    paragraphs.forEach(p => {
      children.push(new Paragraph({ text: p.trim() }))
    })
  } else {
    children.push(new Paragraph({ text: 'No content available' }))
  }
  
  // Create document
  const docx = new DocxDocument({
    sections: [
      {
        properties: {},
        children: children,
      },
    ],
  })
  
  // Generate blob and download
  const blob = await Packer.toBlob(docx)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${doc.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.docx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Export single document to Markdown
export const exportSingleDocumentMarkdown = (doc: Document): string => {
  let markdown = `# ${doc.title}\n\n`
  markdown += `**Category:** ${doc.category}  \n`
  markdown += `**Status:** ${doc.status}  \n`
  markdown += `**Last Updated:** ${doc.updated}\n\n`
  markdown += `---\n\n`
  
  if (doc.content) {
    const textContent = stripHtmlTags(doc.content)
    markdown += textContent
  } else {
    markdown += 'No content available'
  }
  
  return markdown
}

// Export single document to JSON
export const exportSingleDocumentJSON = (doc: Document) => {
  const data = {
    title: doc.title,
    category: doc.category,
    status: doc.status,
    updated: doc.updated,
    content: doc.content,
    exportDate: new Date().toISOString(),
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${doc.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Helper function to strip HTML tags
const stripHtmlTags = (html: string): string => {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  
  // Convert list items to text
  tmp.querySelectorAll('li').forEach(li => {
    li.textContent = `• ${li.textContent}`
  })
  
  // Convert headings
  tmp.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
    const level = parseInt(heading.tagName.charAt(1))
    const prefix = '#'.repeat(level) + ' '
    heading.textContent = prefix + heading.textContent
  })
  
  // Convert tables to text
  tmp.querySelectorAll('table').forEach(table => {
    const rows = Array.from(table.querySelectorAll('tr'))
    const textRows = rows.map(row => {
      const cells = Array.from(row.querySelectorAll('th, td'))
      return cells.map(cell => cell.textContent).join(' | ')
    })
    table.textContent = '\n' + textRows.join('\n') + '\n'
  })
  
  // Get text with line breaks preserved
  let text = tmp.innerText || tmp.textContent || ''
  
  // Clean up extra whitespace
  text = text.replace(/\n{3,}/g, '\n\n')
  text = text.trim()
  
  return text
}

// Export list of documents to PDF
export const exportToPDF = (documents: Document[], title: string = 'IT Documentation Export') => {
  const doc = new jsPDF()
  
  // Title
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 20, 20)
  
  // Subtitle
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100)
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 30)
  doc.text(`Total Documents: ${documents.length}`, 20, 38)
  
  // Reset color
  doc.setTextColor(0)
  doc.setFontSize(10)
  
  let yPosition = 50
  
  // Documents list
  documents.forEach((document, index) => {
    // Check if we need a new page
    if (yPosition > 270) {
      doc.addPage()
      yPosition = 20
    }
    
    // Document header
    doc.setFont('helvetica', 'bold')
    doc.text(`${index + 1}. ${document.title}`, 20, yPosition)
    yPosition += 6
    
    // Document details
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(80)
    doc.text(`Category: ${document.category} | Status: ${document.status}`, 25, yPosition)
    yPosition += 5
    doc.text(`Last Updated: ${document.updated}`, 25, yPosition)
    
    // Reset
    doc.setTextColor(0)
    doc.setFontSize(10)
    yPosition += 8
  })
  
  // Footer on last page
  const pageCount = doc.getNumberOfPages()
  doc.setFontSize(8)
  doc.setTextColor(150)
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() - 40, doc.internal.pageSize.getHeight() - 10)
  }
  
  // Save
  doc.save(`${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`)
}

// Export list of documents to Markdown
export const exportToMarkdown = (documents: Document[]): string => {
  let markdown = `# IT Documentation Export\n\n`
  markdown += `Generated on ${new Date().toLocaleString()}\n\n`
  markdown += `Total Documents: ${documents.length}\n\n`
  markdown += `---\n\n`
  
  markdown += `## Documents List\n\n`
  markdown += `| Document | Category | Status | Last Updated |\n`
  markdown += `|----------|----------|--------|-------------|\n`
  
  documents.forEach(doc => {
    markdown += `| ${doc.title} | ${doc.category} | ${doc.status} | ${doc.updated} |\n`
  })
  
  markdown += `\n---\n\n`
  
  // Group by category
  const categories = [...new Set(documents.map(d => d.category))]
  
  markdown += `## Documents by Category\n\n`
  
  categories.forEach(category => {
    const categoryDocs = documents.filter(d => d.category === category)
    markdown += `### ${category} (${categoryDocs.length})\n\n`
    categoryDocs.forEach(doc => {
      markdown += `- **${doc.title}** - ${doc.status} - ${doc.updated}\n`
    })
    markdown += `\n`
  })
  
  return markdown
}

// Download markdown content
export const downloadMarkdown = (content: string, filename: string = 'documentation-export') => {
  const blob = new Blob([content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}-${Date.now()}.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Export list of documents to JSON
export const exportToJSON = (documents: Document[]) => {
  const data = {
    exportDate: new Date().toISOString(),
    totalDocuments: documents.length,
    documents: documents
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `documentation-export-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Export list of documents to Word
export const exportToWord = async (documents: Document[], title: string = 'IT Documentation Export') => {
  const children: Paragraph[] = []
  
  // Title
  children.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.TITLE,
      spacing: { after: 200 },
    })
  )
  
  // Subtitle
  children.push(
    new Paragraph({
      text: `Generated on ${new Date().toLocaleString()}`,
      children: [
        new TextRun({ text: `Total Documents: ${documents.length}`, bold: true }),
      ],
    })
  )
  
  children.push(new Paragraph({ text: '' }))
  
  // Table
  const tableRows: TableRow[] = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph('Document')], width: { size: 40, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph('Category')], width: { size: 20, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph('Status')], width: { size: 20, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph('Last Updated')], width: { size: 20, type: WidthType.PERCENTAGE } }),
      ],
      tableHeader: true,
    }),
  ]
  
  documents.forEach(doc => {
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(doc.title)] }),
          new TableCell({ children: [new Paragraph(doc.category)] }),
          new TableCell({ children: [new Paragraph(doc.status)] }),
          new TableCell({ children: [new Paragraph(doc.updated)] }),
        ],
      })
    )
  })
  
  children.push(
    new Table({
      rows: tableRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
    })
  )
  
  children.push(new Paragraph({ text: '' }))
  
  // Group by category
  const categories = [...new Set(documents.map(d => d.category))]
  
  categories.forEach(category => {
    const categoryDocs = documents.filter(d => d.category === category)
    
    children.push(
      new Paragraph({
        text: category,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 200 },
      })
    )
    
    categoryDocs.forEach(doc => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: doc.title, bold: true }),
            new TextRun({ text: ` - ${doc.status} - ${doc.updated}` }),
          ],
        })
      )
    })
    
    children.push(new Paragraph({ text: '' }))
  })
  
  // Create document
  const doc = new DocxDocument({
    sections: [
      {
        properties: {},
        children: children,
      },
    ],
  })
  
  // Generate blob and download
  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.docx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
