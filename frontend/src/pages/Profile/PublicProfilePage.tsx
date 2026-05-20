
import { useParams, Link } from 'react-router-dom'
import { Loader2, Grid3X3, UserCheck, UserPlus } from 'lucide-react'
import { usePublicProfile } from '@/hooks/useProfile'
import { useFollowToggle } from '@/hooks/useFollow'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'

export default function PublicProfilePage() {
  const { username }    = useParams<{ username: string }>()
  const { language }    = useUIStore()
  const { user }        = useAuthStore()
  const fa              = language === 'fa'
  const followToggle    = useFollowToggle()

  const { data: profile, isLoading } = usePublicProfile(username!)

  const isMe = user?.username === username

  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="animate-spin text-muted-foreground" size={32} />
    </div>
  )

  if (!profile) return (
    <div className="text-center py-16 text-muted-foreground">
      {fa ? 'کاربر یافت نشد' : 'User not found'}
    </div>
  )

  const posts = profile.posts || []

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-6 mb-8">

        {/* Avatar */}
        <div className="flex justify-center sm:justify-start">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            {profile.avatar && profile.avatar !== 'default.jpg'
              ? <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
              : <span className="text-4xl font-bold text-white">
                  {profile.username?.[0]?.toUpperCase()}
                </span>
            }
          </div>
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <h1 className="text-xl font-bold text-foreground">{profile.username}</h1>
            {!isMe && (
              <button
                onClick={() => followToggle.mutate(username!)}
                disabled={followToggle.isPending}
                className={`flex items-center gap-2 px-5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  profile.is_following
                    ? 'border border-border text-foreground hover:bg-muted'
                    : 'bg-purple-600 hover:bg-purple-500 text-white'
                }`}
              >
                {followToggle.isPending
                  ? <Loader2 size={14} className="animate-spin" />
                  : profile.is_following
                    ? <><UserCheck size={14} />{fa ? 'فالو شده' : 'Following'}</>
                    : <><UserPlus  size={14} />{fa ? 'فالو'     : 'Follow'   }</>
                }
              </button>
            )}
            {profile.is_followed_by && !isMe && (
              <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-lg">
                {fa ? 'شما را فالو می‌کند' : 'Follows you'}
              </span>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-6 mb-3">
            {[
              { label: fa ? 'پست'       : 'Posts',     value: profile.posts_count     || 0 },
              { label: fa ? 'فالوور'    : 'Followers', value: profile.followers_count || 0 },
              { label: fa ? 'فالووینگ' : 'Following', value: profile.following_count || 0 },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-base font-bold text-foreground">{value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          {profile.full_name && (
            <p className="text-sm font-medium text-foreground">{profile.full_name}</p>
          )}
          {profile.bio && (
            <p className="text-sm text-foreground mt-1 leading-relaxed">{profile.bio}</p>
          )}
        </div>
      </div>

      {/* Posts grid */}
      <div className="border-t border-border pt-1">
        <div className="flex items-center justify-center gap-2 py-3 text-sm font-medium text-foreground">
          <Grid3X3 size={16} />
          {fa ? 'پست‌ها' : 'Posts'}
        </div>
        <div className="grid grid-cols-3 gap-1">
          {posts.length === 0 ? (
            <div className="col-span-3 text-center py-16 text-muted-foreground">
              {fa ? 'هنوز پستی نیست' : 'No posts yet'}
            </div>
          ) : (
            posts.map((post: any) => {
              const media = post.medias?.[0]
              return (
                <Link
                  key={post.id}
                  to={`/post/${post.id}`}
                  className="relative aspect-square bg-muted overflow-hidden group"
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
                </Link>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}