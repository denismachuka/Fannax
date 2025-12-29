'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button, Input } from '@/components/ui'
import { User, Lock, LogIn } from 'lucide-react'

export function LoginForm() {
  const router = useRouter()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        login,
        password,
        redirect: false
      })

      if (result?.error) {
        setError('Invalid username/email or password')
      } else if (result?.ok) {
        router.push('/home')
        router.refresh()
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            <span className="text-emerald-400">Fan</span>nax
          </h1>
          <p className="text-slate-400">Welcome back to the community</p>
        </div>

        {/* Login Form */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-white mb-6">Log in to your account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <Input
              label="Username or Email"
              placeholder="Enter username or email"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              leftIcon={<User size={18} />}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock size={18} />}
              required
            />

            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
              rightIcon={<LogIn size={18} />}
            >
              Log In
            </Button>
          </form>

          <div className="mt-4 text-center">
            <a href="#" className="text-emerald-400 text-sm hover:underline">
              Forgot your password?
            </a>
          </div>
        </div>

        {/* Signup Link */}
        <p className="text-center text-slate-400 mt-6">
          Don&apos;t have an account?{' '}
          <a href="/signup" className="text-emerald-400 hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  )
}

