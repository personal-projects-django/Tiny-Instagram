import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Mail } from 'lucide-react'
import { authApi } from '@/api/auth'
import { useUIStore } from '@/store/uiStore'

export default function ForgotPasswordPage() {
  const { language } = useUIStore()
  const fa = language === 'fa'
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authApi.forgotPassword(email)
      setSent(true)
    } catch {
      setError(fa ? 'خطا در ارسال' : 'Failed to send')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
            <Mail size={28} className="text-white" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {fa ? 'ایمیل ارسال شد' : 'Email sent'}
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            {fa ? 'لینک بازیابی به ایمیل شما ارسال شد' : 'Check your email for reset link'}
          </p>
          <Link to="/login" className="text-purple-500 hover:text-purple-400 text-sm">
            {fa ? 'بازگشت به ورود' : 'Back to login'}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent text-center mb-2">
          TinyGram
        </h1>
        <p className="text-center text-muted-foreground text-sm mb-6">
          {fa ? 'بازیابی رمز عبور' : 'Reset password'}
        </p>

        <div className="bg-card border border-border rounded-2xl p-6">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm rounded-lg px-4 py-3 mb-4">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={fa ? 'ایمیل' : 'Email'}
              required
              className="w-full h-11 px-4 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {fa ? 'ارسال لینک بازیابی' : 'Send reset link'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          <Link to="/login" className="text-purple-500 hover:text-purple-400">
            {fa ? '← بازگشت' : '← Back'}
          </Link>
        </p>
      </div>
    </div>
  )
}