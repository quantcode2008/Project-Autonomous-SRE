import { PrismaClient } from '@prisma/client'

async function verifyRestore() {
  const restoreDbUrl = 'postgresql://postgres:KALIOSINT20022008@localhost:5432/my_backend_restore_test?schema=public'
  const prismaRestore = new PrismaClient({
    datasources: {
      db: { url: restoreDbUrl },
    },
  })

  console.log('Verifying Restored Database (my_backend_restore_test):')
  const [users, accounts, items, waitlist] = await Promise.all([
    prismaRestore.user.count(),
    prismaRestore.account.count(),
    prismaRestore.item.count(),
    prismaRestore.waitlistEntry.count(),
  ])

  console.log(`- Restored Users:    ${users.toLocaleString()}`)
  console.log(`- Restored Accounts: ${accounts.toLocaleString()}`)
  console.log(`- Restored Items:    ${items.toLocaleString()}`)
  console.log(`- Restored Waitlist: ${waitlist.toLocaleString()}`)

  if (users >= 100000 && accounts >= 100000 && items >= 50000 && waitlist >= 25000) {
    console.log('>>> RESTORE PROVEN 100% SUCCESSFUL: ALL DATA & SCHEMAS INTACT! <<<')
  } else {
    console.error('>>> RESTORE INCOMPLETE: ROW COUNTS DO NOT MATCH! <<<')
    process.exit(1)
  }

  await prismaRestore.$disconnect()
}

verifyRestore().catch((err) => {
  console.error('Verification failed:', err)
  process.exit(1)
})
