import StoryActivityModal from '@/components/story/StoryActivityModal'
import { Sparkles } from 'lucide-react'
import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Camera, Loader2, Grid3X3, Bookmark, Settings, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useMyProfile, useUpdateProfile, useChangePassword } from '@/hooks/useProfile'
import { useSavedPosts, useUserPosts } from '@/hooks/usePosts'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'



type Tab = 'posts' | 'saved'

export default function MyProfilePage() {
  const { language }        = useUIStore()
  const { user, setUser }   = useAuthStore()
  const fa                  = language === 'fa'
  const [tab, setTab]       = useState<Tab>('posts')
  const [editMode, setEditMode] = useState(false)
  const [showPassForm, setShowPassForm] = useState(false)
  const [showStoryActivity, setShowStoryActivity] = useState(false)
  const fileRef             = useRef<HTMLInputElement>(null)


  const { data: profile, isLoading } = useMyProfile()
  const { data: postsData }          = useUserPosts(user?.username || '')
  const { data: savedData }          = useSavedPosts()
  const updateProfile                = useUpdateProfile()
  const changePassword               = useChangePassword()

  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    values: {
      username  : profile?.username  || '',
      bio       : profile?.bio       || '',
      first_name: profile?.first_name || '',
      last_name : profile?.last_name  || '',
    }
  })

  const {
    register: regPass,
    handleSubmit: handlePass,
    reset: resetPass,
    formState: { isSubmitting: passSubmitting },
  } = useForm<{ old_password: string; new_password: string }>()

  const onSaveProfile = async (data: any) => {
    const fd = new FormData()
    Object.entries(data).forEach(([k, v]) => v && fd.append(k, v as string))
    await updateProfile.mutateAsync(fd)
    setEditMode(false)
  }

  const onChangePassword = async (data: any) => {
    await changePassword.mutateAsync(data)
    resetPass()
    setShowPassForm(false)
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('avatar', file)
    const res = await updateProfile.mutateAsync(fd)
    if (res?.avatar) setUser({ ...user!, avatar: res.avatar })
  }

  const posts = postsData?.results || postsData || []
  const savedPosts = savedData?.results || savedData || []
  const displayedPosts = tab === 'saved' ? savedPosts : posts

  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="animate-spin text-muted-foreground" size={32} />
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-6">

      {/* Profile header */}
      <div className="flex flex-col sm:flex-row gap-6 mb-8">

        {/* Avatar */}
        <div className="flex justify-center sm:justify-start">
          <div className="relative">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              {profile?.avatar && profile.avatar !== 'default.jpg'
                ? <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
                : <span className="text-4xl font-bold text-white">
                    {user?.username?.[0]?.toUpperCase()}
                  </span>
              }
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 end-0 w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center border-2 border-background hover:bg-purple-400 transition-colors"
            >
              <Camera size={14} className="text-white" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1">
          {!editMode ? (
            <>
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <h1 className="text-xl font-bold text-foreground">{profile?.username}</h1>
                <button
                  onClick={() => setEditMode(true)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <Settings size={14} />
                  {fa ? 'ویرایش پروفایل' : 'Edit Profile'}
                </button>
                <button
                  onClick={() => setShowPassForm(p => !p)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
                >
                  <Lock size={14} />
                </button>
              </div>

              {/* Stats */}
              <div className="flex gap-6 mb-3">
                {[
                  { label: fa ? 'پست' : 'Posts',       value: profile?.posts_count    || 0 },
                  { label: fa ? 'فالوور' : 'Followers', value: profile?.followers_count || 0 },
                  { label: fa ? 'فالووینگ' : 'Following', value: profile?.following_count || 0 },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <p className="text-base font-bold text-foreground">{value.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>

              {profile?.full_name && (
                <p className="text-sm font-medium text-foreground">{profile.full_name}</p>
              )}
              {profile?.bio && (
                <p className="text-sm text-foreground mt-1 leading-relaxed">{profile.bio}</p>
              )}
            </>
          ) : (
            /* Edit form */
            <form onSubmit={handleSubmit(onSaveProfile)} className="space-y-3">
              {[
                { name: 'username',   label: fa ? 'نام کاربری' : 'Username',   type: 'text' },
                { name: 'first_name', label: fa ? 'نام'        : 'First name',  type: 'text' },
                { name: 'last_name',  label: fa ? 'نام خانوادگی' : 'Last name', type: 'text' },
              ].map(f => (
                <div key={f.name}>
                  <label className="text-xs text-muted-foreground mb-1 block">{f.label}</label>
                  <input
                    {...register(f.name as any)}
                    type={f.type}
                    className="w-full h-9 px-3 rounded-lg bg-input border border-border text-foreground text-sm outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{fa ? 'بیو' : 'Bio'}</label>
                <textarea
                  {...register('bio')}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground text-sm outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-9 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                  {fa ? 'ذخیره' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="flex-1 h-9 rounded-lg border border-border text-sm text-foreground hover:bg-muted transition-colors"
                >
                  {fa ? 'انصراف' : 'Cancel'}
                </button>
              </div>
            </form>
          )}

          {/* Change password form */}
          {showPassForm && (
            <form onSubmit={handlePass(onChangePassword)} className="mt-4 space-y-3 p-4 bg-muted rounded-xl">
              <p className="text-sm font-medium text-foreground">{fa ? 'تغییر رمز عبور' : 'Change Password'}</p>
              {[
                { name: 'old_password', label: fa ? 'رمز فعلی'   : 'Current password' },
                { name: 'new_password', label: fa ? 'رمز جدید'   : 'New password'     },
              ].map(f => (
                <div key={f.name}>
                  <label className="text-xs text-muted-foreground mb-1 block">{f.label}</label>
                  <input
                    {...regPass(f.name as any, { required: true, minLength: 8 })}
                    type="password"
                    className="w-full h-9 px-3 rounded-lg bg-input border border-border text-foreground text-sm outline-none focus:ring-2 focus:ring-purple-500/40 transition-all"
                  />
                </div>
              ))}
              <button
                type="submit"
                disabled={passSubmitting}
                className="w-full h-9 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {passSubmitting && <Loader2 size={14} className="animate-spin" />}
                {fa ? 'تغییر رمز' : 'Change Password'}
              </button>

            </form>
          )}
           <button
                onClick={() => setShowStoryActivity(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
              >
                <Sparkles size={14} />
                {fa ? 'استوری‌ها' : 'Stories'}
              </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-t border-border">
        {[
          { id: 'posts', icon: Grid3X3,  labelFa: 'پست‌ها',      labelEn: 'Posts'  },
          { id: 'saved', icon: Bookmark, labelFa: 'ذخیره‌شده‌ها', labelEn: 'Saved'  },
        ].map(({ id, icon: Icon, labelFa, labelEn }) => (
          <button
            key={id}
            onClick={() => setTab(id as Tab)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-t-2 transition-colors ${
              tab === id
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon size={16} />
            {fa ? labelFa : labelEn}
          </button>
        ))}
      </div>

      {/* Posts grid */}
      <div className="grid grid-cols-3 gap-1 mt-1">
        {displayedPosts.length === 0 ? (
          <div className="col-span-3 text-center py-16 text-muted-foreground">
            {tab === 'saved'
              ? (fa ? 'هنوز پستی ذخیره نکردی' : 'No saved posts yet')
              : (fa ? 'هنوز پستی نیست' : 'No posts yet')
            }
          </div>
        ) : (
          displayedPosts.map((post: any) => {
            const media = post.medias?.[0]
            return (
              <Link
                key={post.id}
                to={`/post/${post.id}`}
                className="relative aspect-square bg-muted overflow-hidden group"
              >
                {media?.file && (
                  <img
                    src={media.file}
                    alt=""
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <span className="text-white text-sm font-semibold">♥ {post.likes_count}</span>
                  <span className="text-white text-sm font-semibold">💬 {post.comments_count}</span>
                </div>
              </Link>
            )
          })
        )}
      </div>
      {showStoryActivity && (
        <StoryActivityModal onClose={() => setShowStoryActivity(false)} />
      )}
    </div>
  )
}