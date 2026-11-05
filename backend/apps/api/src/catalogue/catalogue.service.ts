import { Injectable } from '@nestjs/common';
import { EntityLifecycleStatus, Prisma } from '@saru/database';
import { PrismaService } from '../prisma/prisma.service';
import { AppError, ErrorCodes } from '../common/errors/app-error';
import { normalizePage, toPaginated } from '../common/pagination/paginate';

@Injectable()
export class CatalogueService {
  constructor(private readonly prisma: PrismaService) {}

  async listCategories(query: {
    page?: number;
    pageSize?: number;
    q?: string;
  }) {
    const { page, pageSize, skip, take } = normalizePage(query);
    const where: Prisma.CategoryWhereInput = query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: 'insensitive' } },
            { code: { contains: query.q, mode: 'insensitive' } },
          ],
        }
      : {};
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.category.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
      }),
      this.prisma.category.count({ where }),
    ]);
    return toPaginated(
      rows.map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        status: r.status.toLowerCase(),
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
      total,
      page,
      pageSize,
    );
  }

  async listManufacturers(query: {
    page?: number;
    pageSize?: number;
    q?: string;
  }) {
    const { page, pageSize, skip, take } = normalizePage(query);
    const where: Prisma.ManufacturerWhereInput = query.q
      ? { name: { contains: query.q, mode: 'insensitive' } }
      : {};
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.manufacturer.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
      }),
      this.prisma.manufacturer.count({ where }),
    ]);
    return toPaginated(
      rows.map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        country: r.country,
        status: r.status.toLowerCase(),
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        version: r.version,
      })),
      total,
      page,
      pageSize,
    );
  }

  async createManufacturer(
    body: { code: string; name: string; country: string },
    userId: string,
  ) {
    return this.prisma.manufacturer.create({
      data: { ...body, createdBy: userId, updatedBy: userId },
    });
  }

  async listSuppliers(query: { page?: number; pageSize?: number; q?: string }) {
    const { page, pageSize, skip, take } = normalizePage(query);
    const where: Prisma.SupplierWhereInput = query.q
      ? { name: { contains: query.q, mode: 'insensitive' } }
      : {};
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.supplier.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
      }),
      this.prisma.supplier.count({ where }),
    ]);
    return toPaginated(
      rows.map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        country: r.country,
        contactName: r.contactName ?? undefined,
        email: r.email ?? undefined,
        phone: r.phone ?? undefined,
        status: r.status.toLowerCase(),
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        version: r.version,
      })),
      total,
      page,
      pageSize,
    );
  }

  async createSupplier(
    body: {
      code: string;
      name: string;
      country: string;
      contactName?: string;
      email?: string;
      phone?: string;
    },
    userId: string,
  ) {
    return this.prisma.supplier.create({
      data: { ...body, createdBy: userId, updatedBy: userId },
    });
  }

  async listDepartments(query: {
    page?: number;
    pageSize?: number;
    q?: string;
  }) {
    const { page, pageSize, skip, take } = normalizePage(query);
    const where: Prisma.DepartmentWhereInput = query.q
      ? { name: { contains: query.q, mode: 'insensitive' } }
      : {};
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.department.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
      }),
      this.prisma.department.count({ where }),
    ]);
    return toPaginated(
      rows.map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        type: r.type,
        city: r.city ?? undefined,
        province: r.province ?? undefined,
        contactName: r.contactName ?? undefined,
        status: r.status.toLowerCase(),
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        version: r.version,
      })),
      total,
      page,
      pageSize,
    );
  }

  async getOrThrow(
    model: 'category' | 'manufacturer' | 'supplier' | 'department',
    id: string,
  ) {
    const row =
      model === 'category'
        ? await this.prisma.category.findUnique({ where: { id } })
        : model === 'manufacturer'
          ? await this.prisma.manufacturer.findUnique({ where: { id } })
          : model === 'supplier'
            ? await this.prisma.supplier.findUnique({ where: { id } })
            : await this.prisma.department.findUnique({ where: { id } });
    if (!row)
      throw new AppError(ErrorCodes.NOT_FOUND, `${model} not found`, 404);
    return row;
  }

  // silence unused enum import for status casts in future create endpoints
  activeStatus() {
    return EntityLifecycleStatus.ACTIVE;
  }
}
