const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
    const hashedPassword = await bcrypt.hash('password123', 10)

    const admin = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {
            password: hashedPassword
        },
        create: {
            username: 'admin',
            password: hashedPassword,
            role: 'ADMIN',
            fullName: 'Sistem Yöneticisi',
            department: 'Management'
        },
    })

    const chef1 = await prisma.user.upsert({
        where: { username: 'chef1' },
        update: {
            password: hashedPassword
        },
        create: {
            username: 'chef1',
            password: hashedPassword,
            role: 'CHEF',
            fullName: 'Ahmet Chef',
            department: 'Salon 1'
        },
    })

    const chef2 = await prisma.user.upsert({
        where: { username: 'chef2' },
        update: {
            password: hashedPassword
        },
        create: {
            username: 'chef2',
            password: hashedPassword,
            role: 'CHEF',
            fullName: 'Mehmet Chef',
            department: 'Bar'
        },
    })

    console.log({ admin, chef1, chef2 })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
