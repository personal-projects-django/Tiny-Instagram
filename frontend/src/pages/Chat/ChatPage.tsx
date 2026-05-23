import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Search, Plus, MessageCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { faIR, enUS } from 'date-fns/locale'
import { useChatRooms } from '@/hooks/useChat'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import ChatRoom from '@/components/chat/ChatRoom'
import NewChatModal from '@/components/chat/NewChatModal'

export default function ChatPage() {
  const { roomId }      = useParams<{ roomId: string }>()
  const navigate        = useNavigate()
  const { language }    = useUIStore()
  const { user }        = useAuthStore()
  const fa              = language === 'fa'
  const locale          = fa ? faIR : enUS

  const [search, setSearch]       = useState('')
  const [showNewChat, setShowNewChat] = useState(false)

  const { data: roomsData } = useChatRooms()
  const rooms = roomsData?.results || roomsData || []

  const filteredRooms = rooms.filter((r: any) => {
    if (!search) return true
    const lower = search.toLowerCase()
    if (r.name?.toLowerCase().includes(lower)) return true
    const other = r.members?.find((m: any) => m.user?.id !== user?.id)
    return other?.user?.username?.toLowerCase().includes(lower)
  })

  const getRoomDisplayName = (room: any) => {
    if (room.name) return room.name
    if (room.type === 'private') {
      const other = room.members?.find((m: any) => m.user?.id !== user?.id)
      return other?.user?.username || '—'
    }
    return room.type
  }

  const getRoomAvatar = (room: any) => {
    if (room.avatar) return room.avatar
    if (room.type === 'private') {
      const other = room.members?.find((m: any) => m.user?.id !== user?.id)
      return other?.user?.avatar || ''
    }
    return ''
  }

  return (
    <div className="flex h-[calc(100vh-0px)] md:h-screen">

      {/* Rooms list */}
      <aside className={`
        ${roomId ? 'hidden md:flex' : 'flex'}
        flex-col w-full md:w-80 border-e border-border bg-card
      `}>
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-foreground">
              {fa ? 'پیام‌ها' : 'Messages'}
            </h1>
            <button
              onClick={() => setShowNewChat(true)}
              className="w-9 h-9 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>
          <div className="relative">
            <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={fa ? 'جستجو...' : 'Search...'}
              className="w-full h-10 ps-10 pe-3 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground text-sm outline-none focus:ring-2 focus:ring-purple-500/40 transition-all"
            />
          </div>
        </div>

        {/* Rooms */}
        <div className="flex-1 overflow-y-auto">
          {filteredRooms.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MessageCircle size={40} className="mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                {fa ? 'هیچ گفتگویی نیست' : 'No chats yet'}
              </p>
            </div>
          ) : (
            filteredRooms.map((room: any) => {
              const isActive = Number(roomId) === room.id
              const name     = getRoomDisplayName(room)
              const avatar   = getRoomAvatar(room)

              return (
                <button
                  key={room.id}
                  onClick={() => navigate(`/chat/${room.id}`)}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors border-b border-border/30 ${
                    isActive ? 'bg-purple-500/10' : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold overflow-hidden flex-shrink-0">
                    {avatar
                      ? <img src={avatar} alt="" className="w-full h-full object-cover" />
                      : name[0]?.toUpperCase()
                    }
                  </div>
                  <div className="flex-1 min-w-0 text-start">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">{name}</p>
                      {room.last_message?.time && (
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {formatDistanceToNow(new Date(room.last_message.time), { locale }).replace('about ', '')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className="text-xs text-muted-foreground truncate">
                        {room.last_message
                          ? `${room.last_message.sender ? room.last_message.sender + ': ' : ''}${room.last_message.text}`
                          : (fa ? 'بدون پیام' : 'No messages')
                        }
                      </p>
                      {room.unread_count > 0 && (
                        <span className="bg-purple-500 text-white text-xs font-bold rounded-full px-2 py-0.5 flex-shrink-0">
                          {room.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </aside>

      {/* Active room */}
      <main className={`${roomId ? 'flex' : 'hidden md:flex'} flex-1`}>
        {roomId ? (
          <ChatRoom key={roomId} roomId={Number(roomId)} />
        ) : (
          <div className="w-full flex flex-col items-center justify-center text-muted-foreground">
            <MessageCircle size={64} className="opacity-30 mb-4" />
            <p>{fa ? 'یک گفتگو انتخاب کنید' : 'Select a chat to start messaging'}</p>
          </div>
        )}
      </main>

      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} />}
    </div>
  )
}