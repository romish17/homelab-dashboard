import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ExternalLink, ChevronDown, ChevronRight, RefreshCw, MessageSquare, ArrowBigUp } from 'lucide-react';
import { Subreddit, RedditPost } from '../types';
import { api } from '../api';
import { generateId } from '../utils';

export const SubredditPanel: React.FC = () => {
  const [subreddits, setSubreddits] = useState<Subreddit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [expandedSub, setExpandedSub] = useState<string | null>(null);
  const [posts, setPosts] = useState<Record<string, RedditPost[]>>({});
  const [loadingPosts, setLoadingPosts] = useState<string | null>(null);

  useEffect(() => {
    api.getSubreddits()
      .then(setSubreddits)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const addSubreddit = async () => {
    if (!newName.trim()) return;
    const id = generateId();
    const cleanName = newName.replace(/^r\//, '').trim();
    try {
      await api.followSubreddit(id, cleanName);
      setSubreddits([...subreddits, { id, name: cleanName }]);
      setNewName('');
      setShowAddForm(false);
    } catch (err) {
      console.error('Erreur ajout subreddit:', err);
    }
  };

  const deleteSubreddit = async (id: string) => {
    if (!window.confirm('Ne plus suivre ce subreddit ?')) return;
    try {
      await api.unfollowSubreddit(id);
      setSubreddits(subreddits.filter(s => s.id !== id));
      if (expandedSub === id) setExpandedSub(null);
    } catch (err) {
      console.error('Erreur suppression subreddit:', err);
    }
  };

  const toggleSub = async (id: string) => {
    if (expandedSub === id) {
      setExpandedSub(null);
      return;
    }
    setExpandedSub(id);
    if (!posts[id]) {
      setLoadingPosts(id);
      try {
        const data = await api.getSubredditPosts(id);
        setPosts(prev => ({ ...prev, [id]: data }));
      } catch (err) {
        console.error('Erreur chargement posts:', err);
      } finally {
        setLoadingPosts(null);
      }
    }
  };

  const refreshPosts = async (id: string) => {
    setLoadingPosts(id);
    try {
      const data = await api.getSubredditPosts(id);
      setPosts(prev => ({ ...prev, [id]: data }));
    } catch (err) {
      console.error('Erreur refresh:', err);
    } finally {
      setLoadingPosts(null);
    }
  };

  const formatScore = (score: number) => {
    if (score >= 1000) return `${(score / 1000).toFixed(1)}k`;
    return score.toString();
  };

  const timeAgo = (utc: number) => {
    const diff = Math.floor(Date.now() / 1000 - utc);
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}j`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-text-muted">
        <p>Chargement des subreddits...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-text-main flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-orange-500 fill-current">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm6.066 13.71c.149.198.237.44.237.713 0 1.867-2.153 3.382-4.813 3.382-2.66 0-4.813-1.515-4.813-3.382 0-.274.089-.517.238-.714a1.094 1.094 0 01-.147-.537c0-.604.49-1.094 1.094-1.094.297 0 .567.12.764.312.752-.528 1.776-.867 2.908-.907l.495-2.333 1.613.34c.073-.428.447-.752.896-.752.5 0 .907.406.907.906s-.406.907-.907.907a.908.908 0 01-.884-.696l-1.43-.3-.439 2.066c1.112.049 2.117.386 2.858.907.197-.193.468-.312.764-.312.604 0 1.094.49 1.094 1.094 0 .196-.052.38-.147.537zm-7.066.289a.907.907 0 100 1.814.907.907 0 000-1.814zm4 0a.907.907 0 100 1.814.907.907 0 000-1.814zm-3.567 2.756c-.165 0-.298-.134-.298-.298 0-.165.133-.298.298-.298.85.522 1.785.522 2.634 0 .165 0 .298.133.298.298 0 .164-.133.298-.298.298-.936.584-1.698.584-2.634 0z"/>
          </svg>
          Subreddits
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-3 py-1.5 bg-primary hover:bg-blue-600 text-white rounded-md transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          Suivre un subreddit
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nom du subreddit (ex: netsec, MachineLearning)"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-main text-sm focus:outline-none focus:border-primary transition-colors"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && addSubreddit()}
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAddForm(false)} className="px-3 py-1.5 text-sm text-text-muted hover:text-text-main transition-colors">
              Annuler
            </button>
            <button onClick={addSubreddit} className="px-3 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-blue-600 transition-colors">
              Suivre
            </button>
          </div>
        </div>
      )}

      {/* Subreddit List */}
      {subreddits.length === 0 && !showAddForm ? (
        <div className="flex flex-col items-center justify-center py-16 text-text-muted">
          <MessageSquare size={48} className="mb-4 opacity-20" />
          <p>Aucun subreddit suivi.</p>
          <button onClick={() => setShowAddForm(true)} className="mt-2 text-primary hover:underline text-sm">
            Suivre votre premier subreddit
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {subreddits.map(sub => (
            <div key={sub.id} className="bg-surface border border-border rounded-xl overflow-hidden">
              {/* Sub Header */}
              <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                   onClick={() => toggleSub(sub.id)}>
                <div className="text-orange-500">
                  {expandedSub === sub.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-text-main">r/{sub.name}</h3>
                </div>
                <div className="flex items-center gap-1">
                  {expandedSub === sub.id && (
                    <button
                      onClick={(e) => { e.stopPropagation(); refreshPosts(sub.id); }}
                      className="p-1.5 text-text-muted hover:text-primary rounded transition-colors"
                      title="Rafraîchir"
                    >
                      <RefreshCw size={14} className={loadingPosts === sub.id ? 'animate-spin' : ''} />
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteSubreddit(sub.id); }}
                    className="p-1.5 text-text-muted hover:text-red-500 rounded transition-colors"
                    title="Ne plus suivre"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Posts */}
              {expandedSub === sub.id && (
                <div className="border-t border-border">
                  {loadingPosts === sub.id ? (
                    <div className="p-4 text-center text-text-muted text-sm">Chargement...</div>
                  ) : posts[sub.id]?.length ? (
                    <div className="max-h-[500px] overflow-y-auto no-scrollbar">
                      {posts[sub.id].map((post) => (
                        <a
                          key={post.id}
                          href={post.permalink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-3 p-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-b border-border last:border-b-0"
                        >
                          {/* Score */}
                          <div className="flex flex-col items-center text-text-muted flex-shrink-0 min-w-[40px]">
                            <ArrowBigUp size={16} className="text-orange-500" />
                            <span className="text-xs font-medium">{formatScore(post.score)}</span>
                          </div>

                          {/* Thumbnail */}
                          {post.thumbnail && (
                            <div className="w-16 h-12 rounded overflow-hidden flex-shrink-0 bg-black/10">
                              <img src={post.thumbnail} alt="" className="w-full h-full object-cover" />
                            </div>
                          )}

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-text-main line-clamp-2">{post.title}</h4>
                            <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                              <span>u/{post.author}</span>
                              <span className="flex items-center gap-1">
                                <MessageSquare size={10} />
                                {post.numComments}
                              </span>
                              <span>{timeAgo(post.createdUtc)}</span>
                            </div>
                          </div>

                          <ExternalLink size={14} className="text-text-muted mt-1 flex-shrink-0" />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-text-muted text-sm">Aucun post trouvé.</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
