'use client'

import { useState } from 'react'
import { createUser } from '@/app/actions/user'

export default function UserForm() {
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)

        const formData = new FormData(e.target)
        const data = {
            fullName: formData.get('fullName'),
            username: formData.get('username'),
            password: formData.get('password'),
            role: formData.get('role'),
            department: formData.get('department')
        }

        try {
            const res = await createUser(data)
            if (res.success) {
                alert('Kullanıcı başarıyla oluşturuldu!')
                e.target.reset()
            } else {
                alert(res.error)
            }
        } catch (error) {
            alert('Bir hata oluştu.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="lg:col-span-1">
            <div className="card sticky top-4">
                <h2 className="text-xl font-bold text-white mb-4">Yeni Personel Ekle</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="label">Ad Soyad</label>
                        <input name="fullName" type="text" className="input-field" placeholder="Örn: Ahmet Yılmaz" required />
                    </div>
                    <div>
                        <label className="label">Kullanıcı Adı</label>
                        <input name="username" type="text" className="input-field" placeholder="Örn: chef3" required />
                    </div>
                    <div>
                        <label className="label">Şifre</label>
                        <input name="password" type="password" minLength={8} className="input-field" placeholder="En az 8 karakter" required />
                    </div>
                    <div>
                        <label className="label">Rol</label>
                        <select name="role" className="input-field" required>
                            <option value="CHEF">Şef (Chef)</option>
                            <option value="ADMIN">Yönetici (Admin)</option>
                        </select>
                    </div>
                    <div>
                        <label className="label">Departman</label>
                        <select name="department" className="input-field" required>
                            <option value="" disabled selected>Seçiniz</option>
                            <option value="Salon">Salon</option>
                            <option value="Bar">Bar</option>
                            <option value="Mutfak">Mutfak</option>
                            <option value="Müdür">Müdür</option>
                            <option value="Müdür Yardımcısı">Müdür Yardımcısı</option>
                            <option value="Müşteri İlişkileri Yöneticisi">Müşteri İlişkileri Yöneticisi</option>
                        </select>
                    </div>
                    <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">
                        {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                </form>
            </div>
        </div>
    )
}
