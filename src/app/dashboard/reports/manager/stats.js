'use client'

import { useState } from 'react'
import TechnicalIssuesModal from './technical-issues-modal'

export default function DashboardStats({ reports, currentUserId }) {
    const [showIssuesModal, setShowIssuesModal] = useState(false)

    const today = new Date().toDateString()

    // Filter out Manager/Technical-only reports for the "Total" and "Reviewed" stats
    // We only want to count actual operational Shift Reports here.
    const managerRoles = ['Müdür', 'Müdür Yardımcısı', 'Müşteri İlişkileri Yöneticisi']
    const operationalReports = reports.filter(r => !managerRoles.includes(r.department))
    const todayReports = operationalReports.filter(r => new Date(r.createdAt).toDateString() === today)

    const total = operationalReports.length
    const reviewed = operationalReports.filter(r => r.isReviewed).length

    // "Issues" should count EVERYTHING, including Manager technical reports
    const issues = reports.filter(r => r.technicalIssues).length

    return (
        <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="card bg-gradient-to-br from-zinc-900 to-black border-l-4 border-white text-center">
                    <div className="text-gray-400 text-xs uppercase tracking-wider">Bugün</div>
                    <div className="text-3xl font-bold text-white mt-1">{todayReports.length}</div>
                </div>

                <div className="card bg-gradient-to-br from-zinc-900 to-black border-l-4 border-blue-500 text-center">
                    <div className="text-gray-400 text-xs uppercase tracking-wider">Toplam</div>
                    <div className="text-3xl font-bold text-white mt-1">{total}</div>
                </div>

                <div className="card bg-gradient-to-br from-zinc-900 to-black border-l-4 border-green-500 text-center">
                    <div className="text-gray-400 text-xs uppercase tracking-wider">İncelenen</div>
                    <div className="text-3xl font-bold text-white mt-1">{reviewed}</div>
                    <div className="text-xs text-green-500 mt-1">%{total > 0 ? Math.round((reviewed / total) * 100) : 0}</div>
                </div>

                <div className="card bg-gradient-to-br from-zinc-900 to-black border-l-4 border-red-500 text-center relative group">
                    <div className="text-gray-400 text-xs uppercase tracking-wider">Sorun / Arıza</div>
                    <div className="text-3xl font-bold text-white mt-1">{issues}</div>

                    {issues > 0 && (
                        <button
                            onClick={() => setShowIssuesModal(true)}
                            className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors p-1"
                            title="Listeyi Gör"
                        >
                            👁️
                        </button>
                    )}
                </div>
            </div>

            {showIssuesModal && (
                <TechnicalIssuesModal reports={reports} onClose={() => setShowIssuesModal(false)} currentUserId={currentUserId} />
            )}
        </>
    )
}
