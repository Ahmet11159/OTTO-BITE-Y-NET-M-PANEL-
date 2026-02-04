'use client'

import { useState } from 'react'
import { deleteUser } from '@/app/actions/user'
import ConfirmModal from '@/app/components/confirm-modal'
import { useToast } from '@/app/providers/toast-provider'

export default function DeleteUserButton({ userId }) {
    const [isDeleting, setIsDeleting] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const { addToast } = useToast()

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            const res = await deleteUser({ id: userId })
            if (!res.success) {
                addToast(res.error, 'error')
                setIsDeleting(false)
            } else {
                addToast('Kullanıcı silindi', 'success')
            }
        } catch (error) {
            addToast('Bir hata oluştu.', 'error')
            setIsDeleting(false)
        } finally {
            setShowConfirm(false)
        }
    }

    return (
        <>
            <button
                onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowConfirm(true)
                }}
                type="button"
                disabled={isDeleting}
                className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
            >
                {isDeleting ? 'Siliniyor...' : 'Sil'}
            </button>
            <ConfirmModal
                open={showConfirm}
                title="Kullanıcı Sil"
                message="Bu kullanıcıyı silmek istediğinize emin misiniz?"
                confirmText="Sil"
                cancelText="Vazgeç"
                onConfirm={handleDelete}
                onCancel={() => setShowConfirm(false)}
            />
        </>
    )
}
