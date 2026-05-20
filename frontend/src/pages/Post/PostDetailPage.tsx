// frontend/src/pages/Post/PostDetailPage.tsx
import { useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { usePost } from '@/hooks/usePosts'
import PostCard from '@/components/post/PostCard'

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: post, isLoading } = usePost(Number(id))

  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="animate-spin text-muted-foreground" size={32} />
    </div>
  )

  if (!post) return (
    <div className="text-center py-16 text-muted-foreground">پست یافت نشد</div>
  )

  return (
    <div className="max-w-xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <PostCard post={post} />
    </div>
  )
}