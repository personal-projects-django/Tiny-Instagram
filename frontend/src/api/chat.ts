import { api } from './client'

export const chatApi = {
  // Rooms
  getRooms: () => api.get('/chat/rooms/').then(r => r.data),
  getRoom : (id: number) => api.get(`/chat/rooms/${id}/`).then(r => r.data),
  updateRoom: (id: number, data: { name?: string; description?: string }) =>
    api.patch(`/chat/rooms/${id}/`, data).then(r => r.data),
  createRoom: (data: { type: string; members: number[]; name?: string }) =>
    api.post('/chat/rooms/', data).then(r => r.data),
  deleteRoom: (id: number) => api.delete(`/chat/rooms/${id}/`),

  // Members
  addMember   : (roomId: number, userId: number) =>
    api.post(`/chat/rooms/${roomId}/members/`, { user_id: userId }).then(r => r.data),
  removeMember: (roomId: number, userId: number) =>
    api.delete(`/chat/rooms/${roomId}/members/`, { data: { user_id: userId } }),

  // Messages
  getMessages: (roomId: number, page = 1) =>
    api.get(`/chat/rooms/${roomId}/messages/`, { params: { page } }).then(r => r.data),
  sendMessage: (data: FormData | object) =>
    api.post('/chat/messages/send/', data, {
      headers: data instanceof FormData
        ? { 'Content-Type': 'multipart/form-data' }
        : {}
    }).then(r => r.data),
  editMessage  : (id: number, text: string) =>
    api.patch(`/chat/messages/${id}/edit/`, { text }).then(r => r.data),
  deleteMessage: (id: number, deleteForAll = false) =>
    api.delete(`/chat/messages/${id}/delete/`, { data: { delete_for_all: deleteForAll } }),
  pinMessage   : (id: number) =>
    api.post(`/chat/messages/${id}/pin/`).then(r => r.data),
  markRead     : (id: number) =>
    api.post(`/chat/messages/${id}/read/`).then(r => r.data),
  addReaction  : (id: number, emoji: string) =>
    api.post(`/chat/messages/${id}/reaction/`, { emoji }).then(r => r.data),
  searchMessages: (roomId: number, q: string) =>
    api.get(`/chat/rooms/${roomId}/messages/search/`, { params: { q } }).then(r => r.data),

  // Stickers
  getStickerPacks    : () => api.get('/chat/stickers/').then(r => r.data),
  installStickerPack : (id: number) =>
    api.post(`/chat/stickers/${id}/install/`).then(r => r.data),
}