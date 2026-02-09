export interface LinkItem {
  id: string;
  title: string;
  url: string;
  iconUrl?: string;
  createdAt: number;
}

export interface Category {
  id: string;
  title: string;
  links: LinkItem[];
}

export interface RssFeed {
  id: string;
  title: string;
  url: string;
}

export interface RssEntry {
  title: string;
  link: string;
  published: string;
  summary?: string;
}

export interface Subreddit {
  id: string;
  name: string;
}

export interface RedditPost {
  id: string;
  title: string;
  url: string;
  permalink: string;
  score: number;
  numComments: number;
  author: string;
  createdUtc: number;
  thumbnail: string | null;
  selftext: string | null;
}

export interface UserProfile {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export type ViewMode = 'list' | 'grid' | 'icon';

export type AppSection = 'bookmarks' | 'feeds' | 'subreddits';
