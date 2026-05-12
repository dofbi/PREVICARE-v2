import { useState, useRef } from 'react';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  userId: string;
}

export default function AvatarUpload({ currentAvatarUrl, userId }: AvatarUploadProps) {
  const avatarDisplayUrl = currentAvatarUrl 
    ? `/api/get-avatar?path=${encodeURIComponent(currentAvatarUrl)}` 
    : null;
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarDisplayUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setMessage({ text: 'Type de fichier non autorisé. Utilisez JPG, PNG ou WEBP', type: 'error' });
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setMessage({ text: 'Le fichier est trop volumineux. Maximum 5MB', type: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    await uploadAvatar(file);
  };

  const uploadAvatar = async (file: File) => {
    setIsUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/upload-avatar', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ text: 'Photo de profil mise à jour avec succès', type: 'success' });
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setMessage({ text: result.message || 'Erreur lors de l\'upload', type: 'error' });
        setPreviewUrl(currentAvatarUrl || null);
      }
    } catch (error) {
      console.error('Erreur upload:', error);
      setMessage({ text: 'Une erreur inattendue s\'est produite', type: 'error' });
      setPreviewUrl(currentAvatarUrl || null);
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Photo de profil
      </label>
      <div className="flex items-center space-x-6">
        <div className="relative">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Avatar"
              className="h-24 w-24 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
              <svg
                className="h-12 w-12 text-gray-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          )}
          {isUploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}
        </div>

        <div className="flex-1">
          <button
            type="button"
            onClick={triggerFileInput}
            disabled={isUploading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Upload en cours...' : 'Changer la photo'}
          </button>
          <p className="mt-2 text-xs text-gray-500">
            JPG, PNG ou WEBP. Maximum 5MB.
          </p>

          {message && (
            <div
              className={`mt-3 p-3 rounded-md text-sm ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />
      </div>
    </div>
  );
}
