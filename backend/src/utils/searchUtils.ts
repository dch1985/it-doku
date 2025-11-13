/**
 * Search utility functions for text matching, scoring, and highlighting
 */

/**
 * Calculate relevance score for a search result
 * Higher score = better match
 */
export function calculateRelevanceScore(text: string, query: string, field: 'title' | 'content' | 'other'): number {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  
  // Base score starts at 0
  let score = 0;
  
  // Exact match in title gets highest score
  if (field === 'title' && lowerText === lowerQuery) {
    score += 100;
  }
  
  // Title starts with query
  if (field === 'title' && lowerText.startsWith(lowerQuery)) {
    score += 50;
  }
  
  // Title contains query
  if (field === 'title' && lowerText.includes(lowerQuery)) {
    score += 25;
  }
  
  // Content exact match
  if (field === 'content' && lowerText === lowerQuery) {
    score += 80;
  }
  
  // Content starts with query
  if (field === 'content' && lowerText.startsWith(lowerQuery)) {
    score += 30;
  }
  
  // Content contains query
  if (field === 'content' && lowerText.includes(lowerQuery)) {
    score += 10;
  }
  
  // Word boundary matches (each word)
  const queryWords = lowerQuery.split(/\s+/);
  queryWords.forEach(word => {
    if (word.length > 2 && lowerText.includes(word)) {
      score += 5;
    }
  });
  
  // Proximity bonus: query length vs text length
  const queryLength = query.length;
  const textLength = text.length;
  if (textLength > 0) {
    const ratio = queryLength / textLength;
    score += ratio * 5; // Shorter texts with match are more relevant
  }
  
  return score;
}

/**
 * Highlight search terms in text
 */
export function highlightSearchTerms(text: string, query: string): string {
  if (!text || !query) return text;
  
  const terms = query.trim().split(/\s+/).filter(term => term.length > 0);
  let highlighted = text;
  
  terms.forEach(term => {
    if (term.length > 2) {
      const regex = new RegExp(`(${escapeRegex(term)})`, 'gi');
      highlighted = highlighted.replace(regex, '<mark>$1</mark>');
    }
  });
  
  return highlighted;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Find matches with context (for content previews)
 */
export function findMatchesWithContext(text: string, query: string, contextLength: number = 100): string[] {
  if (!text || !query) return [];
  
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase().trim();
  
  // Remove HTML tags for searching
  const cleanText = text.replace(/<[^>]*>/g, ' ');
  const matches: string[] = [];
  
  const terms = lowerQuery.split(/\s+/).filter(term => term.length > 2);
  terms.forEach(term => {
    const regex = new RegExp(escapeRegex(term), 'gi');
    const matchPositions: number[] = [];
    
    let match;
    while ((match = regex.exec(cleanText)) !== null) {
      matchPositions.push(match.index);
    }
    
    matchPositions.forEach(pos => {
      const start = Math.max(0, pos - contextLength);
      const end = Math.min(cleanText.length, pos + term.length + contextLength);
      let snippet = cleanText.substring(start, end).trim();
      
      // Add ellipsis if needed
      if (start > 0) snippet = '... ' + snippet;
      if (end < cleanText.length) snippet = snippet + ' ...';
      
      matches.push(snippet);
    });
  });
  
  // Remove duplicates and limit
  return [...new Set(matches)].slice(0, 3);
}

/**
 * Get best match context from content
 */
export function getBestMatchContext(text: string, query: string, maxLength: number = 200): string {
  const matches = findMatchesWithContext(text, query, 50);
  if (matches.length > 0) {
    // Return the first match, truncated if needed
    let result = matches[0];
    if (result.length > maxLength) {
      result = result.substring(0, maxLength) + '...';
    }
    return result;
  }
  
  // Fallback: return beginning of text
  const cleanText = text.replace(/<[^>]*>/g, ' ').trim();
  if (cleanText.length > maxLength) {
    return cleanText.substring(0, maxLength) + '...';
  }
  return cleanText;
}

