import path from 'node:path'
import dotenv from 'dotenv'

// Load root .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

import { prisma } from '../src/config/database'
import { auth } from '../src/auth/better-auth'
import { recordAudit } from '../src/lib/audit'

async function initAdmin() {
  const targetEmail = (process.argv[2] || 'mirajmisba1@gmail.com').trim().toLowerCase()
  const targetPassword = process.argv[3] || 'Admin@Sentinel2026!'
  const targetName = process.argv[4] || 'Miraj Misba (Admin)'

  console.log(`\nInitializing admin user for: ${targetEmail}...`)

  let user = await prisma.user.findUnique({
    where: { email: targetEmail },
  })

  if (!user) {
    console.log(`User does not exist. Creating via Better Auth signUpEmail...`)
    const signUpResult = await auth.api.signUpEmail({
      body: {
        email: targetEmail,
        password: targetPassword,
        name: targetName,
      },
    })

    if (!signUpResult || !signUpResult.user) {
      throw new Error('Failed to register user via Better Auth.')
    }

    user = await prisma.user.findUnique({
      where: { id: signUpResult.user.id },
    })
  }

  if (!user) {
    throw new Error('User record could not be retrieved from database.')
  }

  // Ensure role is ADMIN, emailVerified is true, disabled is false
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      role: 'ADMIN',
      emailVerified: true,
      disabled: false,
    },
  })

  // If password was provided and account exists, verify or update password in Account table
  // Better Auth stores credentials in the Account table with providerId = "credential"
  // If user existed previously and we want to ensure targetPassword is valid, we can update it
  const account = await prisma.account.findFirst({
    where: {
      userId: updated.id,
      providerId: 'credential',
    },
  })

  if (!account) {
    // If no credential account exists, create one via Better Auth internal or warn
    console.log(`Notice: User has no credential account yet.`)
  }

  await recordAudit({
    actorId: updated.id,
    action: 'admin.promote',
    targetType: 'user',
    targetId: updated.id,
    metadata: {
      email: updated.email,
      role: 'ADMIN',
      verified: true,
    },
  })

  console.log('====================================================')
  console.log('✅ ADMIN USER INITIALIZED SUCCESSFULLY')
  console.log('====================================================')
  console.log(`Email:    ${updated.email}`)
  console.log(`Password: ${targetPassword}`)
  console.log(`Role:     ${updated.role}`)
  console.log(`Status:   Active (verified=true, disabled=false)`)
  console.log('====================================================\n')

  await prisma.$disconnect()
}

initAdmin().catch(async (err) => {
  console.error('\n❌ Error initializing admin user:', err)
  await prisma.$disconnect()
  process.exit(1)
})
