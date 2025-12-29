'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { getMentionSuggestionQuery, insertMention } from '@/lib/mentions'
import { Loader2 } from 'lucide-react'

interface Player {
  id: string
  name: string
  displayName: string
  nationality: string | null
  position: string | null
  photoUrl: string | null
  isRetired: boolean
}

interface User {
  id: string
  username: string
  name: string
  profilePhoto: string | null
}

interface MentionInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  rows?: number
}

export function MentionInput({
  value,
  onChange,
  placeholder,
  className,
  rows = 3
}: MentionInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<(Player | User)[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [cursorPosition, setCursorPosition] = useState(0)

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    setIsLoading(true)
    try {
      // Fetch both players and users
      const [playersRes, usersRes] = await Promise.all([
        fetch(`/api/players?q=${encodeURIComponent(query)}&limit=5`),
        fetch(`/api/users/search?q=${encodeURIComponent(query)}&limit=5`)
      ])

      const playersData = await playersRes.json()
      const usersData = await usersRes.json()

      const allSuggestions = [
        ...(usersData.users || []),
        ...(playersData.players || [])
      ]

      setSuggestions(allSuggestions)
      setShowSuggestions(allSuggestions.length > 0)
      setSelectedIndex(0)
    } catch (error) {
      console.error('Error fetching suggestions:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const newPosition = e.target.selectionStart || 0
    
    onChange(newValue)
    setCursorPosition(newPosition)

    // Check for @mention trigger
    const query = getMentionSuggestionQuery(newValue, newPosition)
    if (query !== null) {
      fetchSuggestions(query)
    } else {
      setShowSuggestions(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      case 'Enter':
      case 'Tab':
        if (suggestions[selectedIndex]) {
          e.preventDefault()
          selectSuggestion(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        break
    }
  }

  const selectSuggestion = (suggestion: Player | User) => {
    const username = 'username' in suggestion 
      ? suggestion.username 
      : suggestion.displayName.replace(/\s+/g, '')

    const result = insertMention(value, cursorPosition, username)
    onChange(result.newText)
    setShowSuggestions(false)

    // Focus and set cursor position
    if (textareaRef.current) {
      textareaRef.current.focus()
      setTimeout(() => {
        textareaRef.current?.setSelectionRange(
          result.newCursorPosition,
          result.newCursorPosition
        )
      }, 0)
    }
  }

  const isPlayer = (item: Player | User): item is Player => {
    return 'displayName' in item
  }

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className={`w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all duration-200 resize-none ${className}`}
      />

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-lg overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
            </div>
          ) : suggestions.length > 0 ? (
            <ul>
              {suggestions.map((suggestion, index) => (
                <li key={isPlayer(suggestion) ? `p-${suggestion.id}` : `u-${suggestion.id}`}>
                  <button
                    type="button"
                    onClick={() => selectSuggestion(suggestion)}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                      index === selectedIndex
                        ? 'bg-emerald-500/10'
                        : 'hover:bg-slate-700/50'
                    }`}
                  >
                    <Avatar
                      src={isPlayer(suggestion) ? suggestion.photoUrl : suggestion.profilePhoto}
                      alt={isPlayer(suggestion) ? suggestion.name : suggestion.name}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm truncate">
                        {isPlayer(suggestion) ? suggestion.displayName : suggestion.name}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {isPlayer(suggestion) 
                          ? `${suggestion.position || 'Player'}${suggestion.isRetired ? ' (Retired)' : ''}`
                          : `@${suggestion.username}`
                        }
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      isPlayer(suggestion)
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {isPlayer(suggestion) ? 'Player' : 'User'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-4 text-center text-slate-400 text-sm">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  )
}

