'use client'

import { useState, useRef, useEffect } from 'react'
import { login } from '@/app/actions/auth'
import styles from './page.module.css'

export default function LoginPage() {
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const usernameRef = useRef(null)
    const passwordRef = useRef(null)

    useEffect(() => {
        if (usernameRef.current) usernameRef.current.focus()
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        const formData = new FormData(e.target)
        const data = {
            username: formData.get('username'),
            password: formData.get('password')
        }

        try {
            const res = await login(data)
            if (!res.success) {
                setError(res.error)
                setLoading(false)
                const msg = (res.error || '').toLowerCase()
                if (msg.includes('kullanıcı')) {
                    if (usernameRef.current) usernameRef.current.focus()
                } else {
                    if (passwordRef.current) passwordRef.current.focus()
                }
            }
        } catch (err) {
            setLoading(false)
            return
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h1 className={styles.title}>OTTOBITE</h1>
                    <p className={styles.subtitle}>ShiftLog Sistemi</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label className="label" htmlFor="username">Kullanıcı Adı</label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            className="input-field"
                            placeholder="Kullanıcı adınızı girin"
                            required
                            ref={usernameRef}
                            aria-invalid={!!error}
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label className="label" htmlFor="password">Şifre</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            className="input-field"
                            placeholder="Şifrenizi girin"
                            required
                            ref={passwordRef}
                            aria-invalid={!!error}
                        />
                    </div>

                    {error && (
                        <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded text-sm text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '1rem' }}
                        disabled={loading}
                    >
                        {loading ? 'Yönlendiriliyor...' : 'Panele Gir'}
                    </button>
                </form>
            </div>
        </div>
    )
}
