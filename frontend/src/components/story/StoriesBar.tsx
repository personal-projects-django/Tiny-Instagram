import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { useMyProfile } from '@/hooks/useProfile'

export default function StoriesBar() {
  const { user }     = useAuthStore()
  const { language } = useUIStore()
  const navigate     = useNavigate()
  const fa           = language === 'fa'
  const { data: profile } = useMyProfile()
  const myAvatar = profile?.avatar || user?.avatar || ''
  const myUsername = profile?.username || user?.username || ''

  const { data: stories } = useQuery({
    queryKey: ['story-feed'],
    queryFn : () => api.get('/story/').then(r => r.data),
  })

  const groups = stories || []

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
      {/* Add story */}
      <button
        onClick={() => navigate('/stories/create')}
        className="flex flex-col items-center gap-1.5 flex-shrink-0"
      >
        <div className="relative w-16 h-16 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center hover:border-purple-500 transition-colors">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center overflow-hidden">
            {myAvatar
              ? <img src={myAvatar} alt="" className="w-full h-full object-cover" />
              : <span className="text-lg font-semibold text-muted-foreground">{myUsername?.[0]?.toUpperCase()}</span>
            }
          </div>
          <div className="absolute bottom-0 end-0 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center border-2 border-background">
            <Plus size={10} className="text-white" />
          </div>
        </div>
        <span className="text-xs text-muted-foreground max-w-[64px] truncate">
          {fa ? 'استوری' : 'Your story'}
        </span>
      </button>

      {/* Story groups */}
      {groups.map((group: any) => {
        const hasUnseen = group.has_unseen
        return (
          <button
            key={group.user.id}
            onClick={() => navigate(`/stories/${group.user.username}`)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0"
          >
            <div className={`w-16 h-16 rounded-full p-0.5 ${
              hasUnseen
                ? 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400'
                : 'bg-border'
            }`}>
              <div className="w-full h-full rounded-full border-2 border-background overflow-hidden bg-muted flex items-center justify-center">
                {group.user.avatar
                  ? <img src={group.user.avatar} alt="" className="w-full h-full object-cover" />
                  : <span className="text-lg font-semibold text-muted-foreground">{group.user.username[0].toUpperCase()}</span>
                }
              </div>
            </div>
            <span className="text-xs text-foreground max-w-[64px] truncate">
              {group.user.username}
            </span>
          </button>
        )
      })}
    </div>
  )
}
