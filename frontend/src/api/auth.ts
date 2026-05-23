import { api } from './client'

export const authApi = {
  register: (data: {
    username: string
    email   : string
    phone?  : string
    password: string
    password2: string
  }) => api.post('/account/register/', data),

  verifyOtp: (data: { email: string; otp: string }) =>
    api.post('/account/verify-otp/', data),

  resendOtp: (email: string) =>
    api.post('/account/resend-otp/', { email }),

  login: (data: { username_or_email: string; password: string }) =>
    api.post<{
      access_token : string
      refresh_token: string
      user_id      : number
      username     : string
      avatar       : string
    }>('/account/login/', data),

  logout: (refresh_token: string) =>
    api.post('/account/logout/', { refresh_token }),

  forgotPassword: (email: string) =>
    api.post('/account/password-reset/', { email }),
}