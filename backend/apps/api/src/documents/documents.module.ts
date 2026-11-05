import {
  Body,
  Controller,
  Get,
  Module,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import type { AuthUserContext } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { NumberSequenceService } from '../numbering/number-sequence.service';
import { AppError, ErrorCodes } from '../common/errors/app-error';
import { ConfigService } from '@nestjs/config';
import { normalizePage, toPaginated } from '../common/pagination/paginate';

@ApiTags('documents')
@ApiBearerAuth()
@Controller('documents')
class DocumentsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly numbers: NumberSequenceService,
    private readonly config: ConfigService,
  ) {}

  @Post('upload-intents')
  @RequirePermissions('documents:create')
  async uploadIntent(
    @CurrentUser() user: AuthUserContext,
    @Body()
    body: {
      title: string;
      mimeType: string;
      sizeBytes: number;
      entityType?: string;
      entityId?: string;
    },
  ) {
    const allowed = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    if (!allowed.includes(body.mimeType)) {
      throw new AppError(ErrorCodes.VALIDATION, 'MIME type not allowed', 400);
    }
    if (body.sizeBytes > 25 * 1024 * 1024) {
      throw new AppError(ErrorCodes.VALIDATION, 'File too large', 400);
    }
    const reference = await this.numbers.next('DOCUMENT');
    const objectKey = `uploads/${user.id}/${randomUUID()}`;
    const doc = await this.prisma.document.create({
      data: {
        reference,
        title: body.title,
        mimeType: body.mimeType,
        sizeBytes: body.sizeBytes,
        storageKey: objectKey,
        status: 'PENDING_UPLOAD',
        entityType: body.entityType,
        entityId: body.entityId,
        uploadedById: user.id,
      },
    });
    const endpoint = this.config.get('S3_ENDPOINT', 'http://localhost:9000');
    const bucket = this.config.get('S3_BUCKET', 'saru-documents');
    return {
      documentId: doc.id,
      reference,
      uploadUrl: `${endpoint}/${bucket}/${objectKey}`,
      method: 'PUT',
      headers: { 'Content-Type': body.mimeType },
      expiresInSeconds: 900,
    };
  }

  @Post('complete-upload')
  @RequirePermissions('documents:create')
  async complete(@Body() body: { documentId: string; checksum?: string }) {
    const doc = await this.prisma.document.update({
      where: { id: body.documentId },
      data: { status: 'AVAILABLE', checksum: body.checksum },
    });
    await this.prisma.documentVersion.create({
      data: {
        documentId: doc.id,
        versionNo: 1,
        storageKey: doc.storageKey,
        sizeBytes: doc.sizeBytes,
        checksum: body.checksum,
      },
    });
    return doc;
  }

  @Get()
  @RequirePermissions('documents:view')
  async list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('q') q?: string,
  ) {
    const p = normalizePage({
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
    });
    const where = q
      ? {
          OR: [
            { reference: { contains: q, mode: 'insensitive' as const } },
            { title: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {};
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.document.findMany({
        where,
        skip: p.skip,
        take: p.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.document.count({ where }),
    ]);
    return toPaginated(
      rows.map((d) => ({
        id: d.id,
        reference: d.reference,
        title: d.title,
        status: String(d.status).toLowerCase(),
        mimeType: d.mimeType,
        sizeBytes: d.sizeBytes,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
      })),
      total,
      p.page,
      p.pageSize,
    );
  }

  @Get('templates')
  @RequirePermissions('templates:view')
  templates() {
    return toPaginated(
      [
        {
          id: 'tpl-delivery-challan',
          name: 'Delivery challan',
          category: 'fulfilment',
          format: 'pdf',
          status: 'active',
        },
        {
          id: 'tpl-goods-receipt',
          name: 'Goods receipt note',
          category: 'imports',
          format: 'pdf',
          status: 'active',
        },
        {
          id: 'tpl-invoice',
          name: 'Commercial invoice',
          category: 'finance',
          format: 'pdf',
          status: 'active',
        },
      ],
      3,
      1,
      20,
    );
  }

  @Get(':id')
  @RequirePermissions('documents:view')
  async get(@Param('id') id: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: { versions: true },
    });
    if (!doc)
      throw new AppError(ErrorCodes.NOT_FOUND, 'Document not found', 404);
    return doc;
  }

  @Get(':id/download')
  @RequirePermissions('documents:view')
  async download(@Param('id') id: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc || doc.status !== 'AVAILABLE')
      throw new AppError(ErrorCodes.NOT_FOUND, 'Document not available', 404);
    const endpoint = this.config.get('S3_ENDPOINT', 'http://localhost:9000');
    const bucket = this.config.get('S3_BUCKET', 'saru-documents');
    return {
      url: `${endpoint}/${bucket}/${doc.storageKey}`,
      expiresInSeconds: 300,
    };
  }
}

@Module({ controllers: [DocumentsController] })
export class DocumentsModule {}
