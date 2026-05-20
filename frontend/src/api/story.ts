import { api } from './client'

export const storyApi = {
  getFeed   : () => api.get('/story/').then(r => r.data),
  getMine   : () => api.get('/story/me/').then(r => r.data),
  create    : (data: FormData) =>
    api.post('/story/create/', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(r => r.data),
  getDetail : (id: number)       => api.get(`/story/${id}/`).then(r => r.data),
  delete    : (id: number)       => api.delete(`/story/${id}/delete/`),
  toggleLike: (id: number, emoji = '❤️') =>
    api.post(`/story/${id}/like/`, { emoji }).then(r => r.data),
  reply     : (id: number, text: string) =>
    api.post(`/story/${id}/reply/`, { text }).then(r => r.data),
  viewers   : (id: number) => api.get(`/story/${id}/viewers/`).then(r => r.data),
  getMyReplies : () => api.get('/story/replies/').then(r => r.data),
  getArchive   : () => api.get('/story/archive/').then(r => r.data),
}