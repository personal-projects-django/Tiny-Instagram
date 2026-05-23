import { useState } from 'react'
import { X, Loader2, Send, Check } from 'lucide-react'
import { useChatRooms, useSendMessage } from '@/hooks/useChat'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'

interface Props {
  postId  : number
  onClose : () => void
}

export default function ShareToModal({ postId, onClose }: Props) {
  const { language }      = useUIStore()
  const { user }          = useAuthStore()
  const fa                = language === 'fa'
  const { data: rooms }   = useChatRooms()
  const sendMessage       = useSendMessage()
  const [sent, setSent]   = useState<Set<number>>(new Set())

  const roomList = rooms?.results || rooms || []

  const handleShare = async (roomId: number) => {
    const postUrl = `${window.location.origin}/post/${postId}`
    try {
      await sendMessage.mutateAsync({
        room: roomId,
        type: 'text',
        text: postUrl,
        forwarded_post: postId,
      })
      setSent(prev => new Set(prev).add(roomId))
    } catch (error) {
      console.error('Failed to forward post', error)
    }
  }

  const getName = (room: any) => {
    if (room.name) return room.name
    if (room.type === 'private') {
      const other = room.members?.find((m: any) => m.user.id !== user?.id)
      return other?.user?.username || '—'
    }
    return room.type
  }

  const getAvatar = (room: any) => {
    if (room.avatar) return room.avatar
    if (room.type === 'private') {
      const other = room.members?.find((m: any) => m.user.id !== user?.id)
      return other?.user?.avatar || ''
    }
    return ''
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
          <h2 className="text-sm font-semibold text-foreground">
            {fa ? 'فوروارد به' : 'Forward to'}
          </h2>
          <div className="w-5" />
        </div>

        {/* Rooms list */}
        <div className="max-h-96 overflow-y-auto">
          {roomList.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {fa ? 'گفتگویی ندارید' : 'No chats'}
            </div>
          ) : (
            roomList.map((room: any) => {
              const isSent = sent.has(room.id)
              const name   = getName(room)
              const avatar = getAvatar(room)
              return (
                <button
                  key={room.id}
                  onClick={() => !isSent && handleShare(room.id)}
                  disabled={isSent}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold overflow-hidden flex-shrink-0">
                    {avatar
                      ? <img src={avatar} alt="" className="w-full h-full object-cover" />
                      : name[0]?.toUpperCase()
                    }
                  </div>
                  <p className="flex-1 text-start text-sm font-medium text-foreground">{name}</p>
                  {isSent ? (
                    <Check size={18} className="text-green-500" />
                  ) : sendMessage.isPending ? (
                    <Loader2 size={16} className="animate-spin text-muted-foreground" />
                  ) : (
                    <Send size={16} className="text-purple-500" />
                  )}
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}