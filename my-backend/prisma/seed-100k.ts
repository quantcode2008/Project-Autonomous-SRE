import { prisma } from '../src/config/database'
import { ensureAdminUser } from '../src/config/seed-admin'

async function seed100k() {
  console.log('--- STARTING 100,000 USER & RELATED ROW SEEDING ---')
  const startTime = Date.now()

  // 1. Ensure primary admin user is intact
  await ensureAdminUser()

  console.log('[1/4] Generating 100,000 realistic users in PostgreSQL...')
  const userCount = await prisma.$executeRawUnsafe(`
    INSERT INTO "user" ("id", "name", "email", "emailVerified", "role", "isApproved", "createdAt", "updatedAt")
    SELECT 
      'fake_user_' || i,
      'User ' || i,
      'user_' || i || '@loadtest.local',
      (i % 3 != 0), -- ~66% verified
      'USER',
      (i % 5 = 0),  -- ~20% approved, 80% pending
      NOW() - ((100000 - i) * INTERVAL '2 seconds'),
      NOW()
    FROM generate_series(1, 100000) AS s(i)
    ON CONFLICT ("email") DO NOTHING;
  `)
  console.log(`[1/4] Done! Users inserted/verified: ${userCount}`)

  console.log('[2/4] Generating 100,000 linked credential accounts...')
  const accountCount = await prisma.$executeRawUnsafe(`
    INSERT INTO "account" ("id", "userId", "accountId", "providerId", "password", "createdAt", "updatedAt")
    SELECT 
      'fake_acc_' || i,
      'fake_user_' || i,
      'fake_user_' || i,
      'credential',
      '$2a$10$e8wVqP1b4v5sHj9K3m2n1O0p9q8r7s6t5u4v3w2x1y0z',
      NOW() - ((100000 - i) * INTERVAL '2 seconds'),
      NOW()
    FROM generate_series(1, 100000) AS s(i)
    ON CONFLICT ("id") DO NOTHING;
  `)
  console.log(`[2/4] Done! Accounts inserted: ${accountCount}`)

  console.log('[3/4] Generating 50,000 realistic user-owned items (incident logs)...')
  const itemCount = await prisma.$executeRawUnsafe(`
    INSERT INTO "item" ("id", "title", "description", "userId", "createdAt", "updatedAt")
    SELECT 
      '00000000-0000-0000-0000-' || LPAD(i::text, 12, '0'),
      'Incident Telemetry Run #' || i || ' - Kubernetes Cluster ' || (i % 25),
      'Automated SRE anomaly detection log captured during node pressure test at cluster zone us-east-1.',
      'fake_user_' || i,
      NOW() - ((50000 - i) * INTERVAL '5 seconds'),
      NOW()
    FROM generate_series(1, 50000) AS s(i)
    ON CONFLICT ("id") DO NOTHING;
  `)
  console.log(`[3/4] Done! Items inserted: ${itemCount}`)

  console.log('[4/4] Generating 25,000 waitlist entries...')
  const waitlistCount = await prisma.$executeRawUnsafe(`
    INSERT INTO "waitlist_entry" ("id", "email", "role", "confirmationId", "createdAt")
    SELECT 
      'fake_wl_' || i,
      'wl_user_' || i || '@enterprise-sre.io',
      CASE WHEN i % 3 = 0 THEN 'DevOps Lead' WHEN i % 3 = 1 THEN 'Staff SRE' ELSE 'Infrastructure Architect' END,
      'CFM-' || LPAD(i::text, 8, '0'),
      NOW() - ((25000 - i) * INTERVAL '10 seconds')
    FROM generate_series(1, 25000) AS s(i)
    ON CONFLICT ("email") DO NOTHING;
  `)
  console.log(`[4/4] Done! Waitlist entries inserted: ${waitlistCount}`)

  // Verify total row counts in database
  const [totalUsers, totalAccounts, totalItems, totalWaitlist] = await Promise.all([
    prisma.user.count(),
    prisma.account.count(),
    prisma.item.count(),
    prisma.waitlistEntry.count(),
  ])

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2)

  console.log('=====================================================')
  console.log(`DATABASE SEEDING SUMMARY (Completed in ${totalTime}s):`)
  console.log(`- Total Users:          ${totalUsers.toLocaleString()}`)
  console.log(`- Total Accounts:       ${totalAccounts.toLocaleString()}`)
  console.log(`- Total Items:          ${totalItems.toLocaleString()}`)
  console.log(`- Total Waitlist:       ${totalWaitlist.toLocaleString()}`)
  console.log('=====================================================')

  await prisma.$disconnect()
}

seed100k()
  .catch((err) => {
    console.error('Seeding failed:', err)
    process.exit(1)
  })
