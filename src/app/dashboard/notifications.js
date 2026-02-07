'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getNotifications, markNotificationsRead } from '@/app/actions/notifications'

export default function NotificationBell({ initialLocale = 'tr-TR', pollIntervalMs = 10000 }) {
    const [notifications, setNotifications] = useState([])
    const [showMenu, setShowMenu] = useState(false)
    const [sseReady, setSseReady] = useState(false)
    const [locale, setLocale] = useState(initialLocale || 'tr-TR')

    const fetchNotifications = async () => {
        try {
            const res = await getNotifications()
            const list = res && res.success && Array.isArray(res.data) ? res.data : []
            setNotifications(list)
        } catch (e) { }
    }

    useEffect(() => {
        let intervalId = null
        setLocale(initialLocale || 'tr-TR')
        const es = typeof window !== 'undefined' ? new EventSource('/api/notifications/stream') : null
        if (es) {
            es.onmessage = (ev) => {
                try {
                    const data = JSON.parse(ev.data)
                    setNotifications(prev => [data, ...prev].slice(0, 50))
                    setSseReady(true)
                    if (intervalId) {
                        clearInterval(intervalId)
                        intervalId = null
                    }
                } catch {}
            }
            es.onerror = () => {
                setSseReady(false)
            }
        }
        const onKey = (e) => {
            if (e.key === 'Escape') setShowMenu(false)
        }
        const onClickOut = (e) => {
            if (!e.target.closest?.('.notification-menu')) setShowMenu(false)
        }
        document.addEventListener('keydown', onKey)
        document.addEventListener('mousedown', onClickOut)
        if (!sseReady) {
            fetchNotifications()
            intervalId = setInterval(fetchNotifications, pollIntervalMs)
        }
        return () => {
            if (intervalId) clearInterval(intervalId)
            if (es) es.close()
            document.removeEventListener('keydown', onKey)
            document.removeEventListener('mousedown', onClickOut)
        }
        }, [initialLocale, pollIntervalMs])

    const handleMarkRead = async () => {
        const res = await markNotificationsRead()
        if (res && res.success) {
            setNotifications([])
            setShowMenu(false)
        }
    }

    return (
        <div className="relative">
            <button
                onClick={() => setShowMenu(!showMenu)}
                className="relative p-2 rounded-full hover:bg-white/5 transition-colors"
                aria-label="Bildirimler"
                aria-expanded={showMenu ? 'true' : 'false'}
                aria-haspopup="menu"
            >
                <svg className="w-6 h-6 text-gray-400 hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className={`absolute -bottom-0.5 -left-0.5 w-2 h-2 rounded-full ${sseReady ? 'bg-emerald-500' : 'bg-gray-600'}`}></span>
                {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                        {notifications.length}
                    </span>
                )}
            </button>

            {showMenu && (
                <div role="menu" className="notification-menu absolute md:right-0 right-2 left-2 md:left-auto mt-3 w-[92vw] md:w-96 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
                    <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/40">
                        <span className="text-sm font-bold text-white">Bildirimler</span>
                        {notifications.length > 0 && (
                            <button onClick={handleMarkRead} className="text-xs text-blue-400 hover:text-blue-300">Tümünü Oku</button>
                        )}
                    </div>
                    <div className="max-h-96 overflow-y-auto divide-y divide-white/5">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-sm text-gray-500 italic">Okunmamış bildirim yok.</div>
                        ) : (
                            notifications.map(n => (
                                <div key={n.id} role="menuitem" className={`p-4 hover:bg-white/[0.02] transition-colors ${n.priority === 'HIGH' ? 'bg-red-900/10' : ''}`}>
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{n.type}</span>
                                        <span className="text-[10px] text-gray-600">{new Date(n.createdAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <p className="text-sm text-gray-200 leading-relaxed">{n.content}</p>
                                    <div className="mt-2 text-[10px] text-gray-500">Gönderen: {n.userName}</div>
                                    {n.link && (
                                        <div className="mt-3">
                                            <Link href={n.link} className="text-xs text-gold hover:underline">Detaya git</Link>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
