import { prisma } from '../src/config/database'

async function inspect() {
  const users = await prisma.user.count()
  const accounts = await prisma.account.count()
  const items = await prisma.item.count()
  const waitlist = await prisma.waitlistEntry.count()

  console.log('Source Database (my_backend_db):')
  console.log(`Users:    ${users}`)
  console.log(`Accounts: ${accounts}`)
  console.log(`Items:    ${items}`)
  console.log(`Waitlist: ${waitlist}`)

  await prisma.$disconnect()
}

inspect().catch(console.error)
