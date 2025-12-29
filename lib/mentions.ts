// @mention parsing and tagging system for Fannax

export interface MentionMatch {
  fullMatch: string
  username: string
  startIndex: number
  endIndex: number
}

/**
 * Extract all @mentions from text content
 */
export function extractMentions(text: string): MentionMatch[] {
  const mentionRegex = /@([a-zA-Z0-9_]+)/g
  const mentions: MentionMatch[] = []
  let match

  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push({
      fullMatch: match[0],
      username: match[1],
      startIndex: match.index,
      endIndex: match.index + match[0].length
    })
  }

  return mentions
}

/**
 * Get unique usernames from mentions
 */
export function getUniqueMentions(text: string): string[] {
  const mentions = extractMentions(text)
  return [...new Set(mentions.map(m => m.username.toLowerCase()))]
}

/**
 * Highlight mentions in text by wrapping them with HTML
 */
export function highlightMentions(text: string): string {
  return text.replace(
    /@([a-zA-Z0-9_]+)/g,
    '<span class="text-emerald-400 hover:underline cursor-pointer">@$1</span>'
  )
}

/**
 * Convert mentions to React-friendly format with links
 */
export function parseMentionsToLinks(text: string): { type: 'text' | 'mention'; content: string }[] {
  const parts: { type: 'text' | 'mention'; content: string }[] = []
  const mentionRegex = /@([a-zA-Z0-9_]+)/g
  let lastIndex = 0
  let match

  while ((match = mentionRegex.exec(text)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex, match.index)
      })
    }

    // Add mention
    parts.push({
      type: 'mention',
      content: match[1]
    })

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.slice(lastIndex)
    })
  }

  return parts
}

/**
 * Search for players/users that match the current mention input
 */
export function getMentionSuggestionQuery(text: string, cursorPosition: number): string | null {
  // Look backwards from cursor to find @ symbol
  const textBeforeCursor = text.slice(0, cursorPosition)
  const lastAtIndex = textBeforeCursor.lastIndexOf('@')
  
  if (lastAtIndex === -1) return null
  
  // Check if there's a space between @ and cursor
  const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1)
  if (textAfterAt.includes(' ')) return null
  
  return textAfterAt
}

/**
 * Insert mention into text at cursor position
 */
export function insertMention(
  text: string,
  cursorPosition: number,
  username: string
): { newText: string; newCursorPosition: number } {
  const textBeforeCursor = text.slice(0, cursorPosition)
  const lastAtIndex = textBeforeCursor.lastIndexOf('@')
  
  if (lastAtIndex === -1) {
    return { newText: text, newCursorPosition: cursorPosition }
  }
  
  const beforeMention = text.slice(0, lastAtIndex)
  const afterCursor = text.slice(cursorPosition)
  
  const newText = `${beforeMention}@${username} ${afterCursor}`
  const newCursorPosition = lastAtIndex + username.length + 2 // +2 for @ and space
  
  return { newText, newCursorPosition }
}

/**
 * Validate username format for mentions
 */
export function isValidMentionUsername(username: string): boolean {
  return /^[a-zA-Z0-9_]{1,20}$/.test(username)
}

/**
 * Extract hashtags from text (for future use)
 */
export function extractHashtags(text: string): string[] {
  const hashtagRegex = /#([a-zA-Z0-9_]+)/g
  const hashtags: string[] = []
  let match

  while ((match = hashtagRegex.exec(text)) !== null) {
    hashtags.push(match[1])
  }

  return [...new Set(hashtags)]
}

