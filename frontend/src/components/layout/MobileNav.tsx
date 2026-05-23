import { NavLink, useLocation } from 'react-router-dom'
import {
  Home, Compass, PlusSquare, MessageCircle, User, Heart, Sun, Moon, Languages
} from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useNotificationCount } from '@/hooks/useNotifications'
import { useChatUnread } from '@/hooks/useChat'
import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import CreatePostModal from '@/components/post/CreatePostModal'
import { useMyProfile } from '@/hooks/useProfile'

export default function MobileNav() {
  const { theme, language, toggleTheme, setLanguage } = useUIStore()
  const { user }             = useAuthStore()
  const { data: notifCount } = useNotificationCount()
  const { data: chatUnread } = useChatUnread()
  const [showCreate, setShowCreate] = useState(false)
  const { data: profile } = useMyProfile()
  const location = useLocation()
  const avatar = profile?.avatar || user?.avatar || ''
  const fa = language === 'fa'

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border">
        <div className="absolute -top-11 end-3 flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={fa ? 'تغییر تم' : 'Toggle theme'}
            className="w-9 h-9 rounded-full border border-border bg-background/95 text-foreground shadow-sm backdrop-blur-md flex items-center justify-center"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button
            type="button"
            onClick={() => setLanguage(language === 'fa' ? 'en' : 'fa')}
            aria-label={fa ? 'تغییر زبان' : 'Change language'}
            className="h-9 min-w-9 px-2 rounded-full border border-border bg-background/95 text-xs font-semibold text-foreground shadow-sm backdrop-blur-md flex items-center justify-center gap-1"
          >
            <Languages size={15} />
            {language === 'fa' ? 'EN' : 'فا'}
          </button>
        </div>

        <div className="flex items-center justify-around px-2 py-1.5 safe-area-bottom">

          <NavLink
            to="/"
            end
            className={({ isActive }) => `
              flex flex-col items-center gap-0.5 p-2 rounded-xl flex-1 transition-colors
              ${isActive ? 'text-foreground' : 'text-muted-foreground'}
            `}
          >
            <Home size={22} />
            <span className="text-[10px]">{fa ? 'خانه' : 'Home'}</span>
          </NavLink>

          <NavLink
            to="/explore"
            className={({ isActive }) => `
              flex flex-col items-center gap-0.5 p-2 rounded-xl flex-1 transition-colors
              ${isActive ? 'text-foreground' : 'text-muted-foreground'}
            `}
          >
            <Compass size={22} />
            <span className="text-[10px]">{fa ? 'اکسپلور' : 'Search'}</span>
          </NavLink>

          <button
            onClick={() => setShowCreate(true)}
            className="flex flex-col items-center gap-0.5 p-2 rounded-xl flex-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <PlusSquare size={20} className="text-white" />
            </div>
          </button>

          <NavLink
            to="/notifications"
            className={({ isActive }) => `
              relative flex flex-col items-center gap-0.5 p-2 rounded-xl flex-1 transition-colors
              ${isActive ? 'text-foreground' : 'text-muted-foreground'}
            `}
          >
            <Heart size={22} />
            <span className="text-[10px]">{fa ? 'فعالیت' : 'Activity'}</span>
            {notifCount?.unread_count > 0 && (
              <span className="absolute top-1 right-3 w-2 h-2 bg-pink-500 rounded-full" />
            )}
          </NavLink>

          <NavLink
            to="/chat"
            className={({ isActive }) => `
              relative flex flex-col items-center gap-0.5 p-2 rounded-xl flex-1 transition-colors
              ${isActive ? 'text-foreground' : 'text-muted-foreground'}
            `}
          >
            <MessageCircle size={22} />
            <span className="text-[10px]">{fa ? 'پیام' : 'Chat'}</span>
            {chatUnread > 0 && (
              <span className="absolute top-1 right-3 w-4 h-4 bg-purple-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {chatUnread > 9 ? '9+' : chatUnread}
              </span>
            )}
          </NavLink>

          <NavLink
            to="/me"
            className={({ isActive }) => `
              flex flex-col items-center gap-0.5 p-2 rounded-xl flex-1 transition-colors
              ${isActive ? 'text-foreground' : 'text-muted-foreground'}
            `}
          >
            {avatar ? (
              <div className={`w-6 h-6 rounded-full overflow-hidden border-2 ${
                location.pathname === '/me' ? 'border-foreground' : 'border-transparent'
              }`}>
                <img src={avatar} alt="" className="w-full h-full object-cover" />
              </div>
            ) : (
              <User size={22} />
            )}
            <span className="text-[10px]">{fa ? 'من' : 'Profile'}</span>
          </NavLink>

        </div>
      </nav>

      {/* Padding برای صفحات */}
      <div className="md:hidden h-16" />

      {showCreate && <CreatePostModal onClose={() => setShowCreate(false)} />}
    </>
  )
}
