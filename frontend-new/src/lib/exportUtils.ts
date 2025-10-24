import jsPDF from 'jspdf'

interface Document {
  id: number
  title: string
  category: string
  updated: string
  size: string
  status: string
}

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
    doc.text(`Category: ${document.category} | Status: ${document.status} | Size: ${document.size}`, 25, yPosition)
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

export const exportToMarkdown = (documents: Document[]): string => {
  let markdown = `# IT Documentation Export\n\n`
  markdown += `Generated on ${new Date().toLocaleString()}\n\n`
  markdown += `Total Documents: ${documents.length}\n\n`
  markdown += `---\n\n`
  
  markdown += `## Documents List\n\n`
  markdown += `| Document | Category | Status | Size | Last Updated |\n`
  markdown += `|----------|----------|--------|------|-------------|\n`
  
  documents.forEach(doc => {
    markdown += `| ${doc.title} | ${doc.category} | ${doc.status} | ${doc.size} | ${doc.updated} |\n`
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