import React, { useState, useEffect } from 'react';
import { Plus, Rss, Trash2, ExternalLink, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { RssFeed, RssEntry } from '../types';
import { api } from '../api';
import { generateId } from '../utils';

export const RssFeedPanel: React.FC = () => {
  const [feeds, setFeeds] = useState<RssFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [expandedFeed, setExpandedFeed] = useState<string | null>(null);
  const [entries, setEntries] = useState<Record<string, RssEntry[]>>({});
  const [loadingEntries, setLoadingEntries] = useState<string | null>(null);

  useEffect(() => {
    api.getFeeds()
      .then(setFeeds)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const addFeed = async () => {
    if (!newTitle.trim() || !newUrl.trim()) return;
    const id = generateId();
    try {
      await api.createFeed(id, newTitle, newUrl);
      setFeeds([...feeds, { id, title: newTitle, url: newUrl }]);
      setNewTitle('');
      setNewUrl('');
      setShowAddForm(false);
    } catch (err) {
      console.error('Erreur ajout flux:', err);
    }
  };

  const deleteFeed = async (id: string) => {
    if (!window.confirm('Supprimer ce flux RSS ?')) return;
    try {
      await api.deleteFeed(id);
      setFeeds(feeds.filter(f => f.id !== id));
      if (expandedFeed === id) setExpandedFeed(null);
    } catch (err) {
      console.error('Erreur suppression flux:', err);
    }
  };

  const toggleFeed = async (id: string) => {
    if (expandedFeed === id) {
      setExpandedFeed(null);
      return;
    }
    setExpandedFeed(id);
    if (!entries[id]) {
      setLoadingEntries(id);
      try {
        const data = await api.getFeedEntries(id);
        setEntries(prev => ({ ...prev, [id]: data }));
      } catch (err) {
        console.error('Erreur chargement entries:', err);
      } finally {
        setLoadingEntries(null);
      }
    }
  };

  const refreshFeed = async (id: string) => {
    setLoadingEntries(id);
    try {
      const data = await api.getFeedEntries(id);
      setEntries(prev => ({ ...prev, [id]: data }));
    } catch (err) {
      console.error('Erreur refresh:', err);
    } finally {
      setLoadingEntries(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch { return dateStr; }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-text-muted">
        <p>Chargement des flux RSS...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Feed Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-text-main flex items-center gap-2">
          <Rss size={20} className="text-orange-400" />
          Flux RSS
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-3 py-1.5 bg-primary hover:bg-blue-600 text-white rounded-md transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          Ajouter un flux
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Titre du flux (ex: CVE Recent)"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-main text-sm focus:outline-none focus:border-primary transition-colors"
            autoFocus
          />
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="URL du flux RSS"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-main text-sm focus:outline-none focus:border-primary transition-colors"
            onKeyDown={(e) => e.key === 'Enter' && addFeed()}
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAddForm(false)} className="px-3 py-1.5 text-sm text-text-muted hover:text-text-main transition-colors">
              Annuler
            </button>
            <button onClick={addFeed} className="px-3 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-blue-600 transition-colors">
              Ajouter
            </button>
          </div>
        </div>
      )}

      {/* Feed List */}
      {feeds.length === 0 && !showAddForm ? (
        <div className="flex flex-col items-center justify-center py-16 text-text-muted">
          <Rss size={48} className="mb-4 opacity-20" />
          <p>Aucun flux RSS configuré.</p>
          <button onClick={() => setShowAddForm(true)} className="mt-2 text-primary hover:underline text-sm">
            Ajouter votre premier flux
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {feeds.map(feed => (
            <div key={feed.id} className="bg-surface border border-border rounded-xl overflow-hidden">
              {/* Feed Header */}
              <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                   onClick={() => toggleFeed(feed.id)}>
                <div className="text-orange-400">
                  {expandedFeed === feed.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-text-main truncate">{feed.title}</h3>
                  <p className="text-xs text-text-muted truncate">{feed.url}</p>
                </div>
                <div className="flex items-center gap-1">
                  {expandedFeed === feed.id && (
                    <button
                      onClick={(e) => { e.stopPropagation(); refreshFeed(feed.id); }}
                      className="p-1.5 text-text-muted hover:text-primary rounded transition-colors"
                      title="Rafraîchir"
                    >
                      <RefreshCw size={14} className={loadingEntries === feed.id ? 'animate-spin' : ''} />
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteFeed(feed.id); }}
                    className="p-1.5 text-text-muted hover:text-red-500 rounded transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Feed Entries */}
              {expandedFeed === feed.id && (
                <div className="border-t border-border">
                  {loadingEntries === feed.id ? (
                    <div className="p-4 text-center text-text-muted text-sm">Chargement...</div>
                  ) : entries[feed.id]?.length ? (
                    <div className="max-h-96 overflow-y-auto no-scrollbar">
                      {entries[feed.id].map((entry, i) => (
                        <a
                          key={i}
                          href={entry.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-3 p-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-b border-border last:border-b-0"
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-text-main line-clamp-2">{entry.title}</h4>
                            {entry.summary && (
                              <p className="text-xs text-text-muted mt-1 line-clamp-2">{entry.summary}</p>
                            )}
                            <p className="text-xs text-text-muted mt-1">{formatDate(entry.published)}</p>
                          </div>
                          <ExternalLink size={14} className="text-text-muted mt-1 flex-shrink-0" />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-text-muted text-sm">Aucun article trouvé.</div>
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
