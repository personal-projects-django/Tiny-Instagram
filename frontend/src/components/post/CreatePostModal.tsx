import { useState, useRef, useCallback } from 'react'
import { X, Upload, ChevronLeft, ChevronRight, Loader2, ImagePlus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useCreatePost } from '@/hooks/usePosts'
import { useUIStore } from '@/store/uiStore'
import { useNavigate } from 'react-router-dom'

interface Props { onClose: () => void }

type Step = 'upload' | 'edit'

export default function CreatePostModal({ onClose }: Props) {
  const { language }  = useUIStore()
  const fa            = language === 'fa'
  const navigate      = useNavigate()
  const createPost    = useCreatePost()

  const [step, setStep]         = useState<Step>('upload')
  const [files, setFiles]       = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [mediaIndex, setMediaIndex] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const fileRef                 = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: { caption: '', visibility: 'public', comments_disabled: false }
  })

  const handleFiles = useCallback((newFiles: File[]) => {
    const valid = newFiles.filter(f =>
      f.type.startsWith('image/') || f.type.startsWith('video/')
    )
    if (!valid.length) return
    setFiles(valid)
    setPreviews(valid.map(f => URL.createObjectURL(f)))
    setStep('edit')
  }, [])

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(Array.from(e.dataTransfer.files))
  }

  const onSubmit = async (data: any) => {
    const fd = new FormData()
    fd.append('caption',           data.caption)
    fd.append('visibility',        data.visibility)
    fd.append('comments_disabled', data.comments_disabled ? 'true' : 'false')
    files.forEach(f => fd.append('medias', f))
    await createPost.mutateAsync(fd)
    onClose()
    navigate('/')
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={20} />
          </button>
          <h2 className="text-sm font-semibold text-foreground">
            {fa ? 'پست جدید' : 'New Post'}
          </h2>
          {step === 'edit' ? (
            <button
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="text-sm font-semibold text-purple-500 hover:text-purple-400 transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              {fa ? 'انتشار' : 'Share'}
            </button>
          ) : (
            <div className="w-12" />
          )}
        </div>

        {/* Upload step */}
        {step === 'upload' && (
          <div
            onDrop={onDrop}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileRef.current?.click()}
            className={`
              flex flex-col items-center justify-center gap-4 p-16 cursor-pointer transition-all
              ${dragOver ? 'bg-purple-500/10' : 'hover:bg-muted/50'}
            `}
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${
              dragOver ? 'bg-purple-500/20' : 'bg-muted'
            }`}>
              <ImagePlus size={28} className={dragOver ? 'text-purple-500' : 'text-muted-foreground'} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                {fa ? 'عکس یا ویدیو انتخاب کنید' : 'Select photos or videos'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {fa ? 'یا بکشید و رها کنید' : 'or drag and drop'}
              </p>
            </div>
            <button className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors flex items-center gap-2">
              <Upload size={14} />
              {fa ? 'انتخاب از دستگاه' : 'Select from device'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={e => handleFiles(Array.from(e.target.files || []))}
            />
          </div>
        )}

        {/* Edit step */}
        {step === 'edit' && (
          <div className="flex flex-col sm:flex-row">

            {/* Preview */}
            <div className="relative sm:w-64 aspect-square bg-black flex-shrink-0">
              {previews[mediaIndex] && (
                files[mediaIndex]?.type.startsWith('video/') ? (
                  <video src={previews[mediaIndex]} className="w-full h-full object-cover" controls />
                ) : (
                  <img src={previews[mediaIndex]} alt="" className="w-full h-full object-cover" />
                )
              )}

              {/* Nav arrows */}
              {previews.length > 1 && (
                <>
                  {mediaIndex > 0 && (
                    <button
                      onClick={() => setMediaIndex(p => p - 1)}
                      className="absolute start-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center"
                    >
                      <ChevronLeft size={16} />
                    </button>
                  )}
                  {mediaIndex < previews.length - 1 && (
                    <button
                      onClick={() => setMediaIndex(p => p + 1)}
                      className="absolute end-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center"
                    >
                      <ChevronRight size={16} />
                    </button>
                  )}
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                    {previews.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setMediaIndex(i)}
                        className={`h-1.5 rounded-full transition-all ${
                          i === mediaIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 p-4 space-y-4">
              <textarea
                {...register('caption')}
                placeholder={fa ? 'کپشن بنویس...' : 'Write a caption...'}
                rows={4}
                className="w-full px-3 py-2 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all resize-none"
              />

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  {fa ? 'دیده شدن توسط' : 'Visibility'}
                </label>
                <select
                  {...register('visibility')}
                  className="w-full h-9 px-3 rounded-xl bg-input border border-border text-foreground text-sm outline-none focus:ring-2 focus:ring-purple-500/40 transition-all"
                >
                  <option value="public"   >{fa ? 'همه'          : 'Everyone'    }</option>
                  <option value="followers">{fa ? 'فالوورها'     : 'Followers'   }</option>
                  <option value="private"  >{fa ? 'فقط خودم'    : 'Only me'     }</option>
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  {...register('comments_disabled')}
                  type="checkbox"
                  className="w-4 h-4 rounded accent-purple-500"
                />
                <span className="text-sm text-foreground">
                  {fa ? 'غیرفعال کردن کامنت‌ها' : 'Disable comments'}
                </span>
              </label>

              <button
                type="button"
                onClick={() => { setStep('upload'); setFiles([]); setPreviews([]) }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {fa ? '← انتخاب مجدد' : '← Reselect'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}