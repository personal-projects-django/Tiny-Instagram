import { api } from './client'

export const notificationApi = {
  getAll    : (params?: { unread?: boolean; page?: number }) =>
    api.get('/notification/', { params }).then(r => r.data),

  getCount  : () =>
    api.get('/notification/unread-count/').then(r => r.data),

  markRead  : (id: number) =>
    api.post(`/notification/${id}/read/`).then(r => r.data),

  markAllRead: () =>
    api.post('/notification/read-all/').then(r => r.data),

  delete    : (id: number) =>
    api.delete(`/notification/${id}/`),
}