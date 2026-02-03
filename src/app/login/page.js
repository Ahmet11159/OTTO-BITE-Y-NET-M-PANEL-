'use client'

import { useState } from 'react'
import { login } from '@/app/actions/auth'
import styles from './page.module.css'

export default function LoginPage() {
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

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
            }
            // If success, the action will redirect, so we don't need to do anything here
        } catch (err) {
            setError('Bir hata oluştu.')
            setLoading(false)
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
                        {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                    </button>
                </form>
            </div>
        </div>
    )
}
