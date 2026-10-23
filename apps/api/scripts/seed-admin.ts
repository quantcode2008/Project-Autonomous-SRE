import path from 'node:path'
import dotenv from 'dotenv'

// Load root .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

import { prisma } from '../src/config/database'
import { recordAudit } from '../src/lib/audit'

async function seedAdmin() {
  const email = process.argv[2]
  if (!email || !email.trim()) {
    console.error('Usage: npm run seed:admin -- <email>')
    process.exit(1)
  }

  const normalizedEmail = email.trim().toLowerCase()
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  })

  if (!user) {
    console.error(`User with email "${normalizedEmail}" not found in database. Please sign up first.`)
    process.exit(1)
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { role: 'ADMIN' },
  })

  await recordAudit({
    actorId: user.id,
    action: 'admin.promote',
    targetType: 'user',
    targetId: user.id,
    metadata: { email: user.email, previousRole: user.role, newRole: 'ADMIN' },
  })

  console.log(`\n✅ Successfully promoted user "${updated.email}" (ID: ${updated.id}) to ADMIN role.\n`)
  await prisma.$disconnect()
}

seedAdmin().catch(async (err) => {
  console.error('Error promoting user to admin:', err)
  await prisma.$disconnect()
  process.exit(1)
})
