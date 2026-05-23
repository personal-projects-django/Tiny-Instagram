import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'
import { useUIStore } from '@/store/uiStore'
import { useEffect } from 'react'

export default function MainLayout() {
  const { theme, language } = useUIStore()
  const location = useLocation()
  const chatPathParts = location.pathname.split('/')
  const isActiveChatRoom = chatPathParts[1] === 'chat' && !!chatPathParts[2]

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.dir = language === 'fa' ? 'rtl' : 'ltr'
    document.documentElement.lang = language
  }, [theme, language])

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar — desktop only */}
      <Sidebar />

      {/* Main content */}
      <main className={`flex-1 overflow-y-auto min-w-0 ${isActiveChatRoom ? 'pb-0' : 'pb-16'} md:pb-0`}>
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      {!isActiveChatRoom && <MobileNav />}
    </div>
  )
}
