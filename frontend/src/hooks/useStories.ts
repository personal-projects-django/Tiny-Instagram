import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { storyApi } from '@/api/story'

export function useStoryFeed() {
  return useQuery({
    queryKey: ['story-feed'],
    queryFn : storyApi.getFeed,
  })
}

export function useStoryDetail(id: number) {
  return useQuery({
    queryKey: ['story', id],
    queryFn : () => storyApi.getDetail(id),
    enabled : !!id,
  })
}

export function useMyStories() {
  return useQuery({
    queryKey: ['my-stories'],
    queryFn : storyApi.getMine,
  })
}

export function useCreateStory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: storyApi.create,
    onSuccess : () => {
      qc.invalidateQueries({ queryKey: ['story-feed'] })
      qc.invalidateQueries({ queryKey: ['my-stories'] })
      qc.invalidateQueries({ queryKey: ['my-stories-archive'] })
    },
  })
}

export function useDeleteStory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: storyApi.delete,
    onSuccess : () => {
      qc.invalidateQueries({ queryKey: ['story-feed'] })
      qc.invalidateQueries({ queryKey: ['my-stories'] })
      qc.invalidateQueries({ queryKey: ['my-stories-archive'] })
    },
  })
}

export function useStoryLike() {
  return useMutation({
    mutationFn: ({ id, emoji }: { id: number; emoji?: string }) =>
      storyApi.toggleLike(id, emoji),
  })
}

export function useStoryReply() {
  return useMutation({
    mutationFn: ({ id, text }: { id: number; text: string }) =>
      storyApi.reply(id, text),
  })
}

export function useMyStoryReplies() {
  return useQuery({
    queryKey: ['my-story-replies'],
    queryFn : storyApi.getMyReplies,
  })
}

export function useMyStoriesArchive() {
  return useQuery({
    queryKey: ['my-stories-archive'],
    queryFn : storyApi.getArchive,
  })
}