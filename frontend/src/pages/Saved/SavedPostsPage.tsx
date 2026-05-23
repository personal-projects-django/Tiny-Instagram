import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Bookmark, Grid3X3 } from 'lucide-react'
import { postApi } from '@/api/post'
import { useUIStore } from '@/store/uiStore'

export default function SavedPostsPage() {
  const { language } = useUIStore()
  const fa           = language === 'fa'

  const { data, isLoading } = useQuery({
    queryKey: ['saved-posts'],
    queryFn : postApi.getSaved,
  })

  const posts = data?.results || data || []

  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="animate-spin text-muted-foreground" size={32} />
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-6">

      <div className="flex items-center gap-2 mb-6">
        <Bookmark size={20} className="text-purple-500" />
        <h1 className="text-xl font-bold text-foreground">
          {fa ? 'پست‌های ذخیره شده' : 'Saved Posts'}
        </h1>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20">
          <Bookmark size={48} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">
            {fa ? 'پستی ذخیره نکردی' : 'No saved posts'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1">
          {posts.map((post: any) => {
            const media = post.medias?.[0]
            return (
              <Link
                key={post.id}
                to={`/post/${post.id}`}
                className="relative aspect-square bg-muted overflow-hidden rounded-sm group"
              >
                {media?.file && (
                  <img
                    src={media.file}
                    alt=""
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <span className="text-white text-sm font-semibold">♥ {post.likes_count}</span>
                  <span className="text-white text-sm font-semibold">💬 {post.comments_count}</span>
                </div>
                {post.medias?.length > 1 && (
                  <div className="absolute top-2 end-2">
                    <Grid3X3 size={16} className="text-white drop-shadow" />
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}