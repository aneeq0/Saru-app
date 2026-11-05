import * as argon2 from 'argon2';
import {
  PrismaClient,
  SystemRoleCode,
  EntityLifecycleStatus,
  ShipmentStatus,
  TenderStatus,
} from '../generated/client';

const prisma = new PrismaClient();

const MODULES = [
  'dashboard', 'tasks', 'notifications', 'products', 'categories', 'suppliers',
  'manufacturers', 'departments', 'imports', 'receipts', 'warehouses', 'inventory',
  'stock_movements', 'reservations', 'stock_counts', 'transfers', 'quality',
  'tenders', 'bids', 'contracts', 'tender_compliance', 'securities', 'deliveries',
  'challans', 'invoices', 'payments', 'receivables', 'documents', 'reports',
  'analytics', 'employees', 'roles', 'approvals', 'templates', 'notification_config',
  'company_settings', 'audit', 'integrations', 'system_health',
] as const;

const ACTIONS = [
  'view', 'create', 'edit_draft', 'submit', 'approve', 'finalize',
  'cancel', 'reverse', 'export', 'administer',
] as const;

const ROLE_PERMS: Record<SystemRoleCode, 'all' | string[]> = {
  OWNER: 'all',
  TENDER_MANAGER: [
    'dashboard:view', 'tenders:view', 'tenders:create', 'tenders:edit_draft', 'tenders:submit',
    'tenders:finalize', 'bids:view', 'bids:create', 'contracts:view', 'tender_compliance:view',
    'tender_compliance:edit_draft', 'securities:view', 'securities:create', 'documents:view',
    'documents:create', 'notifications:view', 'approvals:view', 'approvals:approve',
  ],
  IMPORT_MANAGER: [
    'dashboard:view', 'imports:view', 'imports:create', 'imports:edit_draft', 'imports:submit',
    'receipts:view', 'receipts:create', 'receipts:submit', 'receipts:approve', 'receipts:finalize',
    'suppliers:view', 'suppliers:create', 'products:view', 'manufacturers:view', 'documents:view',
    'documents:create', 'notifications:view', 'approvals:view',
  ],
  INVENTORY_MANAGER: [
    'dashboard:view', 'inventory:view', 'inventory:create', 'inventory:edit_draft',
    'inventory:approve', 'inventory:finalize', 'warehouses:view', 'stock_movements:view',
    'reservations:view', 'reservations:create', 'stock_counts:view', 'stock_counts:create',
    'stock_counts:submit', 'transfers:view', 'transfers:create', 'quality:view', 'quality:create',
    'products:view', 'receipts:view', 'receipts:create', 'receipts:submit', 'deliveries:view',
    'deliveries:edit_draft', 'deliveries:finalize', 'notifications:view', 'approvals:view',
    'approvals:approve',
  ],
  DOCUMENTATION_OFFICER: [
    'dashboard:view', 'products:view', 'tenders:view', 'contracts:view', 'deliveries:view',
    'deliveries:create', 'deliveries:edit_draft', 'challans:view', 'challans:create',
    'documents:view', 'documents:create', 'departments:view', 'notifications:view',
  ],
  ACCOUNTS_OFFICER: [
    'dashboard:view', 'invoices:view', 'invoices:create', 'invoices:edit_draft', 'invoices:submit',
    'invoices:approve', 'invoices:finalize', 'invoices:export', 'payments:view', 'payments:create',
    'payments:finalize', 'receivables:view', 'contracts:view', 'securities:view',
    'securities:approve', 'documents:view', 'reports:view', 'reports:export', 'notifications:view',
  ],
  AUDITOR: MODULES.flatMap((m) => [`${m}:view`, `${m}:export`]),
};

