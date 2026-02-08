import React, { useState, useEffect } from 'react';
import { Plus, LayoutGrid, LogIn, LogOut, Info, Sun, Moon, List, LayoutTemplate, UserPlus } from 'lucide-react';
import { Category, LinkItem, ViewMode } from './types';
import { CategoryCard } from './components/CategoryCard';
import { Modal } from './components/ui/Modal';
import { generateId } from './utils';
import { api } from './api';

export default function App() {
  // --- Auth State ---
  const [isAuthenticated, setIsAuthenticated] = useState(!!api.getToken());
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // --- Data State ---
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // --- UI Preferences State ---
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('homelab_theme')) {
      return localStorage.getItem('homelab_theme') as 'light' | 'dark';
    }
    return 'dark';
  });

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('homelab_view_mode') as ViewMode) || 'list';
  });

  // --- Interaction State ---
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<{ catId: string, link: LinkItem } | null>(null);
  const [newCatName, setNewCatName] = useState('');

  // --- Effects ---
  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      setCategories([]);
      return;
    }
    setLoading(true);
    api.getCategories()
      .then((data) => setCategories(data as Category[]))
      .catch(() => {
        api.clearToken();
        setIsAuthenticated(false);
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('homelab_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('homelab_view_mode', viewMode);
  }, [viewMode]);

  // --- Auth Actions ---
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const action = isRegisterMode ? api.register : api.login;
      const { token } = await action(loginUsername, loginPassword);
      api.setToken(token);
      setIsAuthenticated(true);
      setShowLoginModal(false);
      setLoginUsername('');
      setLoginPassword('');
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Erreur de connexion');
    }
  };

  const handleLogout = () => {
    api.clearToken();
    setIsAuthenticated(false);
    setCategories([]);
  };

  // --- Actions ---
  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const toggleViewMode = () => setViewMode(prev => prev === 'list' ? 'grid' : 'list');

  const addCategory = async () => {
    if (!newCatName.trim()) return;
    const id = generateId();
    try {
      await api.createCategory(id, newCatName);
      setCategories([...categories, { id, title: newCatName, links: [] }]);
      setNewCatName('');
      setIsAddCategoryOpen(false);
    } catch (err) {
      console.error('Erreur ajout catégorie:', err);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await api.deleteCategory(id);
      setCategories(categories.filter(c => c.id !== id));
    } catch (err) {
      console.error('Erreur suppression catégorie:', err);
    }
  };

  const updateCategoryTitle = async (id: string, title: string) => {
    try {
      await api.updateCategory(id, title);
      setCategories(categories.map(c => c.id === id ? { ...c, title } : c));
    } catch (err) {
      console.error('Erreur mise à jour catégorie:', err);
    }
  };

  const reorderCategory = async (sourceId: string, targetId: string) => {
    const sourceIndex = categories.findIndex(c => c.id === sourceId);
    const targetIndex = categories.findIndex(c => c.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const newCategories = [...categories];
    const [movedCategory] = newCategories.splice(sourceIndex, 1);
    newCategories.splice(targetIndex, 0, movedCategory);
    setCategories(newCategories);

    try {
      await api.reorderCategories(newCategories.map(c => c.id));
    } catch (err) {
      console.error('Erreur réordonnancement:', err);
      setCategories(categories);
    }
  };

  const addLinkToCategory = async (catId: string, url: string) => {
    try {
      const urlObj = new URL(url);
      let title = urlObj.hostname.replace('www.', '');
      title = title.charAt(0).toUpperCase() + title.slice(1);

      const newLink: LinkItem = {
        id: generateId(),
        title,
        url,
        createdAt: Date.now()
      };

      await api.addLink(catId, newLink);
      setCategories(categories.map(c => {
        if (c.id === catId) {
          return { ...c, links: [...c.links, newLink] };
        }
        return c;
      }));
    } catch {
      alert("URL invalide");
    }
  };

  const deleteLink = async (catId: string, linkId: string) => {
    try {
      await api.deleteLink(linkId);
      setCategories(categories.map(c => {
        if (c.id === catId) {
          return { ...c, links: c.links.filter(l => l.id !== linkId) };
        }
        return c;
      }));
    } catch (err) {
      console.error('Erreur suppression lien:', err);
    }
  };

  const saveLinkEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLink) return;

    const { catId, link } = editingLink;
    try {
      await api.updateLink(link.id, { title: link.title, url: link.url, iconUrl: link.iconUrl });
      setCategories(categories.map(c => {
        if (c.id === catId) {
          return {
            ...c,
            links: c.links.map(l => l.id === link.id ? link : l)
          };
        }
        return c;
      }));
      setEditingLink(null);
    } catch (err) {
      console.error('Erreur mise à jour lien:', err);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text-main font-sans selection:bg-primary/30 transition-colors duration-300">

      {/* Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-background/80 border-b border-border transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <LayoutGrid className="text-primary" size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight hidden sm:block">
              My HomeLab
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {isAuthenticated && (
               <button
                onClick={() => setIsAddCategoryOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary hover:bg-blue-600 text-white rounded-md transition-colors text-sm font-medium shadow-lg shadow-blue-500/20"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Nouvelle catégorie</span>
              </button>
            )}

            {/* View Mode Toggle */}
             <button
              onClick={toggleViewMode}
              className="p-2 text-text-muted hover:text-text-main hover:bg-surface rounded-md transition-colors"
              title={viewMode === 'list' ? "Passer en vue Grille" : "Passer en vue Liste"}
            >
              {viewMode === 'list' ? <LayoutTemplate size={20} /> : <List size={20} />}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-text-muted hover:text-text-main hover:bg-surface rounded-md transition-colors"
              title={theme === 'dark' ? "Passer en mode Clair" : "Passer en mode Sombre"}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Divider */}
            <div className="h-6 w-px bg-border mx-1"></div>

            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md transition-all text-sm font-medium border bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            ) : (
              <button
                onClick={() => { setShowLoginModal(true); setIsRegisterMode(false); setAuthError(''); }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md transition-all text-sm font-medium border bg-surface text-text-muted border-border hover:text-text-main hover:border-text-muted/50"
              >
                <LogIn size={16} />
                <span className="hidden sm:inline">Connexion</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">

        {/* Info Banner if logged in */}
        {isAuthenticated && (
          <div className="mb-8 p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-start gap-3 text-primary text-sm animate-in fade-in slide-in-from-top-2">
            <Info className="shrink-0 mt-0.5" size={16} />
            <p>
              Vous êtes en mode édition. Glissez des liens (URL) dans les catégories.
              <br/>
              Vous pouvez aussi <strong>déplacer les catégories</strong> en les glissant-déposant.
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-text-muted">
            <p className="text-lg">Chargement...</p>
          </div>
        ) : (
          <>
            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((cat) => (
                <CategoryCard
                  key={cat.id}
                  category={cat}
                  isEditable={isAuthenticated}
                  viewMode={viewMode}
                  onAddLink={addLinkToCategory}
                  onUpdateCategory={updateCategoryTitle}
                  onDeleteCategory={deleteCategory}
                  onUpdateLink={(catId, link) => setEditingLink({ catId, link })}
                  onDeleteLink={deleteLink}
                  onReorderCategory={reorderCategory}
                />
              ))}
            </div>

            {categories.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-text-muted">
                <LayoutGrid size={48} className="mb-4 opacity-20" />
                <p className="text-lg">Votre tableau de bord est vide.</p>
                {isAuthenticated ? (
                   <button
                    onClick={() => setIsAddCategoryOpen(true)}
                    className="mt-4 text-primary hover:underline"
                  >
                    Créer une première catégorie
                  </button>
                ) : (
                  <p className="text-sm mt-2">Connectez-vous pour commencer.</p>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Login / Register Modal */}
      <Modal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title={isRegisterMode ? 'Créer un compte' : 'Connexion'}
      >
        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          {authError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {authError}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Nom d'utilisateur</label>
            <input
              type="text"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              placeholder="admin"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-main focus:outline-none focus:border-primary transition-colors"
              autoFocus
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Mot de passe</label>
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-main focus:outline-none focus:border-primary transition-colors"
              required
            />
          </div>
          <div className="flex flex-col gap-2 mt-2">
            <button
              type="submit"
              className="w-full px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              {isRegisterMode ? <UserPlus size={16} /> : <LogIn size={16} />}
              {isRegisterMode ? 'Créer le compte' : 'Se connecter'}
            </button>
            <button
              type="button"
              onClick={() => { setIsRegisterMode(!isRegisterMode); setAuthError(''); }}
              className="text-sm text-text-muted hover:text-primary transition-colors"
            >
              {isRegisterMode ? 'Déjà un compte ? Se connecter' : 'Pas encore de compte ? S\'inscrire'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Category Modal */}
      <Modal
        isOpen={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        title="Ajouter une catégorie"
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Nom de la catégorie</label>
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="ex: Services, News, Dev..."
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-main focus:outline-none focus:border-primary transition-colors"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && addCategory()}
            />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => setIsAddCategoryOpen(false)}
              className="px-4 py-2 text-sm text-text-muted hover:text-text-main transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={addCategory}
              className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
            >
              Créer
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Link Modal */}
      <Modal
        isOpen={!!editingLink}
        onClose={() => setEditingLink(null)}
        title="Modifier le lien"
      >
        {editingLink && (
          <form onSubmit={saveLinkEdits} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Titre</label>
              <input
                type="text"
                value={editingLink.link.title}
                onChange={(e) => setEditingLink({
                  ...editingLink,
                  link: { ...editingLink.link, title: e.target.value }
                })}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-main focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">URL de destination</label>
              <input
                type="url"
                value={editingLink.link.url}
                onChange={(e) => setEditingLink({
                  ...editingLink,
                  link: { ...editingLink.link, url: e.target.value }
                })}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-main focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">URL de l'icône (optionnel)</label>
              <div className="flex gap-2">
                 <input
                  type="text"
                  value={editingLink.link.iconUrl || ''}
                  placeholder="Laissez vide pour le favicon par défaut"
                  onChange={(e) => setEditingLink({
                    ...editingLink,
                    link: { ...editingLink.link, iconUrl: e.target.value }
                  })}
                  className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-text-main focus:outline-none focus:border-primary transition-colors text-sm"
                />
              </div>
              <p className="text-xs text-text-muted mt-1">Laissez vide pour utiliser le favicon automatique.</p>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setEditingLink(null)}
                className="px-4 py-2 text-sm text-text-muted hover:text-text-main transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
              >
                Sauvegarder
              </button>
            </div>
          </form>
        )}
      </Modal>

    </div>
  );
}
