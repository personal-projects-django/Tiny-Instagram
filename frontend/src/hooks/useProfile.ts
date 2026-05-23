import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { profileApi } from '@/api/profile'

export function useMyProfile() {
  return useQuery({
    queryKey: ['my-profile'],
    queryFn : profileApi.getMe,
  })
}

export function usePublicProfile(username: string) {
  return useQuery({
    queryKey: ['profile', username],
    queryFn : () => profileApi.getPublic(username),
    enabled : !!username,
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: profileApi.updateMe,
    onSuccess : () => {
      qc.invalidateQueries({ queryKey: ['my-profile'] })
    },
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: profileApi.changePassword,
  })
}