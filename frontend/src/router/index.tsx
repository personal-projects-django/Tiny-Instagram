import SavedPostsPage from '@/pages/Saved/SavedPostsPage'
import StoryViewerPage from '@/pages/Story/StoryViewerPage'
import CreateStoryPage from '@/pages/Story/CreateStoryPage'
import MyProfilePage     from '@/pages/Profile/MyProfilePage'
import PublicProfilePage from '@/pages/Profile/PublicProfilePage'
import ExplorePage       from '@/pages/Explore/ExplorePage'
import NotificationsPage from '@/pages/Notifications/NotificationsPage'
import FeedPage from '@/pages/Feed/FeedPage'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import MainLayout from '@/components/layout/MainLayout'
import LoginPage    from '@/pages/Auth/LoginPage'
import RegisterPage from '@/pages/Auth/RegisterPage'
import ChatPage from '@/pages/Chat/ChatPage'
import ForgotPasswordPage from '@/pages/Auth/ForgotPasswordPage'
import PostDetailPage from '@/pages/Post/PostDetailPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" replace />
}

export const router = createBrowserRouter([
  {
    path   : '/login',
    element: <PublicRoute><LoginPage /></PublicRoute>,
  },
  {
    path   : '/register',
    element: <PublicRoute><RegisterPage /></PublicRoute>,
  },
  {
    path    : '/',
    element : <PrivateRoute><MainLayout /></PrivateRoute>,
    children: [
      // {
      //   index  : true,
      //   element: <div className="p-8 text-foreground text-2xl">خوش اومدی! 👋</div>,
      // },
        {
        index  : true,
        element: <FeedPage />
      },
        // داخل children اضافه کن:

        { path: 'explore',           element: <ExplorePage />       },
        { path: 'me',                element: <MyProfilePage />     },
        { path: 'profile/:username', element: <PublicProfilePage /> },
        { path: 'notifications', element: <NotificationsPage /> },
        { path: 'stories/create',       element: <CreateStoryPage /> },
        { path: 'stories/:username',    element: <StoryViewerPage /> },
        { path: 'chat',          element: <ChatPage /> },
        { path: 'chat/:roomId',  element: <ChatPage /> },
        { path: '/forgot', element: <PublicRoute><ForgotPasswordPage /></PublicRoute> },
        { path: 'post/:id', element: <PostDetailPage /> },
        { path: 'saved', element: <SavedPostsPage /> },
    ],
  },
])