const DEMO_USERS: Array<{
  email: string;
  firstName: string;
  lastName: string;
  role: SystemRoleCode;
}> = [
  { email: 'owner@saru.demo', firstName: 'Ayesha', lastName: 'Khan', role: SystemRoleCode.OWNER },
  { email: 'tender@saru.demo', firstName: 'Bilal', lastName: 'Ahmed', role: SystemRoleCode.TENDER_MANAGER },
  { email: 'import@saru.demo', firstName: 'Sana', lastName: 'Malik', role: SystemRoleCode.IMPORT_MANAGER },
  { email: 'inventory@saru.demo', firstName: 'Omar', lastName: 'Raza', role: SystemRoleCode.INVENTORY_MANAGER },
  { email: 'docs@saru.demo', firstName: 'Hina', lastName: 'Shah', role: SystemRoleCode.DOCUMENTATION_OFFICER },
  { email: 'accounts@saru.demo', firstName: 'Faraz', lastName: 'Ali', role: SystemRoleCode.ACCOUNTS_OFFICER },
  { email: 'auditor@saru.demo', firstName: 'Nadia', lastName: 'Qureshi', role: SystemRoleCode.AUDITOR },
];

async function main() {
  console.log('Seeding Saru International demo data...');

  await prisma.organization.upsert({
    where: { id: '00000000-0000-4000-8000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000001',
      name: 'Saru International Pvt. Ltd.',
      shortName: 'Saru',
    },
  });

  const permissionIds = new Map<string, string>();
  for (const module of MODULES) {
    for (const action of ACTIONS) {
      const code = `${module}:${action}`;
      const perm = await prisma.permission.upsert({
        where: { code },
        update: {},
        create: { module, action, code, description: `${action} on ${module}` },
      });
      permissionIds.set(code, perm.id);
    }
  }

  const roleIds = new Map<SystemRoleCode, string>();
  for (const code of Object.values(SystemRoleCode)) {
    const role = await prisma.role.upsert({
      where: { code },
      update: {},
      create: {
        code,
        name: code.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
        isSystem: true,
      },
    });
    roleIds.set(code, role.id);

    const wanted = ROLE_PERMS[code];
    const codes = wanted === 'all' ? [...permissionIds.keys()] : wanted;
    for (const permCode of codes) {
      const permissionId = permissionIds.get(permCode);
      if (!permissionId) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId } },
        update: {},
        create: { roleId: role.id, permissionId },
      });
    }
  }

  const passwordHash = await argon2.hash('Demo@1234', { type: argon2.argon2id });

  const dept = await prisma.department.upsert({
    where: { code: 'MOH-PK' },
    update: {},
    create: {
      code: 'MOH-PK',
      name: 'Ministry of Health Demo',
      type: 'ministry',
      city: 'Islamabad',
      province: 'ICT',
      status: EntityLifecycleStatus.ACTIVE,
    },
  });

  for (const u of DEMO_USERS) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        firstName: u.firstName,
        lastName: u.lastName,
        displayName: `${u.firstName} ${u.lastName}`,
        status: 'ACTIVE',
        departmentId: dept.id,
      },
      create: {
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        displayName: `${u.firstName} ${u.lastName}`,
        status: 'ACTIVE',
        departmentId: dept.id,
      },
    });
    await prisma.userCredential.upsert({
      where: { userId: user.id },
      update: { passwordHash },
      create: { userId: user.id, passwordHash },
    });
    const roleId = roleIds.get(u.role)!;
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId } },
      update: {},
      create: { userId: user.id, roleId },
    });
    await prisma.employeeProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        employeeCode: u.email.split('@')[0].toUpperCase(),
        jobTitle: u.role.replace(/_/g, ' '),
      },
    });
  }

  const category = await prisma.category.upsert({
    where: { code: 'MED-SUP' },
    update: {},
    create: { code: 'MED-SUP', name: 'Medical Supplies', status: EntityLifecycleStatus.ACTIVE },
  });

  const manufacturer = await prisma.manufacturer.upsert({
    where: { code: 'MFG-DEMO' },
    update: {},
    create: {
      code: 'MFG-DEMO',
      name: 'Demo MedTech GmbH',
      country: 'Germany',
      status: EntityLifecycleStatus.ACTIVE,
    },
  });

  const supplier = await prisma.supplier.upsert({
    where: { code: 'SUP-DEMO' },
    update: {},
    create: {
      code: 'SUP-DEMO',
      name: 'Global Pharma Trading',
      country: 'UAE',
      contactName: 'Procurement Desk',
      email: 'orders@demo-supplier.example',
      status: EntityLifecycleStatus.ACTIVE,
    },
  });

  const whLhr = await prisma.warehouse.upsert({
    where: { code: 'WH-LHR' },
    update: {},
    create: {
      code: 'WH-LHR',
      name: 'Lahore Central Warehouse',
      city: 'Lahore',
      status: EntityLifecycleStatus.ACTIVE,
    },
  });

  await prisma.warehouse.upsert({
    where: { code: 'WH-KHI' },
    update: {},
    create: {
      code: 'WH-KHI',
      name: 'Karachi Bonded Warehouse',
      city: 'Karachi',
      status: EntityLifecycleStatus.ACTIVE,
    },
  });

  const products = [
    { sku: 'SKU-GLOVE-M', name: 'Surgical Gloves Medium', packagingUnit: 'BOX' },
    { sku: 'SKU-SYR-5ML', name: 'Disposable Syringe 5ml', packagingUnit: 'BOX' },
    { sku: 'SKU-MASK-N95', name: 'N95 Respirator Mask', packagingUnit: 'BOX' },
  ];

  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        sku: p.sku,
        name: p.name,
        categoryId: category.id,
        manufacturerId: manufacturer.id,
        packagingUnit: p.packagingUnit,
        brand: 'SaruCare',
        countryOfOrigin: 'Germany',
        status: EntityLifecycleStatus.ACTIVE,
        variants: {
          create: {
            sku: `${p.sku}-01`,
            name: 'Default',
            purchaseUnit: p.packagingUnit,
            sellingUnit: p.packagingUnit,
            conversionFactor: 1,
            barcode: `${p.sku}-BC`,
          },
        },
      },
      include: { variants: true },
    });

    if (product.variants[0]) {
      // no opening stock by overwrite — opening movements only via approved process later
    }
  }

  const variant = await prisma.productVariant.findFirst({ where: { sku: 'SKU-GLOVE-M-01' } });
  const product = await prisma.product.findUnique({ where: { sku: 'SKU-GLOVE-M' } });

  if (variant && product) {
    const existingShipment = await prisma.importShipment.findUnique({ where: { reference: 'SHP-2026-000001' } });
    if (!existingShipment) {
      await prisma.importShipment.create({
        data: {
          reference: 'SHP-2026-000001',
          supplierId: supplier.id,
          supplierOrderRef: 'PO-DEMO-1001',
          shippingMethod: 'SEA',
          expectedArrival: new Date('2026-11-15'),
          currency: 'USD',
          exchangeRate: 278.5,
          status: ShipmentStatus.IN_TRANSIT,
          lines: {
            create: [
              {
                lineNo: 1,
                productId: product.id,
                variantId: variant.id,
                description: product.name,
                orderedQty: 500,
                unitPrice: 12.5,
                unit: 'BOX',
              },
            ],
          },
        },
      });
    }

    const existingTender = await prisma.tender.findUnique({ where: { reference: 'TND-2026-000001' } });
    if (!existingTender) {
      await prisma.tender.create({
        data: {
          reference: 'TND-2026-000001',
          title: 'Demo Surgical Consumables Tender',
          departmentId: dept.id,
          procuringAgency: 'Ministry of Health Demo',
          submissionDeadline: new Date('2026-12-01T12:00:00Z'),
          status: TenderStatus.PREPARING,
          estimatedValue: 2500000,
          currency: 'PKR',
          lines: {
            create: [
              {
                lineNo: 1,
                productId: product.id,
                variantId: variant.id,
                description: product.name,
                quantity: 200,
                unit: 'BOX',
                estimatedUnitPrice: 4500,
              },
            ],
          },
          checklist: {
            create: [
              { code: 'TECH_SPEC', title: 'Technical specifications attached', required: true },
              { code: 'CDR', title: 'CDR / bid security prepared', required: true },
              { code: 'AUTH_LETTER', title: 'Authorization letter', required: true },
            ],
          },
        },
      });
    }
  }

  await prisma.numberSequence.upsert({
    where: { key: 'SHIPMENT:2026' },
    update: {},
    create: { key: 'SHIPMENT:2026', prefix: 'SHP', year: 2026, nextValue: 2, padLength: 6 },
  });
  await prisma.numberSequence.upsert({
    where: { key: 'TENDER:2026' },
    update: {},
    create: { key: 'TENDER:2026', prefix: 'TND', year: 2026, nextValue: 2, padLength: 6 },
  });

  console.log('Seed complete. Demo login: owner@saru.demo / Demo@1234');
  console.log(`Warehouse seeded: ${whLhr.code}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
