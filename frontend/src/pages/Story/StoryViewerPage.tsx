import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { X, Heart, Send, Loader2, ChevronLeft, ChevronRight, Eye, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { faIR, enUS } from 'date-fns/locale'
import { useMyStories, useStoryFeed, useStoryLike, useStoryReply, useDeleteStory } from '@/hooks/useStories'
import { storyApi } from '@/api/story'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'

const STORY_DURATION = 5000 // 5 ثانیه

export default function StoryViewerPage() {
  const { username }    = useParams<{ username: string }>()
  const navigate        = useNavigate()
  const { language }    = useUIStore()
  const { user }        = useAuthStore()
  const fa              = language === 'fa'
  const locale          = fa ? faIR : enUS

  const { data: feed, isLoading: feedLoading } = useStoryFeed()
  const { data: myStories, isLoading: myStoriesLoading } = useMyStories()
  const storyLike    = useStoryLike()
  const storyReply   = useStoryReply()
  const deleteStory  = useDeleteStory()

  const [groupIndex, setGroupIndex] = useState(0)
  const [storyIndex, setStoryIndex] = useState(0)
  const [progress, setProgress]     = useState(0)
  const [paused, setPaused]         = useState(false)
  const [replyText, setReplyText]   = useState('')
  const [liked, setLiked]           = useState(false)
  const timerRef = useRef<number | undefined>(undefined)

  const myStoryList = myStories?.results || myStories || []
  const viewerGroups = useMemo(() => {
    const groups = feed ? [...feed] : []
    if (user?.username && myStoryList.length > 0) {
      const myGroup = {
        user: {
          id      : user.id,
          username: user.username,
          avatar  : myStoryList[0]?.user?.avatar || user.avatar || '',
        },
        stories   : myStoryList,
        has_unseen: false,
      }
      const idx = groups.findIndex((g: any) => g.user.username === user.username)
      if (idx >= 0) groups[idx] = myGroup
      else groups.unshift(myGroup)
    }
    return groups
  }, [feed, myStoryList, user?.avatar, user?.id, user?.username])

  // پیدا کردن گروه target
  useEffect(() => {
    if (!viewerGroups.length) return
    const idx = viewerGroups.findIndex((g: any) => g.user.username === username)
    if (idx >= 0) setGroupIndex(idx)
  }, [viewerGroups, username])

  const currentGroup = viewerGroups?.[groupIndex]
  const currentStory = currentGroup?.stories?.[storyIndex]
  const isMyStory    = currentGroup?.user?.username === user?.username

  // ثبت view وقتی story تغییر میکنه
  useEffect(() => {
    if (currentStory?.id) {
      storyApi.getDetail(currentStory.id).catch(() => {})
      setLiked(currentStory.is_liked || false)
    }
  }, [currentStory?.id])

  // Progress timer
  useEffect(() => {
    if (!currentStory || paused) return
    setProgress(0)
    const start = Date.now()

    timerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - start
      const pct     = (elapsed / STORY_DURATION) * 100
      if (pct >= 100) {
        clearInterval(timerRef.current)
        handleNext()
      } else {
        setProgress(pct)
      }
    }, 50)

    return () => clearInterval(timerRef.current)
  }, [storyIndex, groupIndex, paused])

  const handleNext = () => {
    if (!currentGroup) return
    if (storyIndex < currentGroup.stories.length - 1) {
      setStoryIndex(p => p + 1)
    } else if (viewerGroups && groupIndex < viewerGroups.length - 1) {
      setGroupIndex(p => p + 1)
      setStoryIndex(0)
    } else {
      navigate('/')
    }
  }

  const handlePrev = () => {
    if (storyIndex > 0) {
      setStoryIndex(p => p - 1)
    } else if (groupIndex > 0) {
      setGroupIndex(p => p - 1)
      const prevGroup = viewerGroups?.[groupIndex - 1]
      setStoryIndex((prevGroup?.stories.length || 1) - 1)
    }
  }

  const handleLike = async () => {
    if (!currentStory) return
    setLiked(p => !p)
    try {
      await storyLike.mutateAsync({ id: currentStory.id })
    } catch {
      setLiked(p => !p)
    }
  }

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyText.trim() || !currentStory) return
    try {
      await storyReply.mutateAsync({ id: currentStory.id, text: replyText })
      setReplyText('')
    } catch {}
  }

  const handleDelete = async () => {
    if (!currentStory) return
    if (!confirm(fa ? 'استوری حذف شود؟' : 'Delete story?')) return
    await deleteStory.mutateAsync(currentStory.id)
    navigate('/')
  }

  if (feedLoading || myStoriesLoading) return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <Loader2 className="animate-spin text-white" size={32} />
    </div>
  )

  if (!currentStory) return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50 flex-col gap-4">
      <p className="text-white">{fa ? 'استوری یافت نشد' : 'No stories found'}</p>
      <button onClick={() => navigate('/')} className="text-purple-400">
        {fa ? 'بازگشت' : 'Back'}
      </button>
    </div>
  )

  return (
    <div
      className="fixed inset-0 bg-black z-50 flex items-center justify-center select-none"
      onMouseDown={() => setPaused(true)}
      onMouseUp={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div className="relative w-full h-full sm:max-w-md sm:max-h-[90vh] sm:rounded-2xl overflow-hidden">

        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2">
          {currentGroup.stories.map((_: any, i: number) => (
            <div key={i} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all"
                style={{
                  width: i < storyIndex
                    ? '100%'
                    : i === storyIndex
                      ? `${progress}%`
                      : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-4 left-0 right-0 z-20 flex items-center gap-3 px-4 mt-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
            {currentGroup.user.avatar
              ? <img src={currentGroup.user.avatar} alt="" className="w-full h-full object-cover" />
              : currentGroup.user.username[0].toUpperCase()
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">{currentGroup.user.username}</p>
            <p className="text-xs text-white/70">
              {formatDistanceToNow(new Date(currentStory.created_at), { addSuffix: true, locale })}
            </p>
          </div>
          {isMyStory && (
            <button onClick={handleDelete} className="text-white/70 hover:text-white">
              <Trash2 size={20} />
            </button>
          )}
          <button onClick={() => navigate('/')} className="text-white/70 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Media */}
        <div className="w-full h-full flex items-center justify-center bg-black">
          {currentStory.video ? (
            <video
              src={currentStory.video}
              autoPlay
              className="max-w-full max-h-full"
            />
          ) : currentStory.image && (
            <img
              src={currentStory.image}
              alt=""
              className="max-w-full max-h-full object-contain"
            />
          )}
        </div>

        {/* Caption */}
        {currentStory.caption && (
          <div className="absolute bottom-20 left-0 right-0 px-4 z-10">
            <p className="text-white text-sm bg-black/40 rounded-xl p-3 backdrop-blur-sm">
              {currentStory.caption}
            </p>
          </div>
        )}

        {/* Nav arrows — invisible click zones */}
        <button
          onClick={handlePrev}
          className="absolute left-0 top-0 bottom-0 w-1/3 z-10 flex items-center justify-start ps-2 group"
        >
          <ChevronLeft size={32} className="text-white/0 group-hover:text-white/60 transition-all" />
        </button>
        <button
          onClick={handleNext}
          className="absolute right-0 top-0 bottom-0 w-1/3 z-10 flex items-center justify-end pe-2 group"
        >
          <ChevronRight size={32} className="text-white/0 group-hover:text-white/60 transition-all" />
        </button>

        {/* Bottom bar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-20 bg-gradient-to-t from-black/60 to-transparent">
          {isMyStory ? (
            <button
              onClick={() => navigate(`/story/${currentStory.id}/viewers`)}
              className="flex items-center gap-2 text-white text-sm"
            >
              <Eye size={18} />
              {currentStory.views_count} {fa ? 'بازدید' : 'views'}
            </button>
          ) : (
            <form onSubmit={handleReply} className="flex items-center gap-2">
              <input
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onFocus={() => setPaused(true)}
                onBlur={() => setPaused(false)}
                placeholder={fa ? 'پاسخ به استوری...' : 'Reply to story...'}
                className="flex-1 h-10 px-4 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-white/50 text-sm outline-none focus:border-white/40"
              />
              <button
                type="button"
                onClick={handleLike}
                className="w-10 h-10 flex items-center justify-center"
              >
                <Heart
                  size={24}
                  className={liked ? 'fill-pink-500 text-pink-500' : 'text-white'}
                />
              </button>
              {replyText.trim() && (
                <button
                  type="submit"
                  disabled={storyReply.isPending}
                  className="w-10 h-10 flex items-center justify-center text-white"
                >
                  {storyReply.isPending
                    ? <Loader2 size={20} className="animate-spin" />
                    : <Send size={20} />
                  }
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  )
}