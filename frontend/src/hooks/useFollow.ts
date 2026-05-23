import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { followApi } from '@/api/follow'

export function useFollowToggle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: followApi.toggle,
    onSuccess : () => {
      qc.invalidateQueries({ queryKey: ['profile'] })
      qc.invalidateQueries({ queryKey: ['suggested'] })
      qc.invalidateQueries({ queryKey: ['user-search'] })
      qc.invalidateQueries({ queryKey: ['followers'] })
      qc.invalidateQueries({ queryKey: ['following'] })
      qc.invalidateQueries({ queryKey: ['feed'] })
      qc.invalidateQueries({ queryKey: ['story-feed'] })
    },
  })
}

export function useSuggested() {
  return useQuery({
    queryKey: ['suggested'],
    queryFn : followApi.suggested,
  })
}

export function useFollowers(username: string) {
  return useQuery({
    queryKey: ['followers', username],
    queryFn : () => followApi.followers(username),
    enabled : !!username,
  })
}

export function useFollowing(username: string) {
  return useQuery({
    queryKey: ['following', username],
    queryFn : () => followApi.following(username),
    enabled : !!username,
  })
}