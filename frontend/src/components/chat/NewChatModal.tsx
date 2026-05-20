import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { X, Search, Loader2, MessageCircle, Users } from 'lucide-react'
import { profileApi } from '@/api/profile'
import { useCreateRoom } from '@/hooks/useChat'
import { useUIStore } from '@/store/uiStore'
import { useDebounce } from '@/hooks/useDebounce'

interface Props { onClose: () => void }

export default function NewChatModal({ onClose }: Props) {
  const { language }    = useUIStore()
  const navigate        = useNavigate()
  const fa              = language === 'fa'
  const createRoom      = useCreateRoom()

  const [type, setType]       = useState<'private' | 'group'>('private')
  const [search, setSearch]   = useState('')
  const [selected, setSelected] = useState<any[]>([])
  const [groupName, setGroupName] = useState('')
  const debounced = useDebounce(search, 400)

  const { data: results, isLoading } = useQuery({
    queryKey: ['user-search', debounced],
    queryFn : () => profileApi.searchUsers(debounced),
    enabled : debounced.length > 0,
  })

  const users = results?.results || results || []

  const toggleUser = (u: any) => {
    if (type === 'private') {
      handleCreate([u.id])
      return
    }
    setSelected(prev =>
      prev.find(s => s.id === u.id)
        ? prev.filter(s => s.id !== u.id)
        : [...prev, u]
    )
  }

  const handleCreate = async (memberIds: number[]) => {
    const room = await createRoom.mutateAsync({
      type,
      members: memberIds,
      name   : type === 'group' ? (groupName.trim() || (fa ? 'گروه جدید' : 'New Group')) : undefined,
    })
    onClose()
    navigate(`/chat/${room.id}`)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
          <h2 className="text-sm font-semibold text-foreground">
            {fa ? 'گفتگوی جدید' : 'New Chat'}
          </h2>
          {type === 'group' && selected.length > 0 ? (
            <button
              onClick={() => handleCreate(selected.map(s => s.id))}
              disabled={createRoom.isPending}
              className="text-sm font-semibold text-purple-500 disabled:opacity-50"
            >
              {createRoom.isPending
                ? <Loader2 size={14} className="animate-spin" />
                : (fa ? 'ساخت' : 'Create')
              }
            </button>
          ) : <div className="w-12" />}
        </div>

        {/* Type tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setType('private')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              type === 'private'
                ? 'text-purple-500 border-b-2 border-purple-500'
                : 'text-muted-foreground'
            }`}
          >
            <MessageCircle size={16} />
            {fa ? 'خصوصی' : 'Private'}
          </button>
          <button
            onClick={() => setType('group')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              type === 'group'
                ? 'text-purple-500 border-b-2 border-purple-500'
                : 'text-muted-foreground'
            }`}
          >
            <Users size={16} />
            {fa ? 'گروه' : 'Group'}
          </button>
        </div>

        {/* Group name */}
        {type === 'group' && (
          <div className="p-4 border-b border-border">
            <input
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              placeholder={fa ? 'نام گروه' : 'Group name'}
              className="w-full h-10 px-3 rounded-xl bg-input border border-border text-foreground text-sm outline-none focus:ring-2 focus:ring-purple-500/40 transition-all"
            />
            {selected.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selected.map(u => (
                  <span key={u.id} className="flex items-center gap-1 bg-purple-500/20 text-purple-500 text-xs rounded-full px-2 py-1">
                    {u.username}
                    <button onClick={() => toggleUser(u)}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search */}
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={fa ? 'جستجو...' : 'Search users...'}
              className="w-full h-10 ps-10 pe-3 rounded-xl bg-muted text-foreground text-sm outline-none focus:ring-2 focus:ring-purple-500/40 transition-all"
              autoFocus
            />
          </div>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-muted-foreground" size={24} />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {search ? (fa ? 'کاربری یافت نشد' : 'No users found') : (fa ? 'برای شروع جستجو کنید' : 'Search to start')}
            </div>
          ) : (
            users.map((u: any) => {
              const isSelected = selected.find(s => s.id === u.id)
              return (
                <button
                  key={u.id}
                  onClick={() => toggleUser(u)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors ${
                    isSelected ? 'bg-purple-500/10' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
                    {u.avatar
                      ? <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                      : u.username[0].toUpperCase()
                    }
                  </div>
                  <div className="flex-1 text-start">
                    <p className="text-sm font-medium text-foreground">{u.username}</p>
                    <p className="text-xs text-muted-foreground">{u.followers_count} {fa ? 'فالوور' : 'followers'}</p>
                  </div>
                  {type === 'group' && (
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'bg-purple-500 border-purple-500' : 'border-border'
                    }`}>
                      {isSelected && <span className="text-white text-xs">✓</span>}
                    </div>
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