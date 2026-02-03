// Mevcut kullanıcılara varsayılan şifre atama scripti
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
    // Varsayılan şifre
    const defaultPassword = '123456'
    const hashedPassword = await bcrypt.hash(defaultPassword, 10)

    // Tüm kullanıcıları güncelle
    const users = await prisma.user.findMany()

    for (const user of users) {
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword
            }
        })
        console.log(`✅ ${user.username} şifresi güncellendi: ${defaultPassword}`)
    }

    console.log('\n🎉 Tüm kullanıcıların şifresi "123456" olarak ayarlandı!')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
