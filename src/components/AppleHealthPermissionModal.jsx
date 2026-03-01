import { useEffect } from 'react';

export default function AppleHealthPermissionModal({ onAllow, onDontAllow }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onDontAllow?.();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onDontAllow]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="apple-health-modal-title"
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white shadow-xl overflow-hidden font-apple"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 pt-8 pb-4 text-center">
          <p id="apple-health-modal-title" className="text-base text-gray-800 font-medium leading-snug">
            PrivaPulse would like to access your Health Data
          </p>
        </div>
        <div className="border-t border-gray-200">
          <button
            type="button"
            className="w-full py-3.5 text-base font-semibold text-red-600 hover:bg-gray-50 active:bg-gray-100 transition-colors"
            onClick={onDontAllow}
          >
            Don&apos;t Allow
          </button>
          <button
            type="button"
            className="w-full py-3.5 text-base font-semibold text-blue-600 hover:bg-gray-50 active:bg-gray-100 transition-colors border-t border-gray-200"
            onClick={onAllow}
          >
            Allow
          </button>
        </div>
      </div>
    </div>
  );
}
