import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { chatApi } from '@/api/chat'
import { useAuthStore } from '@/store/authStore'

export function useChatRooms() {
  const { accessToken, isAuthenticated } = useAuthStore()

  return useQuery({
    queryKey      : ['chat-rooms'],
    queryFn       : chatApi.getRooms,
    enabled       : isAuthenticated && !!accessToken,
    refetchInterval: 10000,
    retry         : (failureCount, error: any) =>
      error?.response?.status !== 401 && failureCount < 3,
  })
}

export function useChatUnread() {
  const { data } = useChatRooms()
  const rooms    = data?.results || data || []
  const total    = rooms.reduce((sum: number, r: any) => sum + (r.unread_count || 0), 0)
  return { data: total }
}

export function useRoom(id: number) {
  return useQuery({
    queryKey: ['chat-room', id],
    queryFn : () => chatApi.getRoom(id),
    enabled : !!id,
  })
}

export function useMessages(roomId: number) {
  return useQuery({
    queryKey: ['messages', roomId],
    queryFn : () => chatApi.getMessages(roomId),
    enabled : !!roomId,
    refetchInterval: 5000,
  })
}

export function useSendMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: chatApi.sendMessage,
    onSuccess : (message: any, vars: any) => {
      const roomId = vars instanceof FormData ? Number(vars.get('room')) : vars.room

      qc.setQueryData(['messages', roomId], (old: any) => {
        if (!old) return old

        const append = (items: any[]) =>
          items.some((m: any) => m.id === message.id) ? items : [...items, message]

        if (Array.isArray(old)) return append(old)
        if (Array.isArray(old.results)) return { ...old, results: append(old.results) }
        return old
      })

      qc.invalidateQueries({ queryKey: ['messages', roomId] })
      qc.invalidateQueries({ queryKey: ['chat-room', roomId] })
      qc.invalidateQueries({ queryKey: ['chat-rooms'] })
    },
  })
}

export function useEditMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, text }: { id: number; text: string }) =>
      chatApi.editMessage(id, text),
    onSuccess : (message: any) => {
      qc.invalidateQueries({ queryKey: ['messages', message.room] })
      qc.invalidateQueries({ queryKey: ['chat-rooms'] })
    },
  })
}

export function useDeleteMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, forAll }: { id: number; forAll?: boolean }) =>
      chatApi.deleteMessage(id, forAll),
    onSuccess : () => qc.invalidateQueries({ queryKey: ['messages'] }),
  })
}

export function useReactToMessage() {
  return useMutation({
    mutationFn: ({ id, emoji }: { id: number; emoji: string }) =>
      chatApi.addReaction(id, emoji),
  })
}

export function useCreateRoom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: chatApi.createRoom,
    onSuccess : () => qc.invalidateQueries({ queryKey: ['chat-rooms'] }),
  })
}

export function useUpdateRoom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; description?: string } }) =>
      chatApi.updateRoom(id, data),
    onSuccess : (room: any) => {
      qc.invalidateQueries({ queryKey: ['chat-room', room.id] })
      qc.invalidateQueries({ queryKey: ['chat-rooms'] })
    },
  })
}

export function useMarkMessageRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: chatApi.markRead,
    onSuccess : () => {
      qc.invalidateQueries({ queryKey: ['chat-rooms'] })
    },
  })
}