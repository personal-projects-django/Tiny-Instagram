import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Upload, Loader2, ImagePlus } from 'lucide-react'
import { useCreateStory } from '@/hooks/useStories'
import { useUIStore } from '@/store/uiStore'

export default function CreateStoryPage() {
  const navigate    = useNavigate()
  const { language } = useUIStore()
  const fa          = language === 'fa'
  const createStory = useCreateStory()

  const [file, setFile]       = useState<File | null>(null)
  const [preview, setPreview] = useState<string>('')
  const [caption, setCaption] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => {
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handlePublish = async () => {
    if (!file) return
    const fd = new FormData()
    if (file.type.startsWith('video/')) fd.append('video', file)
    else                                fd.append('image', file)
    if (caption) fd.append('caption', caption)

    await createStory.mutateAsync(fd)
    navigate('/')
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="relative w-full h-full sm:max-w-md sm:max-h-[90vh] sm:rounded-2xl overflow-hidden bg-black">

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4">
          <button onClick={() => navigate('/')} className="text-white">
            <X size={24} />
          </button>
          {file && (
            <button
              onClick={handlePublish}
              disabled={createStory.isPending}
              className="px-5 py-1.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {createStory.isPending && <Loader2 size={14} className="animate-spin" />}
              {fa ? 'انتشار' : 'Share'}
            </button>
          )}
        </div>

        {/* Content */}
        {!file ? (
          <div
            onClick={() => fileRef.current?.click()}
            className="w-full h-full flex flex-col items-center justify-center gap-4 cursor-pointer"
          >
            <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center">
              <ImagePlus size={32} className="text-white" />
            </div>
            <p className="text-white text-sm">
              {fa ? 'انتخاب عکس یا ویدیو' : 'Select photo or video'}
            </p>
            <button className="px-5 py-2 rounded-xl bg-white text-black text-sm font-medium flex items-center gap-2">
              <Upload size={14} />
              {fa ? 'انتخاب' : 'Select'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>
        ) : (
          <>
            <div className="w-full h-full flex items-center justify-center">
              {file.type.startsWith('video/')
                ? <video src={preview} controls className="max-w-full max-h-full" />
                : <img src={preview} alt="" className="max-w-full max-h-full object-contain" />
              }
            </div>
            <div className="absolute bottom-4 left-0 right-0 px-4">
              <input
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder={fa ? 'کپشن (اختیاری)...' : 'Caption (optional)...'}
                className="w-full h-11 px-4 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-white/50 text-sm outline-none focus:border-white/40 backdrop-blur"
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}