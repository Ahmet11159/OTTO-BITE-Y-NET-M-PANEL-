'use client'

import { useState } from 'react'
import { deleteUser } from '@/app/actions/user'

export default function DeleteUserButton({ userId }) {
    const [isDeleting, setIsDeleting] = useState(false)
    const [needsConfirmation, setNeedsConfirmation] = useState(false)

    const handleDelete = async () => {
        if (!needsConfirmation) {
            setNeedsConfirmation(true)
            // Auto-reset after 3 seconds
            setTimeout(() => setNeedsConfirmation(false), 3000)
            return
        }

        setIsDeleting(true)
        try {
            const res = await deleteUser({ id: userId })
            if (!res.success) {
                alert(res.error)
                setIsDeleting(false)
            }
            // Success: page will revalidate
        } catch (error) {
            alert('Bir hata oluştu.')
            setIsDeleting(false)
        }
    }

    return (
        <button
            onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleDelete()
            }}
            type="button"
            disabled={isDeleting}
            className={`transition-colors disabled:opacity-50 ${needsConfirmation ? 'text-red-600 font-bold bg-white/10 px-2 rounded' : 'text-red-400 hover:text-red-300'}`}
        >
            {isDeleting ? 'Siliniyor...' : needsConfirmation ? 'Emin misiniz?' : 'Sil'}
        </button>
    )
}
