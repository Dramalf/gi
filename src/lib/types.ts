export interface Config {
  token: string;
  username: string;
}

export interface Profile {
  display_name: string;
  bio: string;
  avatar: string;
  website: string;
  created_at: string;
}

export interface PostMeta {
  id: string;
  created_at: string;
  type: "post" | "repost" | "reply";
  reply_to: string | null;
  tags: string[];
  media: string[];
  visibility: "public" | "followers" | "private";
}

export interface PostIndex {
  total: number;
  last_updated: string;
  posts: PostIndexEntry[];
}

export interface PostIndexEntry {
  id: string;
  path: string;
  preview: string;
  tags: string[];
  has_media: boolean;
  created_at: string;
}

export interface FeedEntry {
  author: string;
  id: string;
  path: string;
  preview: string;
  tags: string[];
  has_media: boolean;
  created_at: string;
  content?: string;
}
