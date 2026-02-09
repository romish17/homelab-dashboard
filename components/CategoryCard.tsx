import React, { useState } from 'react';
import { Plus, Edit2, Trash2, GripVertical } from 'lucide-react';
import { Category, LinkItem as LinkItemType, ViewMode } from '../types';
import { LinkItem } from './LinkItem';
import { isValidUrl } from '../utils';

interface CategoryCardProps {
  category: Category;
  isEditable: boolean;
  viewMode: ViewMode;
  onAddLink: (categoryId: string, url: string) => void;
  onUpdateCategory: (categoryId: string, title: string) => void;
  onDeleteCategory: (categoryId: string) => void;
  onUpdateLink: (categoryId: string, link: LinkItemType) => void;
  onDeleteLink: (categoryId: string, linkId: string) => void;
  onReorderCategory: (sourceId: string, targetId: string) => void;
  onMoveLink?: (sourceCatId: string, linkId: string, targetCatId: string) => void;
  onReorderLink?: (catId: string, sourceLinkId: string, targetLinkId: string) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  isEditable,
  viewMode,
  onAddLink,
  onUpdateCategory,
  onDeleteCategory,
  onUpdateLink,
  onDeleteLink,
  onReorderCategory,
  onMoveLink,
  onReorderLink
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(category.title);
  const [dragOverLinkId, setDragOverLinkId] = useState<string | null>(null);

  // --- Category Drag Handlers ---
  const handleDragStart = (e: React.DragEvent) => {
    if (!isEditable) return;
    e.dataTransfer.setData('homelab/category-id', category.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  // --- Link Drag Handlers ---
  const handleLinkDragStart = (e: React.DragEvent, linkId: string) => {
    e.stopPropagation();
    e.dataTransfer.setData('homelab/link-id', linkId);
    e.dataTransfer.setData('homelab/source-cat-id', category.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  // --- Drop Zone Handlers ---
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (isEditable) {
      setIsDragOver(true);
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only set false if we're leaving the card itself, not entering a child
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setDragOverLinkId(null);

    if (!isEditable) return;

    // 1. Check for category reorder
    const draggedCategoryId = e.dataTransfer.getData('homelab/category-id');
    if (draggedCategoryId) {
      if (draggedCategoryId !== category.id) {
        onReorderCategory(draggedCategoryId, category.id);
      }
      return;
    }

    // 2. Check for link move between categories
    const draggedLinkId = e.dataTransfer.getData('homelab/link-id');
    const sourceCatId = e.dataTransfer.getData('homelab/source-cat-id');
    if (draggedLinkId && sourceCatId && onMoveLink) {
      if (sourceCatId !== category.id) {
        onMoveLink(sourceCatId, draggedLinkId, category.id);
      }
      return;
    }

    // 3. Check for URL drop
    const droppedText = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text/uri-list');
    if (droppedText && isValidUrl(droppedText)) {
      onAddLink(category.id, droppedText);
    }
  };

  // --- Link drop zone within category (for reordering) ---
  const handleLinkDragOver = (e: React.DragEvent, linkId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const draggedLinkId = e.dataTransfer.types.includes('homelab/link-id') ? true : false;
    if (draggedLinkId) {
      setDragOverLinkId(linkId);
    }
  };

  const handleLinkDrop = (e: React.DragEvent, targetLinkId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverLinkId(null);

    const draggedLinkId = e.dataTransfer.getData('homelab/link-id');
    const sourceCatId = e.dataTransfer.getData('homelab/source-cat-id');

    if (!draggedLinkId) return;

    // If same category, reorder
    if (sourceCatId === category.id && onReorderLink) {
      if (draggedLinkId !== targetLinkId) {
        onReorderLink(category.id, draggedLinkId, targetLinkId);
      }
    } else if (sourceCatId !== category.id && onMoveLink) {
      // Move to this category
      onMoveLink(sourceCatId, draggedLinkId, category.id);
    }
  };

  const saveTitle = () => {
    if (tempTitle.trim()) {
      onUpdateCategory(category.id, tempTitle);
    } else {
      setTempTitle(category.title);
    }
    setIsEditingTitle(false);
  };

  const isIcon = viewMode === 'icon';

  return (
    <div
      draggable={isEditable}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        flex flex-col h-fit mb-6
        rounded-xl border shadow-sm transition-all duration-300
        ${isDragOver
          ? 'bg-blue-500/10 border-primary ring-2 ring-primary/20 scale-[1.02]'
          : 'bg-surface border-border hover:border-border/80'
        }
        ${isEditable ? 'cursor-grab active:cursor-grabbing' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2 border-b border-transparent group">
        {isEditable && (
          <div className="mr-2 text-text-muted cursor-grab active:cursor-grabbing">
            <GripVertical size={16} />
          </div>
        )}

        {isEditingTitle ? (
          <input
            autoFocus
            type="text"
            value={tempTitle}
            onChange={(e) => setTempTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
            className="flex-1 bg-background border border-primary rounded px-2 py-1 text-sm text-text-main focus:outline-none"
            onMouseDown={(e) => e.stopPropagation()}
          />
        ) : (
          <h3 className="font-semibold text-text-main flex-1 truncate pr-2 select-none">
            {category.title}
          </h3>
        )}

        {isEditable && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setIsEditingTitle(true)}
              className="p-1.5 text-text-muted hover:text-text-main hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors"
              title="Renommer la catégorie"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => {
                if (window.confirm('Supprimer cette catégorie et tous ses liens ?')) {
                  onDeleteCategory(category.id);
                }
              }}
              className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
              title="Supprimer la catégorie"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Links List */}
      <div
        className={`
          p-4 pt-2
          ${isIcon
            ? 'grid grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-1'
            : viewMode === 'grid'
              ? 'grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-2'
              : 'flex flex-col gap-2'
          }
        `}
      >
        {category.links.length === 0 ? (
          <div className={`
            flex flex-col items-center justify-center py-8 text-center border-2 border-dashed rounded-lg transition-colors col-span-full
            ${isDragOver ? 'border-primary bg-primary/5' : 'border-border text-text-muted'}
          `}>
            {isEditable ? (
              <>
                <Plus size={24} className="mb-2 opacity-50" />
                <p className="text-xs">Glissez un lien ici</p>
              </>
            ) : (
              <p className="text-xs">Aucun lien</p>
            )}
          </div>
        ) : (
          category.links.map((link) => (
            <div
              key={link.id}
              onDragOver={(e) => handleLinkDragOver(e, link.id)}
              onDrop={(e) => handleLinkDrop(e, link.id)}
              className={`${dragOverLinkId === link.id ? 'ring-2 ring-primary/40 rounded-lg' : ''}`}
            >
              <LinkItem
                link={link}
                isEditable={isEditable}
                viewMode={viewMode}
                onEdit={(l) => onUpdateLink(category.id, l)}
                onDelete={(lid) => onDeleteLink(category.id, lid)}
                draggable={isEditable}
                onDragStart={handleLinkDragStart}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
