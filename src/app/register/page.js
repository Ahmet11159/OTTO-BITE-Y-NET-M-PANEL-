'use client'

import { useState } from 'react'
import { registerFirstAdmin } from '@/app/actions/register'
import Link from 'next/link'

export default function RegisterPage() {
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        const formData = new FormData(e.target)
        const data = {
            fullName: formData.get('fullName'),
            username: formData.get('username'),
            password: formData.get('password'),
            department: formData.get('department')
        }

        const res = await registerFirstAdmin(data)
        if (!res.success) {
            setError(res.error)
            setLoading(false)
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0d0d0d', // Dark background matching theme
            color: '#fff',
            fontFamily: 'sans-serif'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '400px',
                padding: '2rem',
                background: '#1a1a1a',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.3), 0 0 20px rgba(255, 165, 0, 0.1)',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', background: 'linear-gradient(to right, #fff, #ccc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        OTTOBITE
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.875rem' }}>İlk Yönetici Hesabı Oluşturma</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label htmlFor="fullName" style={{ fontSize: '0.875rem', fontWeight: '500', color: '#ccc' }}>Ad Soyad</label>
                        <input
                            id="fullName"
                            name="fullName"
                            type="text"
                            required
                            placeholder="Adınız Soyadınız"
                            style={{
                                padding: '0.75rem',
                                borderRadius: '8px',
                                border: '1px solid #333',
                                background: '#262626',
                                color: '#fff',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label htmlFor="department" style={{ fontSize: '0.875rem', fontWeight: '500', color: '#ccc' }}>Bölüm / Ünvan</label>
                        <input
                            id="department"
                            name="department"
                            type="text"
                            placeholder="Örn: Genel Müdür"
                            defaultValue="Yönetim"
                            style={{
                                padding: '0.75rem',
                                borderRadius: '8px',
                                border: '1px solid #333',
                                background: '#262626',
                                color: '#fff',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label htmlFor="username" style={{ fontSize: '0.875rem', fontWeight: '500', color: '#ccc' }}>Kullanıcı Adı</label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            required
                            placeholder="Kullanıcı adı"
                            style={{
                                padding: '0.75rem',
                                borderRadius: '8px',
                                border: '1px solid #333',
                                background: '#262626',
                                color: '#fff',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label htmlFor="password" style={{ fontSize: '0.875rem', fontWeight: '500', color: '#ccc' }}>Şifre</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            placeholder="Güçlü bir şifre"
                            style={{
                                padding: '0.75rem',
                                borderRadius: '8px',
                                border: '1px solid #333',
                                background: '#262626',
                                color: '#fff',
                                outline: 'none'
                            }}
                        />
                    </div>

                    {error && (
                        <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.5)', color: '#fca5a5', borderRadius: '8px', fontSize: '0.875rem', textAlign: 'center' }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            marginTop: '1rem',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'linear-gradient(to right, #f59e0b, #d97706)',
                            color: '#000',
                            fontWeight: 'bold',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            transition: 'opacity 0.2s'
                        }}
                    >
                        {loading ? 'Oluşturuluyor...' : 'Yönetici Hesabı Oluştur'}
                    </button>

                    <Link href="/login" style={{ textAlign: 'center', color: '#666', fontSize: '0.875rem', textDecoration: 'none', marginTop: '0.5rem' }}>
                        Giriş ekranına dön
                    </Link>
                </form>
            </div>
        </div>
    )
}
