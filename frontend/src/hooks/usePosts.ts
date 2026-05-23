import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { postApi } from '@/api/post'

export function useFeed() {
  return useInfiniteQuery({
    queryKey    : ['feed'],
    queryFn     : ({ pageParam = 1 }) => postApi.getFeed(pageParam),
    getNextPageParam: (last) => {
      if (last.next) {
        const url  = new URL(last.next)
        return Number(url.searchParams.get('page'))
      }
      return undefined
    },
    initialPageParam: 1,
  })
}

export function usePost(id: number) {
  return useQuery({
    queryKey: ['post', id],
    queryFn : () => postApi.getPost(id),
    enabled : !!id,
  })
}

export function useUserPosts(username: string) {
  return useQuery({
    queryKey: ['user-posts', username],
    queryFn : () => postApi.getUserPosts(username),
    enabled : !!username,
  })
}

export function useSavedPosts() {
  return useQuery({
    queryKey: ['saved-posts'],
    queryFn : postApi.getSaved,
  })
}

export function useToggleLike() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: postApi.toggleLike,
    onSuccess : () => {
      qc.invalidateQueries({ queryKey: ['feed'] })
      qc.invalidateQueries({ queryKey: ['post'] })
    },
  })
}

export function useToggleSave() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: postApi.toggleSave,
    onSuccess : () => {
      qc.invalidateQueries({ queryKey: ['feed'] })
      qc.invalidateQueries({ queryKey: ['saved'] })
      qc.invalidateQueries({ queryKey: ['saved-posts'] })
    },
  })
}

export function useAddComment(postId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ text, parent }: { text: string; parent?: number }) =>
      postApi.addComment(postId, text, parent),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', postId] }),
  })
}

export function useComments(postId: number) {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn : () => postApi.getComments(postId),
    enabled : !!postId,
  })
}

export function useCreatePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: postApi.createPost,
    onSuccess : () => {
      qc.invalidateQueries({ queryKey: ['feed'] })
      qc.invalidateQueries({ queryKey: ['user-posts'] })
      qc.invalidateQueries({ queryKey: ['explore'] })
    },
  })
}

export function useDeletePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: postApi.deletePost,
    onSuccess : () => {
      qc.invalidateQueries({ queryKey: ['feed'] })
      qc.invalidateQueries({ queryKey: ['explore'] })
      qc.invalidateQueries({ queryKey: ['user-posts'] })
      qc.invalidateQueries({ queryKey: ['post'] })
      qc.invalidateQueries({ queryKey: ['saved-posts'] })
    },
  })
}