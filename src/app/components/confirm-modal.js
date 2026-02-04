'use client'

import { useEffect } from 'react'

export default function ConfirmModal({ open, title = 'Onay', message = 'Emin misiniz?', confirmText = 'Evet', cancelText = 'İptal', onConfirm, onCancel }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onCancel && onCancel()
    }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onCancel])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div role="dialog" aria-modal="true" className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <div className="text-lg font-bold text-white mb-2">{title}</div>
        <div className="text-sm text-gray-400 mb-6">{message}</div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 btn btn-secondary">{cancelText}</button>
          <button onClick={onConfirm} className="flex-1 btn btn-danger">{confirmText}</button>
        </div>
      </div>
    </div>
  )
}
