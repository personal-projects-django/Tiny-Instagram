import { api } from './client'

export const postApi = {
  getFeed: (page = 1) =>
    api.get('/post/feed/', { params: { page } }).then(r => r.data),

  getExplore: (params?: { q?: string; sort?: string; page?: number }) =>
    api.get('/post/explore/', { params }).then(r => r.data),

  getPost: (id: number) =>
    api.get(`/post/${id}/`).then(r => r.data),

  getUserPosts: (username: string) =>
    api.get(`/post/user/${username}/`).then(r => r.data),

  createPost: (data: FormData) =>
    api.post('/post/', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(r => r.data),

  updatePost: (id: number, data: { caption?: string; visibility?: string }) =>
    api.patch(`/post/${id}/`, data).then(r => r.data),

  deletePost: (id: number) =>
    api.delete(`/post/${id}/`),

  toggleLike: (postId: number) =>
    api.post(`/post/${postId}/like/`).then(r => r.data),

  toggleSave: (postId: number) =>
    api.post(`/post/${postId}/save/`).then(r => r.data),

  getComments: (postId: number) =>
    api.get(`/post/${postId}/comments/`).then(r => r.data),

  addComment: (postId: number, text: string, parent?: number) =>
    api.post(`/post/${postId}/comments/`, { text, parent }).then(r => r.data),

  deleteComment: (commentId: number) =>
    api.delete(`/post/comments/${commentId}/delete/`),

  getSaved: () =>
    api.get('/post/saved/').then(r => r.data),
}