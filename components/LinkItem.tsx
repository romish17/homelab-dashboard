import React, { useState } from 'react';
import { ExternalLink, Edit2, Trash2 } from 'lucide-react';
import { LinkItem as LinkItemType, ViewMode } from '../types';
import { getFaviconUrl } from '../utils';

interface LinkItemProps {
  link: LinkItemType;
  isEditable: boolean;
  viewMode: ViewMode;
  onEdit: (link: LinkItemType) => void;
  onDelete: (linkId: string) => void;
}

export const LinkItem: React.FC<LinkItemProps> = ({ link, isEditable, viewMode, onEdit, onDelete }) => {
  
  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit(link);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Voulez-vous vraiment supprimer ce lien ?')) {
      onDelete(link.id);
    }
  };

  const isGrid = viewMode === 'grid';
  const [imgFailed, setImgFailed] = useState(false);

  const initial = link.title.charAt(0).toUpperCase();

  return (
    <div className={`
      group relative flex transition-all duration-200
      ${isGrid
        ? 'flex-col items-center justify-center p-3 rounded-xl bg-transparent hover:bg-black/5 dark:hover:bg-white/5 aspect-square'
        : 'flex-row items-center gap-3 p-3 rounded-lg bg-black/5 dark:bg-black/20 hover:bg-black/10 dark:hover:bg-white/5 border border-transparent hover:border-border'
      }
    `}>
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 z-0 rounded-xl"
        aria-label={`Ouvrir ${link.title}`}
      />

      <div className={`
        relative z-10 flex-shrink-0 rounded-xl bg-surface flex items-center justify-center overflow-hidden border border-border shadow-sm
        ${isGrid ? 'w-14 h-14 mb-2' : 'w-10 h-10'}
      `}>
        {imgFailed ? (
          <span className={`font-bold text-primary ${isGrid ? 'text-xl' : 'text-base'}`}>
            {initial}
          </span>
        ) : (
          <img
            src={link.iconUrl || getFaviconUrl(link.url)}
            alt=""
            className="w-full h-full object-cover"
            onError={() => setImgFailed(true)}
          />
        )}
      </div>

      <div className={`
        relative z-10 flex-grow min-w-0
        ${isGrid ? 'text-center w-full' : ''}
      `}>
        <h4 className={`
          font-medium text-text-main group-hover:text-primary transition-colors truncate
          ${isGrid ? 'text-xs' : 'text-sm'}
        `}>
          {link.title}
        </h4>
        {!isGrid && (
          <p className="text-xs text-text-muted truncate">
            {new URL(link.url).hostname}
          </p>
        )}
      </div>

      {isEditable ? (
        <div className={`
          relative z-20 flex items-center transition-opacity bg-surface/90 rounded-md backdrop-blur-sm border border-border shadow-sm
          ${isGrid 
            ? 'absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 gap-0.5 scale-90' 
            : 'gap-1 opacity-0 group-hover:opacity-100 p-1'
          }
        `}>
          <button 
            onClick={handleEditClick}
            className="p-1.5 text-text-muted hover:text-text-main hover:bg-black/5 dark:hover:bg-white/10 rounded"
            title="Modifier"
          >
            <Edit2 size={isGrid ? 12 : 14} />
          </button>
          <button 
            onClick={handleDeleteClick}
            className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded"
            title="Supprimer"
          >
            <Trash2 size={isGrid ? 12 : 14} />
          </button>
        </div>
      ) : (
        !isGrid && <ExternalLink size={14} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </div>
  );
};
