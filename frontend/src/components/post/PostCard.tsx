import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Heart, MessageCircle, Send, Bookmark, MoreHorizontal,
  Loader2, Edit2, Trash2, Share2
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { faIR, enUS } from 'date-fns/locale'
import {
  useToggleLike, useToggleSave, useAddComment,
  useComments, useDeletePost
} from '@/hooks/usePosts'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import type { Post } from '@/types/post'
import ShareToModal from '@/components/post/ShareToModal'
import EditPostModal from './EditPostModal'

interface Props {
  post: Post
}

export default function PostCard({ post }: Props) {
  const { language }   = useUIStore()
  const { user }       = useAuthStore()
  const fa             = language === 'fa'
  const locale         = fa ? faIR : enUS
  const isOwner        = user?.id === post.user.id
  const navigate       = useNavigate()
  const location       = useLocation()

  const [showMenu, setShowMenu]         = useState(false)
  const [showShare, setShowShare]       = useState(false)
  const [showEdit, setShowEdit]         = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText]   = useState('')
  const [liked, setLiked]               = useState(post.is_liked)
  const [likesCount, setLikesCount]     = useState(post.likes_count)
  const [saved, setSaved]               = useState(post.is_saved)
  const [mediaIndex, setMediaIndex]     = useState(0)

  const toggleLike = useToggleLike()
  const toggleSave = useToggleSave()
  const addComment = useAddComment(post.id)
  const deletePost = useDeletePost()
  const { data: comments } = useComments(post.id)

  const handleLike = async () => {
    setLiked(p => !p)
    setLikesCount(p => liked ? p - 1 : p + 1)
    try {
      await toggleLike.mutateAsync(post.id)
    } catch {
      setLiked(p => !p)
      setLikesCount(p => liked ? p + 1 : p - 1)
    }
  }

  const handleSave = async () => {
    setSaved(p => !p)
    try {
      await toggleSave.mutateAsync(post.id)
    } catch {
      setSaved(p => !p)
    }
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return
    try {
      await addComment.mutateAsync({ text: commentText })
      setCommentText('')
    } catch {}
  }

  const handleDelete = async () => {
    if (!confirm(fa ? 'مطمئنی می‌خوای پست رو حذف کنی؟' : 'Are you sure?')) return
    try {
      await deletePost.mutateAsync(post.id)
      setShowMenu(false)
      if (location.pathname.startsWith('/post/')) {
        navigate('/')
      }
    } catch {}
  }

  const medias       = post.medias || []
  const currentMedia = medias[mediaIndex]

  return (
    <>
      <article className="bg-card border border-border rounded-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3">
          <Link to={`/profile/${post.user.username}`}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm overflow-hidden flex-shrink-0">
              {post.user.avatar
                ? <img src={post.user.avatar} alt="" className="w-full h-full object-cover" />
                : post.user.username[0].toUpperCase()
              }
            </div>
          </Link>
          <div className="flex-1 min-w-0">
            <Link to={`/profile/${post.user.username}`} className="text-sm font-semibold text-foreground hover:underline">
              {post.user.username}
            </Link>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale })}
            </p>
          </div>

          {/* منوی سه‌نقطه */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(p => !p)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <MoreHorizontal size={20} />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
                <div className="absolute end-0 top-full mt-1 z-40 bg-card border border-border rounded-xl py-1 shadow-lg w-48">
                  {isOwner && (
                    <>
                      <button
                        onClick={() => { setShowEdit(true); setShowMenu(false) }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                      >
                        <Edit2 size={14} />
                        {fa ? 'ویرایش' : 'Edit'}
                      </button>
                      <button
                        onClick={handleDelete}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 size={14} />
                        {fa ? 'حذف پست' : 'Delete'}
                      </button>
                      <div className="h-px bg-border my-1" />
                    </>
                  )}
                  <button
                    onClick={() => { setShowMenu(false); setShowShare(true) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <Share2 size={14} />
                    {fa ? 'فوروارد' : 'Forward'}
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`)
                      setShowMenu(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    📋 {fa ? 'کپی لینک' : 'Copy link'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Media */}
        {medias.length > 0 && (
          <div className="relative bg-muted aspect-square">
            {currentMedia.media_type === 'video' ? (
              <video
                src={currentMedia.file}
                className="w-full h-full object-cover"
                controls
                poster={currentMedia.thumbnail || undefined}
              />
            ) : (
              <img
                src={currentMedia.file}
                alt={post.caption}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            )}

            {medias.length > 1 && (
              <>
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                  {medias.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setMediaIndex(i)}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        i === mediaIndex ? 'bg-white w-3' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
                {mediaIndex > 0 && (
                  <button
                    onClick={() => setMediaIndex(p => p - 1)}
                    className="absolute start-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center text-lg"
                  >
                    ‹
                  </button>
                )}
                {mediaIndex < medias.length - 1 && (
                  <button
                    onClick={() => setMediaIndex(p => p + 1)}
                    className="absolute end-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center text-lg"
                  >
                    ›
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-1 mb-3">
            <button
              onClick={handleLike}
              disabled={toggleLike.isPending}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl transition-all ${
                liked ? 'text-pink-500' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Heart size={22} className={`transition-transform ${liked ? 'scale-110 fill-pink-500' : ''}`} />
              <span className="text-sm font-medium">{likesCount.toLocaleString()}</span>
            </button>

            <button
              onClick={() => setShowComments(p => !p)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-muted-foreground hover:text-foreground transition-colors"
            >
              <MessageCircle size={22} />
              <span className="text-sm font-medium">{post.comments_count}</span>
            </button>

            <button
              onClick={() => setShowShare(true)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-muted-foreground hover:text-foreground transition-colors"
            >
              <Send size={22} />
            </button>

            <button
              onClick={handleSave}
              className={`ms-auto flex items-center px-2 py-1.5 rounded-xl transition-all ${
                saved ? 'text-purple-500' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Bookmark size={22} className={saved ? 'fill-purple-500' : ''} />
            </button>
          </div>

          {post.caption && (
            <p className="text-sm text-foreground mb-2 leading-relaxed">
              <Link to={`/profile/${post.user.username}`} className="font-semibold me-1 hover:underline">
                {post.user.username}
              </Link>
              {post.caption}
            </p>
          )}

          {post.comments_count > 0 && !showComments && (
            <button
              onClick={() => setShowComments(true)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {fa
                ? `مشاهده همه ${post.comments_count} کامنت`
                : `View all ${post.comments_count} comments`
              }
            </button>
          )}

          {showComments && (
            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
              {comments?.results?.map((c: any) => (
                <div key={c.id} className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                    {c.user.username[0].toUpperCase()}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-foreground me-1">{c.user.username}</span>
                    <span className="text-xs text-foreground">{c.text}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!post.comments_disabled && (
            <form onSubmit={handleComment} className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 overflow-hidden">
                {user?.avatar
                  ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                  : user?.username?.[0]?.toUpperCase()
                }
              </div>
              <input
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder={fa ? 'کامنت بنویس...' : 'Add a comment...'}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              {commentText.trim() && (
                <button
                  type="submit"
                  disabled={addComment.isPending}
                  className="text-sm font-semibold text-purple-500 hover:text-purple-400 transition-colors disabled:opacity-50"
                >
                  {addComment.isPending
                    ? <Loader2 size={14} className="animate-spin" />
                    : (fa ? 'ارسال' : 'Post')
                  }
                </button>
              )}
            </form>
          )}
        </div>
      </article>

      {/* Modals — خارج از article */}
      {showEdit && (
        <EditPostModal post={post} onClose={() => setShowEdit(false)} />
      )}
      {showShare && (
        <ShareToModal postId={post.id} onClose={() => setShowShare(false)} />
      )}
    </>
  )
}