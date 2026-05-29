import 'dotenv/config';
import { PrismaClient, Role, SubscriptionStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱  Seeding database…');

  // ── 1. SUPER_ADMIN (no company) ───────────────────────────────────────────
  const superAdmin = await prisma.user.upsert({
    where:  { username: 'superadmin' },
    update: {},
    create: {
      username:  'superadmin',
      email:     'superadmin@ubuntusales.com',
      password:  await bcrypt.hash('Admin@1234', 12),
      firstName: 'Super',
      lastName:  'Admin',
      role:      Role.SUPER_ADMIN,
      isActive:  true,
      companyId: null,
    },
  });
  console.log(`✅  SUPER_ADMIN : ${superAdmin.username} / Admin@1234`);

  // ── 2. Demo company ───────────────────────────────────────────────────────
  const company = await prisma.company.upsert({
    where:  { slug: 'demo-company' },
    update: {},
    create: {
      name:               'Demo Company',
      slug:               'demo-company',
      email:              'admin@democompany.com',
      subscriptionStatus: SubscriptionStatus.TRIAL,
      isActive:           true,
    },
  });
  console.log(`✅  Company     : ${company.name} (${company.id})`);

  // ── 3. COMPANY_ADMIN for the demo company ─────────────────────────────────
  const companyAdmin = await prisma.user.upsert({
    where:  { username: 'companyadmin' },
    update: {},
    create: {
      username:  'companyadmin',
      email:     'admin@democompany.com',
      password:  await bcrypt.hash('Admin@1234', 12),
      firstName: 'Company',
      lastName:  'Admin',
      role:      Role.COMPANY_ADMIN,
      isActive:  true,
      companyId: company.id,
    },
  });
  console.log(`✅  COMPANY_ADMIN: ${companyAdmin.username} / Admin@1234`);

  console.log('\n⚠️   Change all passwords immediately after first login!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
