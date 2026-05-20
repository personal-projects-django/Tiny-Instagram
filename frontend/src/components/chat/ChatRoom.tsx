import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, MoreVertical, Phone, Video, Loader2, X, Users, Save } from 'lucide-react'
import { useRoom, useMessages, useMarkMessageRead, useUpdateRoom } from '@/hooks/useChat'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'

interface Props { roomId: number }

export default function ChatRoom({ roomId }: Props) {
  const navigate     = useNavigate()
  const { language } = useUIStore()
  const { user, accessToken } = useAuthStore()
  const fa           = language === 'fa'

  const { data: room }      = useRoom(roomId)
  const { data: messagesData, isLoading } = useMessages(roomId)
  const markRead = useMarkMessageRead()
  const updateRoom = useUpdateRoom()

  const { connectSocket, disconnectSocket, liveMessages, typingUsers, clearLiveMessages } = useChatStore()

  const [replyTo, setReplyTo] = useState<any>(null)
  const [showRoomInfo, setShowRoomInfo] = useState(false)
  const [groupName, setGroupName] = useState('')
  const scrollRef             = useRef<HTMLDivElement>(null)

  // اتصال WebSocket
  useEffect(() => {
    if (roomId && accessToken) {
      connectSocket(roomId, accessToken)
    }
    return () => {
      disconnectSocket()
      clearLiveMessages(roomId)
    }
  }, [roomId, accessToken])

  // ترکیب پیام‌های REST + WebSocket
  const historyMessages = messagesData?.results || messagesData || []
  const liveForRoom     = liveMessages[roomId] || []

  // حذف duplicate
  const seen = new Set(historyMessages.map((m: any) => m.id))
  const newLive = liveForRoom.filter(m => !seen.has(m.id))
  const allMessages = [...historyMessages, ...newLive].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  // اسکرول به آخرین پیام
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [allMessages.length])

  // اطلاعات نمایش
  const getDisplayName = () => {
    if (room?.name) return room.name
    if (room?.type === 'private') {
      const other = room.members?.find((m: any) => m.user.id !== user?.id)
      return other?.user?.username || '—'
    }
    return ''
  }

  const getAvatar = () => {
    if (room?.avatar) return room.avatar
    if (room?.type === 'private') {
      const other = room.members?.find((m: any) => m.user.id !== user?.id)
      return other?.user?.avatar || ''
    }
    return ''
  }

  useEffect(() => {
    if (room?.name) setGroupName(room.name)
  }, [room?.name])

  useEffect(() => {
    allMessages.forEach((msg: any) => {
      if (msg.sender?.id !== user?.id && !msg.is_read_by_me) {
        markRead.mutate(msg.id)
      }
    })
  }, [roomId, allMessages.length, user?.id])

  const otherMember = room?.type === 'private'
    ? room.members?.find((m: any) => m.user?.id !== user?.id)
    : null

  const canEditRoom = room?.members?.some((m: any) =>
    m.user?.id === user?.id && ['owner', 'admin'].includes(m.role)
  )

  const typingList = Array.from(typingUsers[roomId] || [])
    .filter(u => u !== user?.username)

  return (
    <div className="flex flex-col w-full h-full bg-background">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <button
          onClick={() => navigate('/chat')}
          className="md:hidden text-muted-foreground"
        >
          <ArrowLeft size={22} className="rtl:rotate-180" />
        </button>

        <button
          type="button"
          onClick={() => room?.type === 'private' && otherMember?.user?.username ? navigate(`/profile/${otherMember.user.username}`) : setShowRoomInfo(true)}
          className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold overflow-hidden flex-shrink-0"
        >
          {getAvatar()
            ? <img src={getAvatar()} alt="" className="w-full h-full object-cover" />
            : getDisplayName()[0]?.toUpperCase()
          }
        </button>

        <button
          type="button"
          onClick={() => room?.type === 'private' && otherMember?.user?.username ? navigate(`/profile/${otherMember.user.username}`) : setShowRoomInfo(true)}
          className="flex-1 min-w-0 text-start"
        >
          <p className="text-sm font-semibold text-foreground truncate">{getDisplayName()}</p>
          <p className="text-xs text-muted-foreground truncate">
            {typingList.length > 0
              ? (fa ? 'در حال نوشتن...' : 'Typing...')
              : room?.type === 'group'
                ? `${room.members?.length} ${fa ? 'عضو' : 'members'}`
                : (fa ? 'آنلاین' : 'Online')
            }
          </p>
        </button>

        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <Phone size={20} />
        </button>
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <Video size={20} />
        </button>
        <button onClick={() => setShowRoomInfo(true)} className="text-muted-foreground hover:text-foreground transition-colors">
          <MoreVertical size={20} />
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-2"
      >
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-muted-foreground" size={24} />
          </div>
        ) : allMessages.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-sm">
              {fa ? 'هنوز پیامی نیست — اولین پیام رو بفرست' : 'No messages yet — say hi!'}
            </p>
          </div>
        ) : (
          allMessages.map((msg: any, i: number) => {
            const prev    = allMessages[i - 1]
            const showAvatar = !prev || prev.sender?.id !== msg.sender?.id

            return (
              <MessageBubble
                key={msg.id}
                message={msg}
                isMine={msg.sender?.id === user?.id}
                showAvatar={showAvatar}
                onReply={() => setReplyTo(msg)}
              />
            )
          })
        )}

        {/* Typing indicator */}
        {typingList.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground ps-2">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span>{typingList.join(', ')}</span>
          </div>
        )}
      </div>

      {showRoomInfo && room?.type === 'group' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <button onClick={() => setShowRoomInfo(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
              <h2 className="text-sm font-semibold text-foreground">{fa ? 'اطلاعات گروه' : 'Group info'}</h2>
              <div className="w-5" />
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <input
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  disabled={!canEditRoom}
                  className="flex-1 h-10 px-3 rounded-xl bg-input border border-border text-foreground text-sm outline-none focus:ring-2 focus:ring-purple-500/40 disabled:opacity-70"
                />
                {canEditRoom && (
                  <button
                    onClick={() => updateRoom.mutate({ id: roomId, data: { name: groupName } })}
                    disabled={updateRoom.isPending || !groupName.trim()}
                    className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center disabled:opacity-50"
                  >
                    <Save size={16} />
                  </button>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2 text-sm font-medium text-foreground">
                  <Users size={16} />
                  {room.members?.length || 0} {fa ? 'عضو' : 'members'}
                </div>
                <div className="space-y-1 max-h-72 overflow-y-auto">
                  {room.members?.map((member: any) => (
                    <Link
                      key={member.id}
                      to={`/profile/${member.user?.username}`}
                      onClick={() => setShowRoomInfo(false)}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted transition-colors"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold overflow-hidden">
                        {member.user?.avatar ? <img src={member.user.avatar} alt="" className="w-full h-full object-cover" /> : member.user?.username?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{member.user?.username}</p>
                        <p className="text-xs text-muted-foreground">{member.role}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <ChatInput
        roomId={roomId}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  )
}