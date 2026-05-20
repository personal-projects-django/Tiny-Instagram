import { api } from './client'

export const followApi = {
  toggle      : (username: string) => api.post(`/follow/${username}/follow/`).then(r => r.data),
  followers   : (username: string) => api.get(`/follow/${username}/followers/`).then(r => r.data),
  following   : (username: string) => api.get(`/follow/${username}/following/`).then(r => r.data),
  suggested   : () => api.get('/follow/suggested/').then(r => r.data),
  requests    : () => api.get('/follow/requests/').then(r => r.data),
  handleRequest: (id: number, action: 'accept' | 'reject') =>
    api.post(`/follow/requests/${id}/`, { action }).then(r => r.data),
}