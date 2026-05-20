import { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, Smile, Mic, X, Image as ImageIcon, FileText, Loader2, MapPin, Film } from 'lucide-react'
import { useSendMessage } from '@/hooks/useChat'
import { useChatStore } from '@/store/chatStore'
import { useUIStore } from '@/store/uiStore'

const EMOJIS = ['😀','😂','❤️','👍','🙏','🎉','🔥','💯','😢','😮','🥰','😎','🤔','👏','💪','✨']

interface Props {
  roomId       : number
  replyTo      : any
  onCancelReply: () => void
}

export default function ChatInput({ roomId, replyTo, onCancelReply }: Props) {
  const { language }  = useUIStore()
  const fa            = language === 'fa'
  const sendMessage   = useSendMessage()
  const sendTyping    = useChatStore(s => s.sendTyping)

  const [text, setText]                 = useState('')
  const [showEmojis, setShowEmojis]     = useState(false)
  const [showAttach, setShowAttach]     = useState(false)
  const [isRecording, setIsRecording]   = useState(false)
  const fileRef     = useRef<HTMLInputElement>(null)
  const imageRef    = useRef<HTMLInputElement>(null)
  const gifRef      = useRef<HTMLInputElement>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef   = useRef<Blob[]>([])
  const typingTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    setText('')
    setShowEmojis(false)
    setShowAttach(false)
  }, [roomId])

  // typing event
  useEffect(() => {
    if (!text) return
    sendTyping()
    if (typingTimer.current) clearTimeout(typingTimer.current)
    typingTimer.current = window.setTimeout(() => {}, 1000)
  }, [text])

  const handleSend = async () => {
    const messageText = text.trim()
    if (!messageText || sendMessage.isPending) return

    const payload: any = {
      room: roomId,
      type: 'text',
      text: messageText,
    }
    if (replyTo) payload.reply_to = replyTo.id

    setText('')
    try {
      await sendMessage.mutateAsync(payload)
      onCancelReply()
    } catch {}
  }

  const handleFileUpload = async (file: File, type: 'image' | 'video' | 'file') => {
    const fd = new FormData()
    fd.append('room', String(roomId))
    fd.append('type', type)
    fd.append('file', file)
    if (replyTo) fd.append('reply_to', String(replyTo.id))

    await sendMessage.mutateAsync(fd)
    setShowAttach(false)
    onCancelReply()
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const type = f.type.startsWith('video/') ? 'video' : 'image'
    handleFileUpload(f, type as any)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFileUpload(f, 'file')
  }

  const handleGifSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFileUpload(f, 'gif' as any)
  }

  const handleLocationSend = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(async pos => {
      await sendMessage.mutateAsync({
        room: roomId,
        type: 'location',
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        ...(replyTo ? { reply_to: replyTo.id } : {}),
      })
      setShowAttach(false)
      onCancelReply()
    })
  }

  const toggleRecording = async () => {
    if (isRecording) {
      recorderRef.current?.stop()
      return
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)
    chunksRef.current = []
    recorder.ondataavailable = e => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.onstop = async () => {
      stream.getTracks().forEach(track => track.stop())
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
      const file = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type })
      setIsRecording(false)
      await handleFileUpload(file, 'voice' as any)
    }
    recorderRef.current = recorder
    recorder.start()
    setIsRecording(true)
  }

  return (
    <div className="border-t border-border bg-card">

      {/* Reply bar */}
      {replyTo && (
        <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 border-b border-border">
          <div className="w-1 h-8 bg-purple-500 rounded-full" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-purple-500">
              {fa ? 'پاسخ به' : 'Reply to'} {replyTo.sender?.username}
            </p>
            <p className="text-xs text-muted-foreground truncate">{replyTo.text}</p>
          </div>
          <button onClick={onCancelReply} className="text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2 px-3 py-3">

        {/* Attach */}
        <div className="relative">
          <button
            onClick={() => setShowAttach(p => !p)}
            className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
          >
            <Paperclip size={20} />
          </button>

          {showAttach && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowAttach(false)} />
              <div className="absolute bottom-12 start-0 z-40 bg-card border border-border rounded-xl shadow-lg p-2 w-44">
                <button
                  onClick={() => imageRef.current?.click()}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  <ImageIcon size={16} className="text-purple-500" />
                  {fa ? 'عکس و ویدیو' : 'Photos & Videos'}
                </button>
                <button
                  onClick={() => gifRef.current?.click()}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  <Film size={16} className="text-pink-500" />
                  {fa ? 'گیف' : 'GIF'}
                </button>
                <button
                  onClick={handleLocationSend}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  <MapPin size={16} className="text-green-500" />
                  {fa ? 'لوکیشن' : 'Location'}
                </button>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  <FileText size={16} className="text-blue-500" />
                  {fa ? 'فایل' : 'File'}
                </button>
              </div>
            </>
          )}

          <input
            ref={imageRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleImageSelect}
          />
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
          />
          <input
            ref={gifRef}
            type="file"
            accept="image/gif"
            className="hidden"
            onChange={handleGifSelect}
          />
        </div>

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder={fa ? 'پیام...' : 'Message...'}
            rows={1}
            className="
              w-full px-4 py-2.5 rounded-2xl
              bg-muted border border-border
              text-foreground placeholder:text-muted-foreground
              text-sm outline-none
              focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500
              transition-all resize-none max-h-32
            "
            style={{ minHeight: '40px' }}
          />
        </div>

        {/* Emoji */}
        <div className="relative">
          <button
            onClick={() => setShowEmojis(p => !p)}
            className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
          >
            <Smile size={20} />
          </button>
          {showEmojis && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowEmojis(false)} />
              <div className="absolute bottom-12 end-0 z-40 bg-card border border-border rounded-xl shadow-lg p-2 grid grid-cols-8 gap-1 w-72">
                {EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => { setText(t => t + emoji); setShowEmojis(false) }}
                    className="text-xl hover:bg-muted rounded p-1.5 transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Send / Mic */}
        {text.trim() ? (
          <button
            onClick={handleSend}
            disabled={sendMessage.isPending}
            className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-full hover:scale-105 transition-transform disabled:opacity-50"
          >
            {sendMessage.isPending
              ? <Loader2 size={18} className="animate-spin" />
              : <Send size={18} className="rtl:rotate-180" />
            }
          </button>
        ) : (
          <button
            onClick={toggleRecording}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
          >
            <Mic size={20} />
          </button>
        )}
      </div>
    </div>
  )
}