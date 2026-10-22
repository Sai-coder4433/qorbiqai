import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { QrCode, AlertCircle, Loader2 } from 'lucide-react';
import { fetchApi } from '../lib/api.ts';

export const CustomerScanRedirectPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const [status, setStatus] = useState<'redirecting' | 'paused' | 'not_found' | 'error'>('redirecting');
  const [businessName, setBusinessName] = useState('Our Business');
  const [destinationUrl, setDestinationUrl] = useState('');

  useEffect(() => {
    if (!code) {
      setStatus('not_found');
      return;
    }

    // Call server to record scan and get official Google destination
    const executeRedirect = async () => {
      try {
        // Query QR details
        const res = await fetchApi<any>(`/qr-codes?businessId=biz_001`);
        const found = res?.qrCodes?.find((q: any) => q.code.toLowerCase() === code.toLowerCase().trim());

        if (!found) {
          setStatus('not_found');
          return;
        }

        if (found.status === 'PAUSED') {
          setStatus('paused');
          setBusinessName(found.name.split(' ')[0] || 'This Business');
          return;
        }

        if (found.destinationUrl) {
          setDestinationUrl(found.destinationUrl);
          // Immediate window replacement to Google Reviews
          window.location.replace(found.destinationUrl);
        } else {
          setStatus('error');
        }
      } catch (e) {
        console.error('Scan resolution failed:', e);
        // Fallback: direct to standard Google write review
        window.location.replace('https://search.google.com/local/writereview?placeid=ChIJ_AtharvPlaceId');
      }
    };

    executeRedirect();
  }, [code]);

  if (status === 'paused') {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex items-center justify-center p-4 font-sans">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-8 text-center shadow-lg space-y-4">
          <div className="inline-block px-3 py-1 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-full text-xs font-semibold">
            Temporarily Paused
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            QR Code Unavailable
          </h1>
          <p className="text-xs text-zinc-500 leading-relaxed">
            The business owner has temporarily paused this review QR code. Please check back later or ask our staff for assistance.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'not_found') {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex items-center justify-center p-4 font-sans">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-8 text-center shadow-lg space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            QR Code Not Found
          </h1>
          <p className="text-xs text-zinc-500 leading-relaxed">
            This review QR code link does not exist or has been removed. Please confirm with the business.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col items-center justify-center p-6 font-sans">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md animate-pulse">
          <QrCode className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            Opening Google Reviews...
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Directly redirecting your phone to the official review page
          </p>
        </div>
        {destinationUrl && (
          <div className="pt-2">
            <a
              href={destinationUrl}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Click here if you are not automatically redirected →
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
