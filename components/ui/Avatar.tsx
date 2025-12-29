'use client'

import { cn } from '@/lib/utils'
import { User } from 'lucide-react'
import Image from 'next/image'

interface AvatarProps {
  src?: string | null
  alt?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  onClick?: () => void
}

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
  xl: 'w-20 h-20'
}

const iconSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 28,
  xl: 40
}

export function Avatar({ src, alt = 'User', size = 'md', className, onClick }: AvatarProps) {
  const baseClasses = cn(
    'rounded-full overflow-hidden bg-slate-700 flex items-center justify-center',
    sizeClasses[size],
    onClick && 'cursor-pointer hover:ring-2 hover:ring-emerald-500 transition-all',
    className
  )

  if (src) {
    return (
      <div className={baseClasses} onClick={onClick}>
        <Image
          src={src}
          alt={alt}
          width={parseInt(sizeClasses[size].split('-')[1]) * 4}
          height={parseInt(sizeClasses[size].split('-')[1]) * 4}
          className="w-full h-full object-cover"
        />
      </div>
    )
  }

  return (
    <div className={baseClasses} onClick={onClick}>
      <User className="text-slate-400" size={iconSizes[size]} />
    </div>
  )
}

