import { Body, Controller, Get, Module, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import type { AuthUserContext } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { NumberSequenceService } from '../numbering/number-sequence.service';
import { AppError, ErrorCodes } from '../common/errors/app-error';
import { ConfigService } from '@nestjs/config';

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
  async list() {
    const data = await this.prisma.document.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return { data };
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
