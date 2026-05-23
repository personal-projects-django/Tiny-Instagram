import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { api } from '@/api/client'
const schema = z.object({
  username_or_email: z.string().min(1, 'این فیلد الزامی است'),
  password         : z.string().min(6, 'رمز عبور حداقل ۶ کاراکتر'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const navigate            = useNavigate()
  const { setTokens, setUser } = useAuthStore()
  const { language }        = useUIStore()
  const [showPass, setShowPass] = useState(false)
  const [serverError, setServerError] = useState('')

  const fa = language === 'fa'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setServerError('')
    try {
      const res = await authApi.login(data)
      setTokens(res.data.access_token, res.data.refresh_token)
      const meRes = await api.get('/account/me/')
      setUser({
        id      : res.data.user_id,
        username: meRes.data.username || res.data.username,
        avatar  : meRes.data.avatar || res.data.avatar || '',
      })
      navigate('/')
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'خطایی رخ داد'
      setServerError(msg)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
            TinyGram
          </h1>
          <p className="text-muted-foreground text-sm">
            {fa ? 'برای ادامه وارد شوید' : 'Sign in to continue'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">

          {serverError && (
            <div className="bg-destructive/10 text-destructive text-sm rounded-lg px-4 py-3 mb-4">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* username or email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                {fa ? 'نام کاربری یا ایمیل' : 'Username or Email'}
              </label>
              <input
                {...register('username_or_email')}
                type="text"
                autoComplete="username"
                placeholder={fa ? 'نام کاربری یا ایمیل' : 'Username or Email'}
                className="
                  w-full h-11 px-4 rounded-xl
                  bg-input border border-border
                  text-foreground placeholder:text-muted-foreground
                  text-sm outline-none
                  focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500
                  transition-all
                "
              />
              {errors.username_or_email && (
                <p className="text-destructive text-xs">{errors.username_or_email.message}</p>
              )}
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
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="
                    w-full h-11 px-4 pe-11 rounded-xl
                    bg-input border border-border
                    text-foreground placeholder:text-muted-foreground
                    text-sm outline-none
                    focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500
                    transition-all
                  "
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute inset-y-0 end-0 pe-3 flex items-center text-muted-foreground hover:text-foreground"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-destructive text-xs">{errors.password.message}</p>
              )}
            </div>

            {/* forgot password */}
            <div className="flex justify-end">
              <Link
                to="/forgot"
                className="text-xs text-purple-500 hover:text-purple-400 transition-colors"
              >
                {fa ? 'فراموشی رمز عبور' : 'Forgot password?'}
              </Link>
            </div>

            {/* submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="
                w-full h-11 rounded-xl font-medium text-sm
                bg-gradient-to-r from-purple-600 to-pink-600
                hover:from-purple-500 hover:to-pink-500
                text-white transition-all duration-200
                disabled:opacity-60 disabled:cursor-not-allowed
                flex items-center justify-center gap-2
              "
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {fa ? 'ورود' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Register link */}
        <p className="text-center text-sm text-muted-foreground mt-4">
          {fa ? 'حساب ندارید؟' : "Don't have an account?"}{' '}
          <Link to="/register" className="text-purple-500 hover:text-purple-400 font-medium transition-colors">
            {fa ? 'ثبت‌نام' : 'Sign Up'}
          </Link>
        </p>

      </div>
    </div>
  )
}