import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, Bell, BellOff, Trash2, CheckCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { faIR, enUS } from 'date-fns/locale'
import {
  useNotifications,
  useMarkRead,
  useMarkAllRead,
  useDeleteNotification,
} from '@/hooks/useNotifications'
import { useUIStore } from '@/store/uiStore'

const NOTIF_ICONS: Record<string, string> = {
  like           : '❤️',
  comment        : '💬',
  comment_reply  : '↩️',
  mention        : '@',
  follow         : '👤',
  follow_request : '🔔',
  story_like     : '❤️',
  story_reply    : '💬',
  story_view     : '👁️',
  new_message    : '✉️',
  msg_reaction   : '😊',
  added_to_group : '👥',
  forward        : '↗️',
}

const NOTIF_TEXT_FA: Record<string, string> = {
  like           : 'پست شما را لایک کرد',
  comment        : 'روی پست شما کامنت گذاشت',
  comment_reply  : 'به کامنت شما پاسخ داد',
  mention        : 'شما را منشن کرد',
  follow         : 'شما را فالو کرد',
  follow_request : 'درخواست فالو فرستاد',
  story_like     : 'استوری شما را لایک کرد',
  story_reply    : 'به استوری شما پاسخ داد',
  story_view     : 'استوری شما را دید',
  new_message    : 'پیام جدید فرستاد',
  msg_reaction   : 'روی پیام شما واکنش داد',
  added_to_group : 'شما را به گروه اضافه کرد',
  forward        : 'پست شما را فوروارد کرد',
}

const NOTIF_TEXT_EN: Record<string, string> = {
  like           : 'liked your post',
  comment        : 'commented on your post',
  comment_reply  : 'replied to your comment',
  mention        : 'mentioned you',
  follow         : 'started following you',
  follow_request : 'sent you a follow request',
  story_like     : 'liked your story',
  story_reply    : 'replied to your story',
  story_view     : 'viewed your story',
  new_message    : 'sent you a message',
  msg_reaction   : 'reacted to your message',
  added_to_group : 'added you to a group',
  forward        : 'forwarded your post',
}

export default function NotificationsPage() {
  const { language }       = useUIStore()
  const navigate           = useNavigate()
  const fa                 = language === 'fa'
  const locale             = fa ? faIR : enUS
  const [onlyUnread, setOnlyUnread] = useState(false)

  const { data, isLoading }  = useNotifications(onlyUnread || undefined)
  const markRead             = useMarkRead()
  const markAllRead          = useMarkAllRead()
  const deleteNotif          = useDeleteNotification()

  const notifications = data?.results || data || []
  const texts         = fa ? NOTIF_TEXT_FA : NOTIF_TEXT_EN

  const getLink = (notif: any): string | null => {
    const obj = notif.content_object
    if (!obj) return null
    if (obj.type === 'post')    return `/post/${obj.id}`
    if (obj.type === 'comment') return `/post/${obj.id}`
    if (obj.type === 'message') return `/chat`
    return null
  }

  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="animate-spin text-muted-foreground" size={32} />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-foreground">
          {fa ? 'اعلان‌ها' : 'Notifications'}
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOnlyUnread(p => !p)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              onlyUnread
                ? 'bg-purple-500/20 text-purple-500'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {onlyUnread ? <Bell size={14} /> : <BellOff size={14} />}
            {fa ? 'خوانده‌نشده' : 'Unread'}
          </button>

          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            {markAllRead.isPending
              ? <Loader2 size={14} className="animate-spin" />
              : <CheckCheck size={14} />
            }
            {fa ? 'همه خوانده شد' : 'Mark all read'}
          </button>
        </div>
      </div>

      {/* List */}
      {notifications.length === 0 ? (
        <div className="text-center py-20">
          <Bell size={48} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">
            {fa ? 'اعلانی ندارید' : 'No notifications'}
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map((notif: any) => {
            const link = getLink(notif)
            const openNotification = () => {
              if (!notif.is_read) markRead.mutate(notif.id)
              if (link) navigate(link)
            }

            const content = (
              <>
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
                    {notif.sender?.avatar
                      ? <img src={notif.sender.avatar} alt="" className="w-full h-full object-cover" />
                      : notif.sender?.username?.[0]?.toUpperCase()
                    }
                  </div>
                  <div className="absolute -bottom-1 -end-1 w-5 h-5 rounded-full bg-background flex items-center justify-center text-xs">
                    {NOTIF_ICONS[notif.type] || '🔔'}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-relaxed">
                    <Link
                      to={`/profile/${notif.sender?.username}`}
                      className="font-semibold hover:underline"
                      onClick={e => e.stopPropagation()}
                    >
                      {notif.sender?.username}
                    </Link>
                    {' '}
                    {texts[notif.type] || notif.type}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale })}
                  </p>
                </div>

                {notif.content_object?.image && (
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img src={notif.content_object.image} alt="" className="w-full h-full object-cover" />
                  </div>
                )}

                {!notif.is_read && (
                  <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0 mt-2" />
                )}

                <button
                  onClick={e => {
                    e.preventDefault()
                    e.stopPropagation()
                    deleteNotif.mutate(notif.id)
                  }}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )

            const className = `flex items-start gap-3 p-3 rounded-xl transition-all cursor-pointer ${
              notif.is_read
                ? 'hover:bg-muted/50'
                : 'bg-purple-500/5 hover:bg-purple-500/10 border border-purple-500/10'
            }`

            return link ? (
              <div
                key={notif.id}
                role="link"
                tabIndex={0}
                onClick={openNotification}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    openNotification()
                  }
                }}
                className={className}
              >
                {content}
              </div>
            ) : (
              <div
                key={notif.id}
                onClick={() => !notif.is_read && markRead.mutate(notif.id)}
                className={className}
              >
                {content}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}