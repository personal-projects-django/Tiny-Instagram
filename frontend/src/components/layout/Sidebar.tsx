import { NavLink, useNavigate } from 'react-router-dom'
import { Home, Compass, MessageCircle,
  Bell, User, LogOut, Sun,PlusSquare,
  Moon, Languages, Bookmark } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { useNotificationCount } from '@/hooks/useNotifications'
import { useChatUnread } from '@/hooks/useChat'
import { api } from '@/api/client'
import { useState } from 'react'
import CreatePostModal from '@/components/post/CreatePostModal'
import { useQueryClient } from '@tanstack/react-query'
import { useMyProfile } from '@/hooks/useProfile'

const navItems = [
  { to: '/',             icon: Home,          labelFa: 'خانه',      labelEn: 'Home'   },
  { to: '/explore',      icon: Compass,       labelFa: 'اکسپلور',   labelEn: 'Explore'},
  { to: '/chat',         icon: MessageCircle, labelFa: 'پیام‌ها',   labelEn: 'Messages', badge: 'chat' },
  { to: '/notifications',icon: Bell,          labelFa: 'اعلان‌ها',  labelEn: 'Notifs',   badge: 'notif'},
  { to: '/saved',        icon: Bookmark,      labelFa: 'ذخیره‌شده‌ها', labelEn: 'Saved' },
  { to: '/me',           icon: User,          labelFa: 'پروفایل',   labelEn: 'Profile'},
]

export default function Sidebar() {
  const { user, logout }          = useAuthStore()
  const { theme, language, toggleTheme, setLanguage } = useUIStore()
  const { data: notifCount }      = useNotificationCount()
  const { data: chatUnread }      = useChatUnread()
  const navigate                  = useNavigate()
  const [showCreate, setShowCreate] = useState(false)
  const queryClient = useQueryClient()
  const { data: profile } = useMyProfile()
  const avatar = profile?.avatar || user?.avatar || ''
  const username = profile?.username || user?.username || ''

  const label = (fa: string, en: string) => language === 'fa' ? fa : en

  const handleLogout = async () => {
    try {
      const refresh = useAuthStore.getState().refreshToken
      await api.post('/account/logout/', { refresh_token: refresh })
    } finally {
      logout()
      queryClient.clear()
      navigate('/login')
    }
  }

  return (
    <>
      <aside className="
        hidden md:flex flex-col
        w-64 h-screen
        bg-sidebar border-e border-border
        sticky top-0 py-4
      ">
        {/* Logo */}
        <div className="px-5 pb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            TinyGram
          </h1>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-2 space-y-1">
          {navItems.map(({ to, icon: Icon, labelFa, labelEn, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl
                text-sm font-medium transition-all duration-150
                ${isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                }
              `}
            >
              <Icon size={22} />
              <span className="flex-1">{label(labelFa, labelEn)}</span>
              {badge === 'notif' && notifCount?.unread_count > 0 && (
                <span className="bg-pink-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                  {notifCount.unread_count > 99 ? '99+' : notifCount.unread_count}
                </span>
              )}
              {badge === 'chat' && chatUnread > 0 && (
                <span className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                  {chatUnread}
                </span>
              )}
            </NavLink>
          ))}

          {/* Create post button */}
          <button
            onClick={() => setShowCreate(true)}
            className="
              w-full flex items-center gap-3 px-4 py-3 rounded-xl
              text-sm font-medium text-muted-foreground
              hover:bg-accent/50 hover:text-foreground
              transition-all duration-150
            "
          >
            <PlusSquare size={22} />
            <span>{label('پست جدید', 'New Post')}</span>
          </button>
        </nav>

        {/* Bottom section */}
        <div className="px-2 pt-2 border-t border-border space-y-1">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-all"
          >
            {theme === 'dark'
              ? <Sun size={20} />
              : <Moon size={20} />
            }
            <span>{theme === 'dark'
              ? label('روشن', 'Light')
              : label('تاریک', 'Dark')
            }</span>
          </button>

          {/* Language toggle */}
          <button
            onClick={() => setLanguage(language === 'fa' ? 'en' : 'fa')}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-all"
          >
            <Languages size={20} />
            <span>{language === 'fa' ? 'English' : 'فارسی'}</span>
          </button>

          {/* User row */}
          <NavLink
            to="/me"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-accent/50 transition-all"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 overflow-hidden">
              {avatar
                ? <img src={avatar} alt="" className="w-full h-full object-cover" />
                : username?.[0]?.toUpperCase()
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{username}</p>
              <p className="text-xs text-muted-foreground">{label('پروفایل', 'Profile')}</p>
            </div>
          </NavLink>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
          >
            <LogOut size={20} />
            <span>{label('خروج', 'Logout')}</span>
          </button>
        </div>
      </aside>

      {showCreate && <CreatePostModal onClose={() => setShowCreate(false)} />}
    </>
  )
}