import { useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import {
  Check, CheckCheck, Reply, Edit2, Trash2,
  Smile, Pin, Copy, MoreHorizontal, FileText, Download
} from 'lucide-react'
import { useDeleteMessage, useReactToMessage, useEditMessage } from '@/hooks/useChat'
import { usePost } from '@/hooks/usePosts'
import { useUIStore } from '@/store/uiStore'

const QUICK_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🙏']
const POST_LINK_RE = /(?:^|\s)(?:https?:\/\/[^\s]+)?\/post\/(\d+)(?:\b|\/)/

interface Props {
  message: any
  isMine: boolean
  showAvatar: boolean
  onReply: () => void
}

function PostPreviewCard({ postId, post: initialPost, isMine }: { postId: number; post?: any; isMine: boolean }) {
  const { data } = usePost(postId)
  const post = initialPost || data
  const media = post?.medias?.[0]

  if (!post) {
    return (
      <Link
        to={`/post/${postId}`}
        className={`block rounded-xl border px-3 py-2 text-sm ${isMine ? 'border-white/20 bg-white/10' : 'border-border bg-muted/40'}`}
      >
        /post/{postId}
      </Link>
    )
  }

  return (
    <Link
      to={`/post/${post.id}`}
      className={`block overflow-hidden rounded-xl border ${isMine ? 'border-white/20 bg-white/10' : 'border-border bg-muted/40'}`}
    >
      {media?.file && (
        <div className="aspect-square max-h-64 bg-black overflow-hidden">
          {media.media_type === 'video' ? (
            <video src={media.file} className="w-full h-full object-cover" muted />
          ) : (
            <img src={media.file} alt="" className="w-full h-full object-cover" />
          )}
        </div>
      )}
      <div className="p-2 space-y-1">
        <p className="text-xs font-semibold">{post.user?.username}</p>
        {post.caption && <p className="text-xs line-clamp-2 opacity-80">{post.caption}</p>}
      </div>
    </Link>
  )
}

export default function MessageBubble(props: Props) {
  const { message, isMine, showAvatar, onReply } = props
  const { language } = useUIStore()
  const fa = language === 'fa'
  const deleteMsg = useDeleteMessage()
  const reactMsg = useReactToMessage()
  const editMsg = useEditMessage()

  const [showMenu, setShowMenu] = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editText, setEditText] = useState(message.text || '')

  function handleCopy() {
    navigator.clipboard.writeText(message.text)
    setShowMenu(false)
  }

  async function handleEdit() {
    if (!editText.trim()) return
    await editMsg.mutateAsync({ id: message.id, text: editText })
    setEditMode(false)
  }

  function handleDelete(forAll: boolean) {
    if (!confirm(fa ? 'حذف شود؟' : 'Delete?')) return
    deleteMsg.mutate({ id: message.id, forAll })
    setShowMenu(false)
  }

  function handleReact(emoji: string) {
    reactMsg.mutate({ id: message.id, emoji })
    setShowReactions(false)
  }

  function getLinkedPostId() {
    const match = typeof message.text === 'string' ? message.text.match(POST_LINK_RE) : null
    return match ? Number(match[1]) : null
  }

  function renderContent() {
    if (message.is_deleted_for_all) {
      return (
        <p className="text-sm italic text-muted-foreground">
          {fa ? 'این پیام حذف شده' : 'Message deleted'}
        </p>
      )
    }

    if (message.forwarded_from?.type === 'post') {
      return <PostPreviewCard postId={message.forwarded_from.id} post={message.forwarded_from.post} isMine={isMine} />
    }

    const linkedPostId = getLinkedPostId()
    if (linkedPostId) {
      return <PostPreviewCard postId={linkedPostId} isMine={isMine} />
    }

    if (message.type === 'image') {
      return <img src={message.file} alt="" className="max-w-full rounded-lg max-h-80 object-cover" />
    }

    if (message.type === 'video') {
      return (
        <video
          src={message.file}
          controls
          poster={message.thumbnail}
          className="max-w-full rounded-lg max-h-80"
        />
      )
    }

    if (message.type === 'voice' || message.type === 'audio') {
      return <audio src={message.file} controls className="max-w-full" />
    }

    if (message.type === 'file') {
      const fileUrl: string = message.file
      const fileName: string = message.file_name || 'file'
      return (
        <a href={fileUrl} className="flex items-center gap-3 p-2 bg-black/10 rounded-lg hover:bg-black/20 transition-colors">
          <FileText size={32} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{fileName}</p>
            {message.file_size && (
              <p className="text-xs opacity-70">{(message.file_size / 1024).toFixed(1)} KB</p>
            )}
          </div>
          <Download size={18} />
        </a>
      )
    }

    if (message.type === 'sticker') {
      return <img src={message.sticker?.file} alt="" className="w-32 h-32" />
    }

    if (message.type === 'location') {
      const mapUrl = 'https://maps.google.com/?q=' + message.latitude + ',' + message.longitude
      return (
        <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="block p-2 bg-black/10 rounded-lg hover:bg-black/20">
          📍 {fa ? 'مشاهده موقعیت' : 'View location'}
        </a>
      )
    }

    if (editMode) {
      return (
        <div className="space-y-2">
          <input
            value={editText}
            onChange={e => setEditText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleEdit()}
            className="w-full bg-transparent border-b border-white/30 text-sm outline-none"
            autoFocus
          />
          <div className="flex gap-2 text-xs">
            <button onClick={handleEdit} className="opacity-80 hover:opacity-100">
              {fa ? 'ذخیره' : 'Save'}
            </button>
            <button onClick={() => setEditMode(false)} className="opacity-80 hover:opacity-100">
              {fa ? 'انصراف' : 'Cancel'}
            </button>
          </div>
        </div>
      )
    }

    return <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
  }

  const reactionsGrouped: Record<string, number> = (message.reactions || []).reduce((acc: any, r: any) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1
    return acc
  }, {})

  return (
    <div className={`flex gap-2 group ${isMine ? 'flex-row-reverse' : ''}`}>

      {!isMine && showAvatar ? (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 overflow-hidden">
          {message.sender?.avatar
            ? <img src={message.sender.avatar} alt="" className="w-full h-full object-cover" />
            : message.sender?.username?.[0]?.toUpperCase()
          }
        </div>
      ) : !isMine ? (
        <div className="w-7 flex-shrink-0" />
      ) : null}

      <div className={`relative max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-1`}>

        {!isMine && showAvatar && (
          <span className="text-xs text-purple-500 px-2">{message.sender?.username}</span>
        )}

        {message.reply_to && (
          <div className={`px-3 py-1.5 rounded-lg text-xs border-s-2 max-w-full ${
            isMine ? 'bg-purple-500/30 border-purple-300' : 'bg-muted border-purple-500'
          }`}>
            <p className="font-semibold opacity-80">{message.reply_to.sender}</p>
            <p className="opacity-70 truncate">{message.reply_to.text}</p>
          </div>
        )}

        <div
          onDoubleClick={() => setShowReactions(true)}
          className={`relative px-3 py-2 rounded-2xl ${
            isMine
              ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-se-md'
              : 'bg-card border border-border text-foreground rounded-ss-md'
          } ${message.pinned ? 'ring-2 ring-amber-500/50' : ''}`}
        >
          {message.pinned && <Pin size={10} className="absolute -top-1 -end-1 text-amber-500" />}

          {renderContent()}

          <div className={`flex items-center gap-1 mt-1 text-[10px] ${
            isMine ? 'text-white/70 justify-end' : 'text-muted-foreground'
          }`}>
            {message.is_edited && <span>{fa ? '(ویرایش)' : '(edited)'}</span>}
            <span>{format(new Date(message.created_at), 'HH:mm')}</span>
            {isMine && (message.reads_count > 0 ? <CheckCheck size={12} /> : <Check size={12} />)}
          </div>
        </div>

        {Object.keys(reactionsGrouped).length > 0 && (
          <div className="flex gap-1 flex-wrap px-1">
            {Object.entries(reactionsGrouped).map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => handleReact(emoji)}
                className="bg-card border border-border rounded-full px-2 py-0.5 text-xs hover:bg-muted transition-colors"
              >
                {emoji} {count}
              </button>
            ))}
          </div>
        )}

        <div className={`absolute top-0 ${isMine ? 'start-0 -translate-x-full pe-2' : 'end-0 translate-x-full ps-2'} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5`}>
          <button onClick={() => setShowReactions(p => !p)} className="p-1.5 rounded-full bg-card border border-border hover:bg-muted transition-colors">
            <Smile size={14} />
          </button>
          <button onClick={onReply} className="p-1.5 rounded-full bg-card border border-border hover:bg-muted transition-colors">
            <Reply size={14} />
          </button>
          <button onClick={() => setShowMenu(p => !p)} className="p-1.5 rounded-full bg-card border border-border hover:bg-muted transition-colors">
            <MoreHorizontal size={14} />
          </button>
        </div>

        {showReactions && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setShowReactions(false)} />
            <div className={`absolute z-40 top-full mt-1 ${isMine ? 'end-0' : 'start-0'} bg-card border border-border rounded-full px-2 py-1 flex gap-1 shadow-lg`}>
              {QUICK_REACTIONS.map(emoji => (
                <button key={emoji} onClick={() => handleReact(emoji)} className="text-xl hover:scale-125 transition-transform p-1">
                  {emoji}
                </button>
              ))}
            </div>
          </>
        )}

        {showMenu && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
            <div className={`absolute z-40 top-full mt-1 ${isMine ? 'end-0' : 'start-0'} bg-card border border-border rounded-xl py-1 shadow-lg w-40`}>
              {message.type === 'text' && (
                <button onClick={handleCopy} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                  <Copy size={14} />{fa ? 'کپی' : 'Copy'}
                </button>
              )}
              {isMine && message.type === 'text' && (
                <button onClick={() => { setEditMode(true); setShowMenu(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                  <Edit2 size={14} />{fa ? 'ویرایش' : 'Edit'}
                </button>
              )}
              {isMine && (
                <button onClick={() => handleDelete(true)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors">
                  <Trash2 size={14} />{fa ? 'حذف برای همه' : 'Delete for all'}
                </button>
              )}
              <button onClick={() => handleDelete(false)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors">
                <Trash2 size={14} />{fa ? 'حذف برای من' : 'Delete for me'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}