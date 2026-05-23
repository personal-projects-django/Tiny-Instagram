import { useRef, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { useFeed } from '@/hooks/usePosts'
import PostCard from '@/components/post/PostCard'
import StoriesBar from '@/components/story/StoriesBar'
import { useUIStore } from '@/store/uiStore'

export default function FeedPage() {
  const { language }  = useUIStore()
  const fa            = language === 'fa'
  const loaderRef     = useRef<HTMLDivElement>(null)

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useFeed()

  // Infinite scroll با IntersectionObserver
  useEffect(() => {
    const el  = loaderRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting && hasNextPage) fetchNextPage() },
      { threshold: 0.1 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [hasNextPage, fetchNextPage])

  const posts = data?.pages.flatMap(p => p.results || p) ?? []

  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="animate-spin text-muted-foreground" size={32} />
    </div>
  )

  if (isError) return (
    <div className="text-center py-16 text-muted-foreground">
      {fa ? 'خطا در بارگذاری' : 'Failed to load feed'}
    </div>
  )

  return (
    <div className="max-w-xl mx-auto px-4 py-6 pb-24 md:pb-6">

      {/* Stories */}
      <StoriesBar />

      {/* Posts */}
      <div className="space-y-5 mt-5">
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">📭</p>
            <p className="text-muted-foreground">
              {fa
                ? 'هنوز پستی نیست. کسی رو فالو کن!'
                : 'No posts yet. Follow someone!'
              }
            </p>
          </div>
        ) : (
          posts.map((post: any) => <PostCard key={post.id} post={post} />)
        )}
      </div>

      {/* Infinite scroll trigger */}
      <div ref={loaderRef} className="py-4 flex justify-center">
        {isFetchingNextPage && (
          <Loader2 className="animate-spin text-muted-foreground" size={24} />
        )}
      </div>
    </div>
  )
}