import React, { useState, useEffect } from 'react';
import { Plus, LayoutGrid, Unlock, Lock, Info, Sun, Moon, List, LayoutTemplate } from 'lucide-react';
import { Category, LinkItem, ViewMode } from './types';
import { CategoryCard } from './components/CategoryCard';
import { Modal } from './components/ui/Modal';
import { generateId } from './utils';

// Default Data
const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'c1',
    title: 'Développement',
    links: [
      { id: 'l1', title: 'GitHub', url: 'https://github.com', createdAt: Date.now() },
      { id: 'l2', title: 'Stack Overflow', url: 'https://stackoverflow.com', createdAt: Date.now() },
    ]
  },
  {
    id: 'c2',
    title: 'Maison',
    links: [
      { id: 'l3', title: 'Home Assistant', url: 'https://www.home-assistant.io', createdAt: Date.now() },
    ]
  }
];

export default function App() {
  // --- Data State ---
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('homelab_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  // --- UI Preferences State ---
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('homelab_theme')) {
      return localStorage.getItem('homelab_theme') as 'light' | 'dark';
    }
    return 'dark'; // Default
  });

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('homelab_view_mode') as ViewMode) || 'list';
  });
  
  // --- Interaction State ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<{ catId: string, link: LinkItem } | null>(null);
  const [newCatName, setNewCatName] = useState('');
  
  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('homelab_categories', JSON.stringify(categories));
  }, [categories]);

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

  // --- Actions ---
  const handleLoginToggle = () => setIsAuthenticated(!isAuthenticated);
  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const toggleViewMode = () => setViewMode(prev => prev === 'list' ? 'grid' : 'list');

  const addCategory = () => {
    if (!newCatName.trim()) return;
    const newCat: Category = {
      id: generateId(),
      title: newCatName,
      links: []
    };
    setCategories([...categories, newCat]);
    setNewCatName('');
    setIsAddCategoryOpen(false);
  };

  const deleteCategory = (id: string) => {
    setCategories(categories.filter(c => c.id !== id));
  };

  const updateCategoryTitle = (id: string, title: string) => {
    setCategories(categories.map(c => c.id === id ? { ...c, title } : c));
  };

  const reorderCategory = (sourceId: string, targetId: string) => {
    const sourceIndex = categories.findIndex(c => c.id === sourceId);
    const targetIndex = categories.findIndex(c => c.id === targetId);

    if (sourceIndex === -1 || targetIndex === -1) return;

    const newCategories = [...categories];
    const [movedCategory] = newCategories.splice(sourceIndex, 1);
    newCategories.splice(targetIndex, 0, movedCategory);
    
    setCategories(newCategories);
  };

  const addLinkToCategory = (catId: string, url: string) => {
    try {
      const urlObj = new URL(url);
      let title = urlObj.hostname.replace('www.', '');
      title = title.charAt(0).toUpperCase() + title.slice(1);
      
      const newLink: LinkItem = {
        id: generateId(),
        title: title,
        url: url,
        createdAt: Date.now()
      };

      setCategories(categories.map(c => {
        if (c.id === catId) {
          return { ...c, links: [...c.links, newLink] };
        }
        return c;
      }));
    } catch (e) {
      alert("URL invalide");
    }
  };

  const deleteLink = (catId: string, linkId: string) => {
    setCategories(categories.map(c => {
      if (c.id === catId) {
        return { ...c, links: c.links.filter(l => l.id !== linkId) };
      }
      return c;
    }));
  };

  const saveLinkEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLink) return;

    const { catId, link } = editingLink;
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

            <button
              onClick={handleLoginToggle}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-md transition-all text-sm font-medium border
                ${isAuthenticated 
                  ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20' 
                  : 'bg-surface text-text-muted border-border hover:text-text-main hover:border-text-muted/50'
                }
              `}
            >
              {isAuthenticated ? <Unlock size={16} /> : <Lock size={16} />}
              <span className="hidden sm:inline">{isAuthenticated ? 'Mode Édition' : 'Lecture Seule'}</span>
            </button>
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

        {/* Grid Layout (Switching from Columns to Grid for reliable DnD) */}
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
              <p className="text-sm mt-2">Activez le mode édition pour commencer.</p>
            )}
          </div>
        )}
      </main>

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
