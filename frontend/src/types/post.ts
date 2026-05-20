// src/types/post.ts
export interface User {
  id      : number
  username: string
  avatar  : string
}

export interface PostMedia {
  id        : number
  media_type: 'image' | 'video'
  file      : string
  thumbnail : string | null
  order     : number
  width     : number
  height    : number
  duration  : number | null
}

export interface Comment {
  id        : number
  user      : User
  text      : string
  parent    : number | null
  replies   : Comment[]
  created_at: string
}

export interface Post {
  id               : number
  user             : User
  caption          : string
  visibility       : 'public' | 'followers' | 'private'
  medias           : PostMedia[]
  likes_count      : number
  comments_count   : number
  is_liked         : boolean
  is_saved         : boolean
  comments_disabled: boolean
  created_at       : string
}

// src/types/story.ts
export interface Story {
  id         : number
  user       : User
  image      : string | null
  video      : string | null
  caption    : string
  views_count: number
  likes_count: number
  is_viewed  : boolean
  is_liked   : boolean
  is_active  : boolean
  expires_at : string
  created_at : string
}

export interface StoryGroup {
  user      : User
  stories   : Story[]
  has_unseen: boolean
}

// src/types/chat.ts
export interface Room {
  id          : number
  type        : 'private' | 'group' | 'channel'
  name        : string
  avatar      : string | null
  last_message: { text: string; sender: string; time: string } | null
  unread_count: number
}

export interface Message {
  id               : number
  room             : number
  sender           : User
  type             : string
  text             : string
  file             : string | null
  reply_to         : { id: number; sender: string; text: string } | null
  reactions        : { id: number; user: User; emoji: string }[]
  is_edited        : boolean
  is_deleted_for_all: boolean
  pinned           : boolean
  created_at       : string
}