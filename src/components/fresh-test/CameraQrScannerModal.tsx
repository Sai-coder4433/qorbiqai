import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, AlertCircle, CheckCircle2, ExternalLink, Link2, RefreshCw } from 'lucide-react';
import jsQR from 'jsqr';

interface CameraQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanResult: (url: string) => void;
}

export const CameraQrScannerModal: React.FC<CameraQrScannerModalProps> = ({
  isOpen,
  onClose,
  onScanResult
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [manualUrl, setManualUrl] = useState('');
  const [detectedUrl, setDetectedUrl] = useState<string | null>(null);
  const [isUnrelated, setIsUnrelated] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setDetectedUrl(null);
      setErrorMessage(null);
      setHasPermission(null);
      setIsUnrelated(false);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setErrorMessage(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser or environment.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });

      streamRef.current = stream;
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play();
        requestAnimationFrame(tick);
      }
    } catch (err: any) {
      console.warn('Camera permission / start error:', err);
      setHasPermission(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Camera permission was denied. Please allow camera access in your browser settings, or use manual URL input below.');
      } else if (err.name === 'NotFoundError') {
        setErrorMessage('No camera device was detected on your system. Please use manual URL input below.');
      } else {
        setErrorMessage(err.message || 'Unable to start camera.');
      }
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const tick = () => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(tick);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert'
    });

    if (code && code.data) {
      handleQrFound(code.data);
      return;
    }

    animationFrameRef.current = requestAnimationFrame(tick);
  };

  const handleQrFound = (url: string) => {
    stopCamera();
    setDetectedUrl(url);

    // Check if it belongs to this application (contains /r/ or /review/c/)
    const isAppQr = url.includes('/r/') || url.includes('/review/c/') || url.startsWith(window.location.origin);

    if (isAppQr) {
      setIsUnrelated(false);
      onScanResult(url);
    } else {
      setIsUnrelated(true);
    }
  };

  const handleConfirmUnrelated = () => {
    if (detectedUrl) {
      onScanResult(detectedUrl);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUrl.trim()) return;
    handleQrFound(manualUrl.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-base text-slate-900">QR Code Scanner</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewport or Permission Notice */}
        {!detectedUrl ? (
          <div className="space-y-4">
            <div className="relative aspect-square w-full max-w-[280px] mx-auto bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border-2 border-slate-200">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                muted
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Scanning Target Finder Box */}
              {hasPermission && (
                <div className="absolute inset-8 border-2 border-blue-500 rounded-lg pointer-events-none animate-pulse">
                  <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-blue-400" />
                  <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-blue-400" />
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-blue-400" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-blue-400" />
                </div>
              )}

              {hasPermission === false && (
                <div className="p-4 text-center text-xs text-slate-300 space-y-2">
                  <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                  <p>Camera access denied or unavailable</p>
                </div>
              )}
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Manual URL Fallback */}
            <div className="border-t border-slate-100 pt-3 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Manual URL Fallback
              </span>
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={manualUrl}
                  onChange={e => setManualUrl(e.target.value)}
                  placeholder="Paste QR URL here (e.g. http://localhost:3000/r/qr_...)"
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                >
                  Decode
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Scanned Result Confirmation */
          <div className="space-y-4 py-2">
            {isUnrelated ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs text-amber-900">
                <div className="font-bold flex items-center gap-1.5 text-amber-800">
                  <AlertCircle className="w-4 h-4" />
                  <span>Unrelated External QR Detected</span>
                </div>
                <p>This QR code points to an external address not managed by ReviewFlow:</p>
                <div className="p-2 bg-white rounded border border-amber-200 font-mono text-[11px] break-all">
                  {detectedUrl}
                </div>
                <p className="text-[11px] text-amber-700">
                  Do you still wish to open this external link?
                </p>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => { setDetectedUrl(null); startCamera(); }}
                    className="flex-1 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                  >
                    Scan Another
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmUnrelated}
                    className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-xs flex items-center justify-center gap-1"
                  >
                    <span>Open URL</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-center text-xs text-emerald-900">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <div className="font-bold text-sm">Review Stand Detected!</div>
                <p className="text-emerald-700 font-mono text-[11px] break-all">{detectedUrl}</p>
                <button
                  type="button"
                  onClick={() => onScanResult(detectedUrl)}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  Continue to Review Flow →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
