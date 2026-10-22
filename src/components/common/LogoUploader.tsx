import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, CheckCircle2, AlertCircle, RefreshCw, Link as LinkIcon } from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage, isFirebaseConfigured } from '../../lib/firebase.ts';

interface LogoUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  businessId?: string;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export const LogoUploader: React.FC<LogoUploaderProps> = ({
  value = '',
  onChange,
  businessId = 'business',
  label = 'Business Logo / Storefront Photo',
  description = 'Upload from your device gallery. Recommended: square PNG, JPG, or WEBP under 5MB.',
  disabled = false
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [directUrl, setDirectUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to compress image to base64 as resilient fallback
  const compressImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 800;
          let width = img.width;
          let height = img.height;

          if (width > height && width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.88));
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFile = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please choose a valid image file (PNG, JPG, WEBP, or SVG).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size exceeds 5MB limit. Please choose a smaller file.');
      return;
    }

    setError(null);
    setSuccessNotice(null);
    setUploading(true);
    setProgress(15);

    try {
      // 1. Prepare base64 preview & fallback
      const base64Data = await compressImageToBase64(file);

      // 2. Attempt upload to Firebase Storage if configured
      if (storage && isFirebaseConfigured) {
        const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const ext = cleanName.split('.').pop() || 'png';
        const storagePath = `logos/${businessId}_${Date.now()}.${ext}`;
        const storageRef = ref(storage, storagePath);

        const uploadTask = uploadBytesResumable(storageRef, file, {
          contentType: file.type,
          customMetadata: {
            businessId,
            uploadedAt: new Date().toISOString()
          }
        });

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setProgress(Math.max(15, pct));
          },
          (storageErr) => {
            console.warn('[LogoUploader] Firebase Storage upload notice:', storageErr.message);
            // Graceful fallback to compressed base64 so onboarding is never interrupted
            onChange(base64Data);
            setUploading(false);
            setProgress(100);
            setSuccessNotice('Logo saved successfully! (Stored in local profile)');
          },
          async () => {
            try {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              onChange(downloadUrl);
              setUploading(false);
              setProgress(100);
              setSuccessNotice('Logo uploaded to Cloud Storage successfully!');
            } catch {
              onChange(base64Data);
              setUploading(false);
              setSuccessNotice('Logo saved successfully!');
            }
          }
        );
      } else {
        // Fallback when Firebase Storage not configured
        onChange(base64Data);
        setUploading(false);
        setProgress(100);
        setSuccessNotice('Logo saved to business profile!');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process image. Please try again.');
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || uploading) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSuccessNotice(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const applyDirectUrl = () => {
    if (!directUrl.trim()) return;
    onChange(directUrl.trim());
    setShowUrlInput(false);
    setDirectUrl('');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
        >
          <LinkIcon className="w-3 h-3" />
          <span>{showUrlInput ? 'Hide URL link' : 'Paste web URL'}</span>
        </button>
      </div>

      {description && (
        <p className="text-[11px] text-slate-500 leading-relaxed">
          {description}
        </p>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/*"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
        className="hidden"
        disabled={disabled || uploading}
      />

      {/* Direct URL input accordion */}
      {showUrlInput && (
        <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
          <input
            type="url"
            value={directUrl}
            onChange={(e) => setDirectUrl(e.target.value)}
            placeholder="https://example.com/logo.png"
            className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={applyDirectUrl}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
          >
            Apply
          </button>
        </div>
      )}

      {/* Active Logo Display */}
      {value ? (
        <div className="flex items-center gap-4 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
          <div className="relative w-16 h-16 rounded-xl bg-white border border-slate-200 overflow-hidden shadow-xs shrink-0 flex items-center justify-center">
            <img
              src={value}
              alt="Business Logo"
              className="w-full h-full object-contain p-1"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=Logo';
              }}
            />
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 truncate">Logo Ready</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              Will appear on QR stand prints and customer review screens
            </p>
            <div className="flex items-center gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || uploading}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                Change Photo
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled || uploading}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty Upload Dropzone */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => {
            if (!disabled && !uploading) {
              fileInputRef.current?.click();
            }
          }}
          className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
            isDragOver
              ? 'border-blue-500 bg-blue-50/60'
              : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {uploading ? (
            <div className="space-y-3 py-2">
              <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-800">
                Uploading to Cloud Storage ({progress}%)...
              </p>
              <div className="w-48 max-w-full bg-slate-200 rounded-full h-1.5 mx-auto overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-xs border border-blue-100">
                <Upload className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  <span className="text-blue-600 hover:underline">Choose from gallery</span> or drag and drop
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  PNG, JPG, WEBP or SVG up to 5MB
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notifications */}
      {error && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {successNotice && (
        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="font-medium">{successNotice}</span>
        </div>
      )}
    </div>
  );
};
