'use client'

import { useState } from 'react'
import ReportCard from './report-card'

export default function CategorizedView({ reports, currentDepartment = 'all', currentUserId }) {

    const [selectedDetail, setSelectedDetail] = useState(null)

    const normalizeDepartment = (department) => department || 'Belirtilmemiş'

    const uniqueDepartments = Array.from(new Set(reports.map(r => normalizeDepartment(r.department))))
    const preferredOrder = ['Mutfak', 'Bar', 'Salon']
    const orderedDepartments = [
        ...preferredOrder.filter(d => uniqueDepartments.includes(d)),
        ...uniqueDepartments.filter(d => !preferredOrder.includes(d))
    ]
    const departments = currentDepartment !== 'all'
        ? [currentDepartment]
        : orderedDepartments

    const getDepartmentReports = (dept) => {
        return reports.filter(r => normalizeDepartment(r.department) === dept)
    }

    const gridClass = currentDepartment !== 'all'
        ? "max-w-3xl mx-auto"
        : "grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20"

    return (
        <>
            <div className={gridClass}>
                {departments.map(dept => (
                    <div key={dept} className="flex flex-col gap-4 relative">
                        {/* Sticky Dept Header - Adjusted for Nav + FilterBar */}
                        <div className="sticky top-[150px] z-10 py-4 -mx-2 px-2">
                            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] to-gray-200 uppercase tracking-widest border-b border-[#d4af37]/30 pb-2 backdrop-blur-md bg-black/60 shadow-lg rounded-xl">
                                {dept}
                            </h2>
                        </div>

                        <div className="space-y-4">
                            {getDepartmentReports(dept).length === 0 ? (
                                <div className="text-gray-600 text-sm italic p-4 border border-dashed border-gray-800 rounded-xl text-center">Rapor yok</div>
                            ) : (
                                getDepartmentReports(dept).map(report => (
                                    <ReportCard
                                        key={report.id}
                                        report={report}
                                        isManager={true}
                                        isOwnReport={report.authorId === currentUserId}
                                        onViewDetail={() => setSelectedDetail(report)}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Premium Full Screen Detail Modal */}
            {selectedDetail && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex justify-end animate-fade-in" onClick={() => setSelectedDetail(null)}>
                    <div
                        className="w-full md:w-[600px] lg:w-[800px] h-full bg-[#050505] border-l border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col transform transition-transform duration-300 animate-slide-in-right"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex-none p-5 border-b border-white/10 flex justify-between items-center bg-black/50 backdrop-blur-xl">
                            <div>
                                <h3 className="text-lg font-bold text-white tracking-wide">Rapor Detayı</h3>
                                <div className="text-xs text-gray-500 uppercase tracking-widest">{selectedDetail.department}</div>
                            </div>
                            <button
                                onClick={() => setSelectedDetail(null)}
                                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/20 text-gray-400 hover:text-white flex items-center justify-center transition-all"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            <ReportCard
                                report={selectedDetail}
                                isManager={true}
                                isOwnReport={selectedDetail.authorId === currentUserId}
                                forceExpanded={true}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
