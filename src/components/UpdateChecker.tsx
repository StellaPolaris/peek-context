import { useEffect, useMemo, useState } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { ArrowDownToLine, Loader2, X } from 'lucide-react';

type UpdateInfo = {
  available?: boolean;
  version?: string;
  body?: string;
  downloadAndInstall?: (onEvent?: (event: { event?: string; data?: Record<string, unknown> }) => void) => Promise<void>;
};

type UpdateStatus = 'idle' | 'available' | 'downloading' | 'restarting' | 'error';

export function UpdateChecker() {
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [downloadedBytes, setDownloadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkForUpdate = async () => {
      try {
        const result = await check();
        if (!isMounted) return;
        const updateInfo = result as UpdateInfo | null;
        if (updateInfo?.available) {
          setUpdate(updateInfo);
          setStatus('available');
        }
      } catch (error) {
        console.error('Update check failed:', error);
        if (isMounted) {
          setStatus('error');
        }
      }
    };

    checkForUpdate();
    return () => {
      isMounted = false;
    };
  }, []);

  const progressPercent = useMemo(() => {
    if (!totalBytes || totalBytes <= 0) return null;
    return Math.min(100, Math.round((downloadedBytes / totalBytes) * 100));
  }, [downloadedBytes, totalBytes]);

  const handleInstall = async () => {
    if (!update?.downloadAndInstall) {
      setStatus('error');
      return;
    }

    setStatus('downloading');
    setDownloadedBytes(0);
    setTotalBytes(null);

    try {
      await update.downloadAndInstall((event) => {
        const eventName = event?.event;
        if (eventName === 'Started') {
          const length = event?.data?.contentLength;
          setTotalBytes(typeof length === 'number' ? length : null);
          setDownloadedBytes(0);
        }
        if (eventName === 'Progress') {
          const chunkLength = event?.data?.chunkLength;
          if (typeof chunkLength === 'number') {
            setDownloadedBytes((prev) => prev + chunkLength);
          }
        }
      });
      setStatus('restarting');
      await relaunch();
    } catch (error) {
      console.error('Update install failed:', error);
      setStatus('error');
    }
  };

  if (dismissed || status === 'idle' || !update) return null;

  return (
    <div className="fixed right-6 top-6 z-50 w-[360px] rounded-xl border border-sand-200 bg-white shadow-lg">
      <div className="flex items-start justify-between gap-3 border-b border-sand-200 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">Update available</p>
          <p className="text-xs text-gray-500">
            {update?.version ? `Version ${update.version} is ready to install.` : 'A new version is ready to install.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="rounded-full p-1 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Dismiss update notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="px-4 py-3">
        {status === 'available' && (
          <button
            type="button"
            onClick={handleInstall}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
          >
            <ArrowDownToLine className="h-4 w-4" />
            Download and restart
          </button>
        )}

        {status === 'downloading' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Downloading update...
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-sand-100">
              <div
                className={`h-full bg-teal-500 transition-all ${progressPercent === null ? 'animate-pulse w-1/2' : ''}`}
                style={progressPercent === null ? undefined : { width: `${progressPercent}%` }}
              />
            </div>
            {progressPercent !== null && (
              <p className="text-xs text-gray-500">{progressPercent}% complete</p>
            )}
          </div>
        )}

        {status === 'restarting' && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Restarting to apply update...
          </div>
        )}

        {status === 'error' && (
          <p className="text-sm text-red-600">Unable to install the update right now.</p>
        )}
      </div>
    </div>
  );
}
