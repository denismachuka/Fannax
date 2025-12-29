import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Trophy, Users, Target, TrendingUp, ArrowRight } from 'lucide-react'

export default async function LandingPage() {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/716151d5-b5ff-4d89-a3f2-8421e03cf581',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/page.tsx:LandingPage',message:'Landing page rendering - before auth check',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  
  let session = null;
  try {
    session = await auth()
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/716151d5-b5ff-4d89-a3f2-8421e03cf581',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/page.tsx:after-auth',message:'Auth check completed',data:{hasSession:!!session,userId:session?.user?.id},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
  } catch (error: unknown) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/716151d5-b5ff-4d89-a3f2-8421e03cf581',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/page.tsx:auth-error',message:'Auth check failed',data:{error:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
  }

  if (session?.user) {
    redirect('/home')
  }

  return (
    <div className="min-h-screen bg-slate-900 overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-emerald-500/5 to-transparent rounded-full" />
      </div>

      {/* Header */}
      <header className="relative z-10 container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">
              <span className="text-emerald-400">Fan</span>nax
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-slate-300 hover:text-white transition-colors px-4 py-2"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-xl font-medium transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 container mx-auto px-4 pt-20 pb-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2 mb-8">
            <span className="text-emerald-400 text-sm font-medium">
              The #1 Football Prediction Platform
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Predict. Compete.
            <span className="block text-emerald-400">Dominate.</span>
          </h1>

          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            Join the ultimate football social network. Make predictions, follow your favorite teams, 
            connect with fans worldwide, and climb the leaderboard.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:scale-105"
            >
              Get Started Free
              <ArrowRight size={20} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all border border-slate-700"
            >
              Already a member?
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            icon={<Target className="w-8 h-8" />}
            title="Match Predictions"
            description="Predict scores for matches worldwide and earn points for accuracy."
            color="emerald"
          />
          <FeatureCard
            icon={<Trophy className="w-8 h-8" />}
            title="Leaderboards"
            description="Compete with fans globally and climb the prediction rankings."
            color="amber"
          />
          <FeatureCard
            icon={<Users className="w-8 h-8" />}
            title="Social Feed"
            description="Share posts, polls, and predictions with the community."
            color="blue"
          />
          <FeatureCard
            icon={<TrendingUp className="w-8 h-8" />}
            title="Real-time Updates"
            description="Get live match scores and instant prediction results."
            color="purple"
          />
        </div>

        {/* Stats */}
        <div className="mt-32 bg-slate-800/30 border border-slate-700 rounded-3xl p-8 md:p-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <StatCard value="1000+" label="Active Predictors" />
            <StatCard value="500+" label="Football Teams" />
            <StatCard value="10k+" label="Predictions Made" />
            <StatCard value="99%" label="Uptime" />
          </div>
        </div>

        {/* CTA */}
        <div className="mt-32 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to prove your football knowledge?
          </h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">
            Join thousands of football fans making predictions and competing for the top spot.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-10 py-4 rounded-xl font-semibold text-lg transition-all hover:scale-105"
          >
            Create Free Account
            <ArrowRight size={20} />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-emerald-400" />
              <span className="text-xl font-bold text-white">
                <span className="text-emerald-400">Fan</span>nax
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <Link href="/about" className="hover:text-white transition-colors">About</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/help" className="hover:text-white transition-colors">Help</Link>
            </div>
            <p className="text-sm text-slate-500">
              © 2025 Fannax. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ 
  icon, 
  title, 
  description, 
  color 
}: { 
  icon: React.ReactNode
  title: string
  description: string
  color: 'emerald' | 'amber' | 'blue' | 'purple'
}) {
  const colors = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 hover:border-slate-600 transition-all hover:-translate-y-1">
      <div className={`w-14 h-14 ${colors[color]} rounded-xl flex items-center justify-center mb-4 border`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm">{description}</p>
    </div>
  )
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-3xl md:text-4xl font-bold text-emerald-400 mb-2">{value}</p>
      <p className="text-slate-400 text-sm">{label}</p>
    </div>
  )
}
