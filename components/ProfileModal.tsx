import React, { useState, useRef } from 'react';
import { Camera, Save } from 'lucide-react';
import { UserProfile } from '../types';
import { Modal } from './ui/Modal';
import { api } from '../api';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onProfileUpdate: (profile: UserProfile) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, profile, onProfileUpdate }) => {
  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatarUrl);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Image trop volumineuse (max 2 Mo)');
      return;
    }

    setError('');
    // Show preview immediately
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);

    try {
      const { avatarUrl } = await api.uploadAvatar(file);
      onProfileUpdate({ ...profile, avatarUrl });
    } catch {
      setError("Erreur lors de l'upload de l'avatar");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await api.updateProfile(displayName);
      onProfileUpdate({ ...profile, displayName: displayName || null });
      onClose();
    } catch {
      setError('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const initial = (profile.displayName || profile.username || '?').charAt(0).toUpperCase();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mon profil">
      <div className="flex flex-col items-center gap-4">
        {/* Avatar */}
        <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border-2 border-border">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-primary">{initial}</span>
            )}
          </div>
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera size={24} className="text-white" />
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        <p className="text-sm text-text-muted">@{profile.username}</p>

        {error && (
          <div className="w-full p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Display Name */}
        <div className="w-full">
          <label className="block text-sm font-medium text-text-muted mb-1">Nom d'affichage</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={profile.username}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-main focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="flex justify-end gap-2 w-full mt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-text-muted hover:text-text-main transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
