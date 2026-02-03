'use client'

import { useState } from 'react'
import DeleteUserButton from './delete-user-button'
import { resetUserPassword } from '@/app/actions/user'

// Şifre Belirleme Modalı
function PasswordModal({ username, userId, onClose, onSuccess }) {
    const [customPassword, setCustomPassword] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [useRandom, setUseRandom] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!useRandom && customPassword.length < 8) {
            alert('Şifre en az 8 karakter olmalıdır')
            return
        }

        setIsSubmitting(true)
        try {
            const res = await resetUserPassword({
                id: userId,
                customPassword: useRandom ? undefined : customPassword
            })

            if (res.success && res.data?.newPassword) {
                onSuccess(res.data.newPassword)
            } else {
                alert('Şifre değiştirilemedi: ' + (res.error || 'Bilinmeyen hata'))
            }
        } catch (err) {
            alert('Şifre değiştirilemedi: ' + err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/10 w-full max-w-md shadow-2xl">
                {/* Başlık */}
                <div className="flex items-center justify-between p-5 border-b border-white/10">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        🔐 Şifre Değiştir
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/60 hover:text-white"
                    >
                        ✕
                    </button>
                </div>

                {/* İçerik */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <p className="text-white/60 text-sm">
                        <strong className="text-white">{username}</strong> kullanıcısının şifresini değiştiriyorsunuz.
                    </p>

                    {/* Seçim Butonları */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setUseRandom(false)}
                            className={`p-3 rounded-xl border text-sm font-medium transition-all ${!useRandom
                                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                                }`}
                        >
                            ✏️ Kendim Belirleyeceğim
                        </button>
                        <button
                            type="button"
                            onClick={() => setUseRandom(true)}
                            className={`p-3 rounded-xl border text-sm font-medium transition-all ${useRandom
                                    ? 'bg-purple-500/20 border-purple-500/50 text-purple-400'
                                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                                }`}
                        >
                            🎲 Rastgele Oluştur
                        </button>
                    </div>

                    {/* Şifre Girişi */}
                    {!useRandom && (
                        <div>
                            <label className="block text-sm font-medium text-white/60 mb-2">
                                Yeni Şifre
                            </label>
                            <input
                                type="text"
                                value={customPassword}
                                onChange={(e) => setCustomPassword(e.target.value)}
                                placeholder="En az 8 karakter..."
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                autoFocus
                            />
                        </div>
                    )}

                    {useRandom && (
                        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 text-center">
                            <p className="text-purple-300 text-sm">
                                12 karakterli rastgele şifre oluşturulacak
                            </p>
                        </div>
                    )}
                </form>

                {/* Footer */}
                <div className="flex gap-3 p-5 border-t border-white/10">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || (!useRandom && customPassword.length < 4)}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Kaydediliyor...
                            </>
                        ) : (
                            '✓ Şifreyi Değiştir'
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

function PasswordDisplay({ userId, username }) {
    const [showPassword, setShowPassword] = useState(false)
    const [displayPassword, setDisplayPassword] = useState('')
    const [justReset, setJustReset] = useState(false)
    const [showModal, setShowModal] = useState(false)

    const handlePasswordChanged = (newPassword) => {
        setDisplayPassword(newPassword)
        setShowPassword(true)
        setJustReset(true)
        setShowModal(false)
        setTimeout(() => setJustReset(false), 15000)
    }

    const copyPassword = () => {
        if (displayPassword) {
            navigator.clipboard.writeText(displayPassword)
        }
    }

    return (
        <>
            <div className="flex items-center gap-2">
                {displayPassword ? (
                    <>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded font-mono text-sm transition-all ${justReset
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : 'bg-zinc-700/50 text-gray-300'
                            }`}>
                            <span className="min-w-[70px]">
                                {showPassword ? displayPassword : '••••••••'}
                            </span>
                        </div>

                        <button
                            onClick={() => setShowPassword(!showPassword)}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                            title={showPassword ? 'Gizle' : 'Göster'}
                        >
                            {showPassword ? '🙈' : '👁️'}
                        </button>

                        <button
                            onClick={copyPassword}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                            title="Kopyala"
                        >
                            📋
                        </button>
                    </>
                ) : (
                    <span className="text-gray-500 text-sm italic px-2 py-1">Şifre gizli</span>
                )}

                <button
                    onClick={() => setShowModal(true)}
                    className="ml-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 transition-all flex items-center gap-1.5"
                >
                    🔄 Değiştir
                </button>
            </div>

            {showModal && (
                <PasswordModal
                    username={username}
                    userId={userId}
                    onClose={() => setShowModal(false)}
                    onSuccess={handlePasswordChanged}
                />
            )}
        </>
    )
}

export default function UserList({ users }) {
    return (
        <div className="card overflow-hidden">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Personel Listesi</h2>
                <span className="text-xs text-gray-500">{users.length} kullanıcı</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-zinc-950 text-gold uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3">Ad Soyad</th>
                            <th className="px-6 py-3">Kullanıcı Adı</th>
                            <th className="px-6 py-3">Rol</th>
                            <th className="px-6 py-3">Departman</th>
                            <th className="px-6 py-3">Şifre</th>
                            <th className="px-6 py-3 text-right">İşlem</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-zinc-800/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-white">{user.fullName}</td>
                                <td className="px-6 py-4">
                                    <code className="bg-zinc-800 px-2 py-0.5 rounded text-sm">{user.username}</code>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${user.role === 'ADMIN'
                                            ? 'bg-purple-900/50 text-purple-300 border border-purple-700/50'
                                            : 'bg-zinc-700 text-gray-300'
                                        }`}>
                                        {user.role === 'ADMIN' ? '👑 Admin' : '👨‍🍳 Chef'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">{user.department || <span className="text-gray-600">-</span>}</td>
                                <td className="px-6 py-4">
                                    <PasswordDisplay
                                        userId={user.id}
                                        username={user.username}
                                    />
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <DeleteUserButton userId={user.id} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
