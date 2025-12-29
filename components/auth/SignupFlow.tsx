'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button, Input, Textarea } from '@/components/ui'
import { Avatar } from '@/components/ui/Avatar'
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Camera, 
  Check, 
  AlertCircle,
  ArrowRight,
  ArrowLeft
} from 'lucide-react'
import { signIn } from 'next-auth/react'

interface SignupData {
  username: string
  name: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  bio: string
  profilePhoto: string | null
}

const initialData: SignupData = {
  username: '',
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  bio: '',
  profilePhoto: null
}

export function SignupFlow() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<SignupData>(initialData)
  const [errors, setErrors] = useState<Partial<SignupData>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [teamWarning, setTeamWarning] = useState<string | null>(null)

  // Debounced username check
  const checkUsername = useCallback(async (username: string) => {
    if (username.length < 3) {
      setUsernameAvailable(null)
      return
    }

    setIsCheckingUsername(true)
    try {
      const res = await fetch(`/api/users/check-username?username=${encodeURIComponent(username)}`)
      const result = await res.json()
      
      setUsernameAvailable(result.available)
      if (result.isTeamUsername) {
        setTeamWarning(`This username is reserved for ${result.teamName}`)
      } else {
        setTeamWarning(null)
      }
    } catch (error) {
      console.error('Error checking username:', error)
    } finally {
      setIsCheckingUsername(false)
    }
  }, [])

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
    setData(prev => ({ ...prev, username: value }))
    setErrors(prev => ({ ...prev, username: undefined }))
    
    // Debounce check
    const timeoutId = setTimeout(() => {
      checkUsername(value)
    }, 500)
    
    return () => clearTimeout(timeoutId)
  }

  const handleInputChange = (field: keyof SignupData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setData(prev => ({ ...prev, [field]: e.target.value }))
    setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'image')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const result = await res.json()
      if (result.success) {
        setData(prev => ({ ...prev, profilePhoto: result.url }))
      }
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const validateStep1 = () => {
    const newErrors: Partial<SignupData> = {}
    
    if (!data.username || data.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    }
    if (!usernameAvailable) {
      newErrors.username = 'Username is not available'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors: Partial<SignupData> = {}
    
    if (!data.name) {
      newErrors.name = 'Name is required'
    }
    if (!data.email && !data.phone) {
      newErrors.email = 'Email or phone number is required'
    }
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      newErrors.email = 'Invalid email address'
    }
    if (!data.password || data.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }
    if (data.password !== data.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleStep1Submit = async () => {
    if (!validateStep1()) return

    setIsLoading(true)
    try {
      const res = await fetch('/api/users/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 1, username: data.username })
      })

      const result = await res.json()
      if (result.success) {
        setStep(2)
      } else {
        setErrors({ username: result.error })
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStep2Submit = async () => {
    if (!validateStep2()) return

    setIsLoading(true)
    try {
      const res = await fetch('/api/users/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 2,
          username: data.username,
          name: data.name,
          email: data.email || undefined,
          phone: data.phone || undefined,
          password: data.password
        })
      })

      const result = await res.json()
      if (result.success) {
        setStep(3)
      } else {
        setErrors({ email: result.error })
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStep3Submit = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/users/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 3,
          username: data.username,
          bio: data.bio || undefined,
          profilePhoto: data.profilePhoto || undefined
        })
      })

      const result = await res.json()
      if (result.success && result.completed) {
        // Auto login after signup
        const signInResult = await signIn('credentials', {
          login: data.username,
          password: data.password,
          redirect: false
        })

        if (signInResult?.ok) {
          router.push('/home')
        } else {
          router.push('/login')
        }
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            <span className="text-emerald-400">Fan</span>nax
          </h1>
          <p className="text-slate-400">Join the football community</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${
                  step >= s
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {step > s ? <Check size={20} /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`w-12 h-1 mx-2 rounded transition-all ${
                    step > s ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 backdrop-blur-sm">
          <AnimatePresence mode="wait" custom={step}>
            {step === 1 && (
              <motion.div
                key="step1"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-xl font-semibold text-white mb-2">Create your username</h2>
                <p className="text-slate-400 text-sm mb-6">
                  Choose a unique username for your Fannax account
                </p>

                <div className="space-y-4">
                  <div className="relative">
                    <Input
                      label="Username"
                      placeholder="Enter username"
                      value={data.username}
                      onChange={handleUsernameChange}
                      error={errors.username}
                      leftIcon={<User size={18} />}
                      rightIcon={
                        isCheckingUsername ? (
                          <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                        ) : usernameAvailable === true ? (
                          <Check className="text-emerald-500" size={18} />
                        ) : usernameAvailable === false ? (
                          <AlertCircle className="text-red-500" size={18} />
                        ) : null
                      }
                    />
                  </div>

                  {teamWarning && (
                    <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                      <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={16} />
                      <p className="text-amber-400 text-sm">{teamWarning}</p>
                    </div>
                  )}

                  <p className="text-slate-500 text-xs">
                    3-20 characters. Letters, numbers, and underscores only.
                  </p>

                  <Button
                    className="w-full"
                    onClick={handleStep1Submit}
                    isLoading={isLoading}
                    disabled={!usernameAvailable}
                    rightIcon={<ArrowRight size={18} />}
                  >
                    Continue
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-xl font-semibold text-white mb-2">Your details</h2>
                <p className="text-slate-400 text-sm mb-6">
                  Enter your name and contact information
                </p>

                <div className="space-y-4">
                  <Input
                    label="Full Name"
                    placeholder="Enter your name"
                    value={data.name}
                    onChange={handleInputChange('name')}
                    error={errors.name}
                    leftIcon={<User size={18} />}
                  />

                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="you@example.com"
                    value={data.email}
                    onChange={handleInputChange('email')}
                    error={errors.email}
                    leftIcon={<Mail size={18} />}
                  />

                  <div className="text-center text-slate-500 text-sm">or</div>

                  <Input
                    label="Phone Number"
                    type="tel"
                    placeholder="+1234567890"
                    value={data.phone}
                    onChange={handleInputChange('phone')}
                    leftIcon={<Phone size={18} />}
                  />

                  <Input
                    label="Password"
                    type="password"
                    placeholder="Create a password"
                    value={data.password}
                    onChange={handleInputChange('password')}
                    error={errors.password}
                    leftIcon={<Lock size={18} />}
                  />

                  <Input
                    label="Confirm Password"
                    type="password"
                    placeholder="Confirm your password"
                    value={data.confirmPassword}
                    onChange={handleInputChange('confirmPassword')}
                    error={errors.confirmPassword}
                    leftIcon={<Lock size={18} />}
                  />

                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      onClick={() => setStep(1)}
                      leftIcon={<ArrowLeft size={18} />}
                    >
                      Back
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleStep2Submit}
                      isLoading={isLoading}
                      rightIcon={<ArrowRight size={18} />}
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-xl font-semibold text-white mb-2">Complete your profile</h2>
                <p className="text-slate-400 text-sm mb-6">
                  Add a profile photo and tell us about yourself
                </p>

                <div className="space-y-6">
                  {/* Profile Photo Upload */}
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      <Avatar 
                        src={data.profilePhoto} 
                        size="xl"
                        alt={data.name}
                      />
                      <label className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-emerald-600 transition-colors">
                        <Camera size={16} className="text-white" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handlePhotoUpload}
                        />
                      </label>
                    </div>
                    <p className="text-slate-500 text-sm mt-2">Upload profile photo</p>
                  </div>

                  <Textarea
                    label="About Me"
                    placeholder="Tell us about yourself and your favorite football team..."
                    value={data.bio}
                    onChange={handleInputChange('bio')}
                    rows={4}
                    charCount
                    maxChars={500}
                  />

                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      onClick={() => setStep(2)}
                      leftIcon={<ArrowLeft size={18} />}
                    >
                      Back
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleStep3Submit}
                      isLoading={isLoading}
                    >
                      Complete Signup
                    </Button>
                  </div>

                  <button
                    onClick={handleStep3Submit}
                    className="w-full text-slate-400 text-sm hover:text-slate-300 transition-colors"
                  >
                    Skip for now
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Login Link */}
        <p className="text-center text-slate-400 mt-6">
          Already have an account?{' '}
          <a href="/login" className="text-emerald-400 hover:underline">
            Log in
          </a>
        </p>
      </div>
    </div>
  )
}

