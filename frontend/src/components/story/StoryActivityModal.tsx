import { useState } from 'react'
import { X, Loader2, Eye, MessageCircle, Heart, Archive } from 'lucide-react'
import { useMyStoryReplies, useMyStoriesArchive } from '@/hooks/useStories'
import { useUIStore } from '@/store/uiStore'
import { formatDistanceToNow } from 'date-fns'
import { faIR, enUS } from 'date-fns/locale'
import { Link } from 'react-router-dom'

interface Props { onClose: () => void }

type Tab = 'replies' | 'stories'

export default function StoryActivityModal({ onClose }: Props) {
  const { language } = useUIStore()
  const fa           = language === 'fa'
  const locale       = fa ? faIR : enUS
  const [tab, setTab] = useState<Tab>('replies')

  const { data: replies, isLoading: repliesLoading } = useMyStoryReplies()
  const { data: stories, isLoading: storiesLoading } = useMyStoriesArchive()

  const replyList = replies?.results || replies || []
  const storyList = stories?.results || stories || []

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
          <h2 className="text-sm font-semibold text-foreground">
            {fa ? 'فعالیت استوری' : 'Story Activity'}
          </h2>
          <div className="w-5" />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setTab('replies')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              tab === 'replies'
                ? 'text-purple-500 border-b-2 border-purple-500'
                : 'text-muted-foreground'
            }`}
          >
            <MessageCircle size={16} />
            {fa ? 'پاسخ‌ها' : 'Replies'}
          </button>
          <button
            onClick={() => setTab('stories')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              tab === 'stories'
                ? 'text-purple-500 border-b-2 border-purple-500'
                : 'text-muted-foreground'
            }`}
          >
            <Archive size={16} />
            {fa ? 'استوری‌های من' : 'My Stories'}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">

          {/* === Replies === */}
          {tab === 'replies' && (
            <>
              {repliesLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="animate-spin text-muted-foreground" size={24} />
                </div>
              ) : replyList.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle size={40} className="mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {fa ? 'هنوز پاسخی نگرفتی' : 'No replies yet'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {replyList.map((r: any) => (
                    <div key={r.id} className="p-4 flex items-start gap-3">
                      <Link to={`/profile/${r.sender?.username}`}>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm overflow-hidden flex-shrink-0">
                          {r.sender?.avatar
                            ? <img src={r.sender.avatar} alt="" className="w-full h-full object-cover" />
                            : r.sender?.username?.[0]?.toUpperCase()
                          }
                        </div>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <Link to={`/profile/${r.sender?.username}`} className="font-semibold text-foreground hover:underline">
                            {r.sender?.username}
                          </Link>
                          <span className="text-xs text-muted-foreground ms-2">
                            {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale })}
                          </span>
                        </p>
                        <p className="text-sm text-foreground mt-1">{r.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* === My Stories === */}
          {tab === 'stories' && (
            <>
              {storiesLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="animate-spin text-muted-foreground" size={24} />
                </div>
              ) : storyList.length === 0 ? (
                <div className="text-center py-12">
                  <Archive size={40} className="mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {fa ? 'هنوز استوری نزدی' : 'No stories yet'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1 p-2">
                  {storyList.map((s: any) => (
                    <Link
                      key={s.id}
                      to={s.is_active ? `/stories/${s.user.username}` : '#'}
                      onClick={s.is_active ? onClose : undefined}
                      className="relative aspect-[9/16] bg-muted overflow-hidden rounded-lg group"
                    >
                      {s.image && (
                        <img src={s.image} alt="" className="w-full h-full object-cover" />
                      )}
                      {s.video && (
                        <video src={s.video} className="w-full h-full object-cover" muted />
                      )}
                      {!s.is_active && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-white text-[10px] bg-black/60 px-2 py-0.5 rounded-full">
                            {fa ? 'منقضی' : 'Expired'}
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-1 left-1 right-1 flex justify-between text-white text-[10px] font-semibold">
                        <span className="flex items-center gap-0.5 bg-black/50 rounded px-1.5 py-0.5">
                          <Eye size={10} />{s.views_count}
                        </span>
                        <span className="flex items-center gap-0.5 bg-black/50 rounded px-1.5 py-0.5">
                          <Heart size={10} />{s.likes_count}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  )
}
