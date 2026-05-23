
import { useForm } from 'react-hook-form'
import { X, Loader2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { postApi } from '@/api/post'
import { useUIStore } from '@/store/uiStore'

interface Props {
  post    : any
  onClose : () => void
}

export default function EditPostModal({ post, onClose }: Props) {
  const { language } = useUIStore()
  const fa           = language === 'fa'
  const qc           = useQueryClient()

  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: {
      caption           : post.caption || '',
      visibility        : post.visibility || 'public',
      comments_disabled : post.comments_disabled || false,
    },
  })

  const updatePost = useMutation({
    mutationFn: (data: any) => postApi.updatePost(post.id, data),
    onSuccess : () => {
      qc.invalidateQueries({ queryKey: ['feed'] })
      qc.invalidateQueries({ queryKey: ['post', post.id] })
      qc.invalidateQueries({ queryKey: ['user-posts'] })
      onClose()
    },
  })

  const onSubmit = (data: any) => updatePost.mutate(data)

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">

        <div className="flex items-center justify-between p-4 border-b border-border">
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
          <h2 className="text-sm font-semibold text-foreground">
            {fa ? 'ویرایش پست' : 'Edit Post'}
          </h2>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || updatePost.isPending}
            className="text-sm font-semibold text-purple-500 hover:text-purple-400 disabled:opacity-50 flex items-center gap-1"
          >
            {updatePost.isPending && <Loader2 size={14} className="animate-spin" />}
            {fa ? 'ذخیره' : 'Save'}
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
          <textarea
            {...register('caption')}
            placeholder={fa ? 'کپشن...' : 'Caption...'}
            rows={4}
            className="w-full px-3 py-2 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 resize-none"
          />

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">
              {fa ? 'دیده شدن توسط' : 'Visibility'}
            </label>
            <select
              {...register('visibility')}
              className="w-full h-9 px-3 rounded-xl bg-input border border-border text-foreground text-sm outline-none focus:ring-2 focus:ring-purple-500/40"
            >
              <option value="public">{fa ? 'همه' : 'Everyone'}</option>
              <option value="followers">{fa ? 'فالوورها' : 'Followers'}</option>
              <option value="private">{fa ? 'فقط خودم' : 'Only me'}</option>
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input {...register('comments_disabled')} type="checkbox" className="w-4 h-4 rounded accent-purple-500" />
            <span className="text-sm text-foreground">
              {fa ? 'غیرفعال کردن کامنت‌ها' : 'Disable comments'}
            </span>
          </label>
        </form>
      </div>
    </div>
  )
}