import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CreateLeadDto } from './dto/create-lead.dto.js';
import { ListLeadsDto } from './dto/list-leads.dto.js';
import { UpdateStatusDto } from './dto/update-status.dto.js';
import { LeadsService } from './leads.service.js';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  /** Público: formulario de solicitud. Respuesta mínima, sin exponer datos. */
  @Post()
  @HttpCode(201)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async create(@Body() dto: CreateLeadDto) {
    const lead = await this.leads.create(dto);
    return { id: lead.id, message: 'Solicitud recibida' };
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() query: ListLeadsDto) {
    return this.leads.findAll(query.coordination);
  }

  @UseGuards(JwtAuthGuard)
  @Get('stats')
  stats() {
    return this.leads.stats();
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.leads.updateStatus(id, dto.status);
  }
}
