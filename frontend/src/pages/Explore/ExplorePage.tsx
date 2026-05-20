import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Loader2, Grid3X3, TrendingUp, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { postApi } from '@/api/post'
import { profileApi } from '@/api/profile'
import { useUIStore } from '@/store/uiStore'
import { useFollowToggle, useSuggested } from '@/hooks/useFollow'
import { useDebounce } from '@/hooks/useDebounce'

type Tab = 'posts' | 'users'

export default function ExplorePage() {
  const { language }      = useUIStore()
  const fa                = language === 'fa'
  const [query, setQuery] = useState('')
  const [sort, setSort]   = useState<'popular' | 'newest'>('popular')
  const [tab, setTab]     = useState<Tab>('posts')
  const debouncedQuery    = useDebounce(query, 400)
  const followToggle      = useFollowToggle()

  // پست‌ها
  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['explore', debouncedQuery, sort],
    queryFn : () => postApi.getExplore({ q: debouncedQuery, sort }),
    enabled : tab === 'posts',
  })

  // کاربران
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['user-search', debouncedQuery],
    queryFn : () => profileApi.searchUsers(debouncedQuery),
    enabled : tab === 'users' && debouncedQuery.length > 0,
  })

  // پیشنهاد فالو
  const { data: suggested } = useSuggested()

  const postList      = posts?.results || posts || []
  const userList      = users?.results || users || []
  const suggestedList = suggested?.results || suggested || []

  // اگه چیزی سرچ کرد، خودکار میره به تب users اگه پستی پیدا نشد
  const hasSearchTerm = debouncedQuery.length > 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-6">

      {/* Search bar */}
      <div className="relative mb-4">
        <Search size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={fa ? 'جستجو در پست‌ها و کاربران...' : 'Search posts and users...'}
          className="w-full h-11 ps-10 pe-4 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground text-sm outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all"
        />
      </div>

      {/* Tabs — Posts / Users */}
      <div className="flex items-center gap-2 mb-4 border-b border-border">
        <button
          onClick={() => setTab('posts')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-all ${
            tab === 'posts'
              ? 'border-purple-500 text-purple-500'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Grid3X3 size={16} />
          {fa ? 'پست‌ها' : 'Posts'}
        </button>
        <button
          onClick={() => setTab('users')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-all ${
            tab === 'users'
              ? 'border-purple-500 text-purple-500'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users size={16} />
          {fa ? 'کاربران' : 'Users'}
        </button>
      </div>

      {/* ===== Tab: Users ===== */}
      {tab === 'users' && (
        <div>
          {!hasSearchTerm ? (
            <div className="text-center py-16">
              <Users size={48} className="mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">
                {fa ? 'برای جستجوی کاربر تایپ کنید' : 'Type to search users'}
              </p>
            </div>
          ) : usersLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin text-muted-foreground" size={32} />
            </div>
          ) : userList.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-muted-foreground">
                {fa ? 'کاربری با این مشخصات پیدا نشد' : 'No users found'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {userList.map((user: any) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <Link to={`/profile/${user.username}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold overflow-hidden flex-shrink-0">
                      {user.avatar
                        ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                        : user.username[0].toUpperCase()
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{user.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.followers_count?.toLocaleString() || 0} {fa ? 'فالوور' : 'followers'}
                      </p>
                    </div>
                  </Link>

                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      followToggle.mutate(user.username)
                    }}
                    disabled={followToggle.isPending}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      user.is_following
                        ? 'border border-border text-foreground hover:bg-muted'
                        : 'bg-purple-600 hover:bg-purple-500 text-white'
                    }`}
                  >
                    {followToggle.isPending
                      ? '...'
                      : user.is_following
                        ? (fa ? 'فالو شده' : 'Following')
                        : (fa ? 'فالو'     : 'Follow')
                    }
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== Tab: Posts ===== */}
      {tab === 'posts' && (
        <>
          {/* پیشنهاد فالو — فقط وقتی سرچ نمیشه */}
          {!hasSearchTerm && suggestedList.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                {fa ? 'پیشنهاد فالو' : 'Suggested'}
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {suggestedList.map((u: any) => (
                  <div key={u.id} className="flex flex-col items-center gap-2 flex-shrink-0 w-20">
                    <Link to={`/profile/${u.username}`}>
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold overflow-hidden">
                        {u.avatar
                          ? <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                          : u.username[0].toUpperCase()
                        }
                      </div>
                    </Link>
                    <span className="text-xs text-foreground truncate w-full text-center">{u.username}</span>
                    <button
                      onClick={() => followToggle.mutate(u.username)}
                      className="text-xs text-purple-500 border border-purple-500/30 rounded-lg px-3 py-1 hover:bg-purple-500/10 transition-colors"
                    >
                      {fa ? 'فالو' : 'Follow'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sort tabs */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setSort('popular')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                sort === 'popular'
                  ? 'bg-purple-500/20 text-purple-500'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <TrendingUp size={16} />
              {fa ? 'محبوب' : 'Popular'}
            </button>
            <button
              onClick={() => setSort('newest')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                sort === 'newest'
                  ? 'bg-purple-500/20 text-purple-500'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <Grid3X3 size={16} />
              {fa ? 'جدیدترین' : 'Newest'}
            </button>
          </div>

          {/* Posts grid */}
          {postsLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin text-muted-foreground" size={32} />
            </div>
          ) : postList.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-4">🔍</p>
              <p className="text-muted-foreground mb-3">
                {fa ? 'پستی پیدا نشد' : 'No posts found'}
              </p>
              {hasSearchTerm && (
                <button
                  onClick={() => setTab('users')}
                  className="text-sm text-purple-500 hover:text-purple-400"
                >
                  {fa ? 'جستجو در کاربران →' : 'Search in users →'}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {postList.map((post: any) => {
                const media = post.medias?.[0]
                return (
                  <Link
                    key={post.id}
                    to={`/post/${post.id}`}
                    className="relative aspect-square bg-muted overflow-hidden rounded-sm group"
                  >
                    {media?.file ? (
                      <img
                        src={media.file}
                        alt=""
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-xs p-2 text-center">
                        {post.caption?.slice(0, 30)}
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                      <span className="text-white text-sm font-semibold flex items-center gap-1">
                        ♥ {post.likes_count}
                      </span>
                      <span className="text-white text-sm font-semibold flex items-center gap-1">
                        💬 {post.comments_count}
                      </span>
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
        </>
      )}
    </div>
  )
}