import { api } from './client'

export const profileApi = {
  getMe: () =>
    api.get('/account/me/').then(r => r.data),

  updateMe: (data: FormData | Record<string, any>) =>
    api.patch('/account/me/', data, {
      headers: data instanceof FormData
        ? { 'Content-Type': 'multipart/form-data' }
        : {},
    }).then(r => r.data),

  getPublic: (username: string) =>
    api.get(`/account/${username}/`).then(r => r.data),

  changePassword: (data: { old_password: string; new_password: string }) =>
    api.post('/account/password-change/', data).then(r => r.data),

  deleteAccount: (password: string) =>
    api.delete('/account/delete-account/', { data: { password } }),

  searchUsers: (q: string) =>
    api.get('/account/search/', { params: { q } }).then(r => r.data),
}