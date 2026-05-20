import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { authApi } from '@/api/auth'
import { useUIStore } from '@/store/uiStore'

const schema = z.object({
  username : z.string().min(3, 'حداقل ۳ کاراکتر').max(50),
  email    : z.string().email('ایمیل معتبر وارد کنید'),
  phone    : z.string().optional(),
  password : z.string().min(8, 'حداقل ۸ کاراکتر'),
  password2: z.string(),
}).refine(d => d.password === d.password2, {
  message: 'رمزها یکسان نیستند',
  path   : ['password2'],
})
type FormData = z.infer<typeof schema>

type Step = 'register' | 'verify'

export default function RegisterPage() {
  const navigate     = useNavigate()
  const { language } = useUIStore()
  const fa           = language === 'fa'

  const [step, setStep]           = useState<Step>('register')
  const [email, setEmail]         = useState('')
  const [otp, setOtp]             = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [serverError, setServerError] = useState('')
  const [otpLoading, setOtpLoading]   = useState(false)
  const [resendLoading, setResendLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  // گام ۱: ثبت‌نام
  const onSubmit = async (data: FormData) => {
    setServerError('')
    try {
      await authApi.register(data)
      setEmail(data.email)
      setStep('verify')
    } catch (err: any) {
      const d = err.response?.data
      setServerError(
        d?.email?.[0] || d?.username?.[0] || d?.detail || 'خطایی رخ داد'
      )
    }
  }

  // گام ۲: تأیید OTP
  const handleVerify = async () => {
    if (otp.length !== 6) return
    setOtpLoading(true)
    setServerError('')
    try {
      await authApi.verifyOtp({ email, otp })
      navigate('/login?verified=1')
    } catch (err: any) {
      setServerError(err.response?.data?.detail || 'کد اشتباه است')
    } finally {
      setOtpLoading(false)
    }
  }

  const handleResend = async () => {
    setResendLoading(true)
    try {
      await authApi.resendOtp(email)
    } finally {
      setResendLoading(false)
    }
  }

  // ===== OTP Step =====
  if (step === 'verify') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📧</span>
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              {fa ? 'تأیید ایمیل' : 'Verify Email'}
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              {fa ? `کد ۶ رقمی به ${email} ارسال شد` : `Code sent to ${email}`}
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            {serverError && (
              <div className="bg-destructive/10 text-destructive text-sm rounded-lg px-4 py-3 mb-4">
                {serverError}
              </div>
            )}

            <div className="space-y-4">
              <input
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                type="text"
                inputMode="numeric"
                placeholder="------"
                maxLength={6}
                className="
                  w-full h-14 px-4 rounded-xl text-center
                  bg-input border border-border
                  text-foreground text-2xl tracking-[0.5em]
                  outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500
                  transition-all
                "
              />

              <button
                onClick={handleVerify}
                disabled={otp.length !== 6 || otpLoading}
                className="
                  w-full h-11 rounded-xl font-medium text-sm text-white
                  bg-gradient-to-r from-purple-600 to-pink-600
                  hover:from-purple-500 hover:to-pink-500
                  disabled:opacity-60 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2 transition-all
                "
              >
                {otpLoading && <Loader2 size={16} className="animate-spin" />}
                {fa ? 'تأیید' : 'Verify'}
              </button>

              <button
                onClick={handleResend}
                disabled={resendLoading}
                className="w-full text-sm text-purple-500 hover:text-purple-400 transition-colors py-1"
              >
                {resendLoading
                  ? (fa ? 'در حال ارسال...' : 'Sending...')
                  : (fa ? 'ارسال مجدد کد' : 'Resend code')
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ===== Register Step =====
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
            TinyGram
          </h1>
          <p className="text-muted-foreground text-sm">
            {fa ? 'ساخت حساب جدید' : 'Create your account'}
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          {serverError && (
            <div className="bg-destructive/10 text-destructive text-sm rounded-lg px-4 py-3 mb-4">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* username */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                {fa ? 'نام کاربری' : 'Username'}
              </label>
              <input
                {...register('username')}
                type="text"
                autoComplete="username"
                placeholder={fa ? 'نام کاربری' : 'Username'}
                className="w-full h-11 px-4 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all"
              />
              {errors.username && <p className="text-destructive text-xs">{errors.username.message}</p>}
            </div>

            {/* email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                {fa ? 'ایمیل' : 'Email'}
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="example@email.com"
                className="w-full h-11 px-4 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all"
              />
              {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
            </div>

            {/* phone — optional */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                {fa ? 'شماره موبایل (اختیاری)' : 'Phone (optional)'}
              </label>
              <input
                {...register('phone')}
                type="tel"
                placeholder="09xxxxxxxxx"
                className="w-full h-11 px-4 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all"
              />
            </div>

            {/* password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                {fa ? 'رمز عبور' : 'Password'}
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full h-11 px-4 pe-11 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute inset-y-0 end-0 pe-3 flex items-center text-muted-foreground hover:text-foreground"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
            </div>

            {/* confirm password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                {fa ? 'تکرار رمز عبور' : 'Confirm Password'}
              </label>
              <input
                {...register('password2')}
                type="password"
                placeholder="••••••••"
                className="w-full h-11 px-4 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all"
              />
              {errors.password2 && <p className="text-destructive text-xs">{errors.password2.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {fa ? 'ثبت‌نام' : 'Sign Up'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          {fa ? 'حساب دارید؟' : 'Already have an account?'}{' '}
          <Link to="/login" className="text-purple-500 hover:text-purple-400 font-medium transition-colors">
            {fa ? 'ورود' : 'Sign In'}
          </Link>
        </p>
      </div>
    </div>
  )
}