'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  charCount?: boolean
  maxChars?: number
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, charCount, maxChars, value, ...props }, ref) => {
    const currentLength = typeof value === 'string' ? value.length : 0

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          value={value}
          className={cn(
            'w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500',
            'focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500',
            'transition-all duration-200 resize-none',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            className
          )}
          {...props}
        />
        <div className="flex justify-between items-center mt-1.5">
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
          {charCount && maxChars && (
            <p className={cn(
              'text-sm ml-auto',
              currentLength > maxChars ? 'text-red-400' : 'text-slate-500'
            )}>
              {currentLength}/{maxChars}
            </p>
          )}
        </div>
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export { Textarea }

