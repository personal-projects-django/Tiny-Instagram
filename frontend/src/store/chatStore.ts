import { create } from 'zustand'

interface Message {
  id        : number
  room      : number
  sender    : { id: number; username: string; avatar: string }
  type      : string
  text      : string
  created_at: string
  is_edited : boolean
}

interface ChatState {
  socket          : WebSocket | null
  activeRoomId    : number | null
  liveMessages    : Record<number, Message[]>
  typingUsers     : Record<number, Set<string>>
  onlineUsers     : Set<number>

  connectSocket   : (roomId: number, token: string) => void
  disconnectSocket: () => void
  sendTyping      : () => void
  addLiveMessage  : (roomId: number, msg: Message) => void
  setActiveRoom   : (roomId: number | null) => void
  clearLiveMessages: (roomId: number) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  socket       : null,
  activeRoomId : null,
  liveMessages : {},
  typingUsers  : {},
  onlineUsers  : new Set(),

  connectSocket: (roomId, token) => {
    const wsEnabled = import.meta.env.VITE_ENABLE_WS === 'true'
    if (!wsEnabled) {
      set({ activeRoomId: roomId })
      return
    }

    const currentSocket = get().socket
    if (currentSocket && currentSocket.readyState !== WebSocket.CLOSING && currentSocket.readyState !== WebSocket.CLOSED) {
      currentSocket.close()
    }

    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const host  = window.location.host
    const ws    = new WebSocket(`${proto}://${host}/ws/chat/${roomId}/?token=${token}`)

    ws.onopen = () => undefined

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)

      if (data.type === 'message') {
        get().addLiveMessage(roomId, data.message)
      } else if (data.type === 'typing') {
        set(state => {
          const newTyping = { ...state.typingUsers }
          if (!newTyping[roomId]) newTyping[roomId] = new Set()
          newTyping[roomId].add(data.username)
          return { typingUsers: newTyping }
        })
        // پاک کردن بعد ۳ ثانیه
        setTimeout(() => {
          set(state => {
            const newTyping = { ...state.typingUsers }
            newTyping[roomId]?.delete(data.username)
            return { typingUsers: newTyping }
          })
        }, 3000)
      }
    }

    ws.onclose = () => undefined
    ws.onerror = () => undefined

    set({ socket: ws, activeRoomId: roomId })
  },

  disconnectSocket: () => {
    const ws = get().socket
    if (ws && ws.readyState !== WebSocket.CLOSING && ws.readyState !== WebSocket.CLOSED) {
      ws.close()
    }
    set({ socket: null, activeRoomId: null })
  },

  sendTyping: () => {
    const ws = get().socket
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action: 'typing' }))
    }
  },

  addLiveMessage: (roomId, msg) =>
    set(state => ({
      liveMessages: {
        ...state.liveMessages,
        [roomId]: [...(state.liveMessages[roomId] || []), msg],
      },
    })),

  setActiveRoom: (roomId) => set({ activeRoomId: roomId }),

  clearLiveMessages: (roomId) =>
    set(state => {
      const newLive = { ...state.liveMessages }
      delete newLive[roomId]
      return { liveMessages: newLive }
    }),
}))