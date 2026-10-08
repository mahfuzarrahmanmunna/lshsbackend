import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // ---- USERS ----
  const userCount = await prisma.user.count()
  if (userCount === 0) {
    const password = await bcrypt.hash('Password123!', 10)
    await prisma.user.createMany({
      data: [
        { name: 'System Admin',   email: 'admin@lshs.ac.uk',   password, role: 'ADMIN',        firstName: 'System', lastName: 'Admin' },
        { name: 'James Anderson',  email: 'manager@lshs.ac.uk', password, role: 'MANAGER',      firstName: 'James',  lastName: 'Anderson' },
        { name: 'Sarah Kamara',    email: 'sales1@lshs.ac.uk',  password, role: 'SALES_PERSON', firstName: 'Sarah',  lastName: 'Kamara' },
        { name: 'Ariya Perera',    email: 'sales2@lshs.ac.uk',  password, role: 'SALES_PERSON', firstName: 'Ariya',  lastName: 'Perera' },
      ],
    })
    console.log('✓ Seeded users')
  } else {
    console.log('• Users already exist — skipped')
  }

  // ---- LEAD SOURCES ----
  const sources = [
    { name: 'Manual',     code: 'MANUAL' },
    { name: 'Meta Ads',   code: 'META_ADS' },
    { name: 'Website',    code: 'WEBSITE' },
    { name: 'WhatsApp',   code: 'WHATSAPP' },
    { name: 'Google Ads', code: 'GOOGLE_ADS' },
    { name: 'Referral',   code: 'REFERRAL' },
    { name: 'Email',      code: 'EMAIL' },
    { name: 'Phone',      code: 'PHONE' },
    { name: 'Other',      code: 'OTHER' },
  ]
  for (const s of sources) {
    const leadSource = (prisma as any).leadSource
    const exists = await leadSource.findUnique({ where: { code: s.code } })
    if (!exists) await leadSource.create({ data: s })
  }
  console.log('✓ Lead sources ensured')

  // ---- COURSES ----
  const courses = [
    { title: 'MSc International Business Management', code: 'MSC-IBM', category: 'Postgraduate' },
    { title: 'MBA Global',                            code: 'MBA-GBL', category: 'Postgraduate' },
    { title: 'BSc Computing',                         code: 'BSC-CMP', category: 'Undergraduate' },
    { title: 'MSc Data Science',                      code: 'MSC-DS',  category: 'Postgraduate' },
    { title: 'MSc Cyber Security',                    code: 'MSC-CYB', category: 'Postgraduate' },
    { title: 'Professional Diploma in Marketing',     code: 'PDM-MKT', category: 'Professional' },
  ]
  for (const c of courses) {
    const course = (prisma as any).course
    const exists = await course.findUnique({ where: { code: c.code } })
    if (!exists) await course.create({ data: { ...c, isActive: true } })
  }
  console.log('✓ Courses ensured')

  console.log('\n🌱 Seed complete')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })