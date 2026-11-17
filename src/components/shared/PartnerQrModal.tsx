/**
 * src/components/shared/PartnerQrModal.tsx
 *
 * Scannable Cross-Device QR Code Modal:
 * Allows couples (e.g. Timothy & Melanie) to seamlessly open the plan
 * on their separate smartphones, unlocking asynchronous two-pace review.
 */

import { useState } from 'react';
import { X, Copy, Check, Smartphone, Users, Sparkles, ExternalLink } from 'lucide-react';
import { generateQRMatrix } from '../../lib/qrEncoder';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  partnerName: string;
  partnerRole: string;
  url: string;
}

export function PartnerQrModal({ isOpen, onClose, partnerName, partnerRole, url }: Props) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const matrix = generateQRMatrix(url);
  const size = matrix.length;
  const cellSize = 7;
  const padding = 14;
  const totalWidth = size * cellSize + padding * 2;

  const handleCopy = async () => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Scan to open on partner phone"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700/80 p-5 text-white shadow-2xl shadow-black/80 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Smartphone className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">Scan on Partner's Phone</h3>
              <p className="text-[10px] text-slate-400">Two Paces, One Plan Alignment</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Partner Badge */}
        <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider block">Opening for:</span>
            <span className="font-bold text-white text-sm mt-0.5">{partnerName}</span>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold text-[10px]">
            {partnerRole}
          </span>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-slate-200">
          <svg
            viewBox={`0 0 ${totalWidth} ${totalWidth}`}
            className="w-48 h-48 max-w-full"
            shapeRendering="crispEdges"
            role="img"
            aria-label={`QR Code for ${partnerName}'s phone link`}
          >
            <rect width={totalWidth} height={totalWidth} fill="#ffffff" />
            {matrix.map((row, y) =>
              row.map((isDark, x) => {
                if (!isDark) return null;
                return (
                  <rect
                    key={`${x}-${y}`}
                    x={padding + x * cellSize}
                    y={padding + y * cellSize}
                    width={cellSize}
                    height={cellSize}
                    fill="#0f172a"
                  />
                );
              }),
            )}
          </svg>
          <p className="text-[10px] text-slate-500 font-medium mt-1">
            Point camera to open on second phone
          </p>
        </div>

        {/* URL Copy Button */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleCopy}
            className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Link Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Mobile Link for {partnerName}</span>
              </>
            )}
          </button>
        </div>

        {/* Instructions */}
        <div className="text-[10px] text-slate-400 leading-relaxed space-y-1 pt-1">
          <p className="font-semibold text-slate-300">How Asynchronous Alignment works:</p>
          <p>1. Each partner reviews on their own mobile device at their own pace.</p>
          <p>2. Both prioritize strategies in the tactile Cash Allocator.</p>
          <p>3. At the end, Family Sync highlights your shared agreements & advisor questions.</p>
        </div>
      </div>
    </div>
  );
}
