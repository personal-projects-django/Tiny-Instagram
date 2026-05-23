import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationApi } from '@/api/notification'

export function useNotifications(unread?: boolean) {
  return useQuery({
    queryKey: ['notifications', unread],
    queryFn : () => notificationApi.getAll({ unread }),
  })
}

export function useNotificationCount() {
  return useQuery({
    queryKey      : ['notification-count'],
    queryFn       : notificationApi.getCount,
    refetchInterval: 30000,
  })
}

export function useMarkRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: notificationApi.markRead,
    onSuccess : () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['notification-count'] })
    },
  })
}

export function useMarkAllRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: notificationApi.markAllRead,
    onSuccess : () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['notification-count'] })
    },
  })
}

export function useDeleteNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: notificationApi.delete,
    onSuccess : () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}