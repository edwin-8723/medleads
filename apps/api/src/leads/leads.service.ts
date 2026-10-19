import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateLeadDto } from './dto/create-lead.dto.js';
import { Lead } from './lead.entity.js';
import {
  ALLOWED_TRANSITIONS,
  Coordination,
  LeadStatus,
} from './lead.enums.js';

export function normalizeCountry(country: string): string {
  return country
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/** Colombia → Coordinación Nacional; cualquier otro país → Internacional. */
export function assignCoordination(country: string): Coordination {
  return normalizeCountry(country) === 'colombia'
    ? Coordination.NACIONAL
    : Coordination.INTERNACIONAL;
}

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead) private readonly repo: Repository<Lead>,
  ) {}

  create(dto: CreateLeadDto): Promise<Lead> {
    const lead = this.repo.create({
      fullName: dto.fullName,
      email: dto.email.toLowerCase(),
      phone: dto.phone,
      country: dto.country,
      procedure: dto.procedure,
      message: dto.message || null,
      coordination: assignCoordination(dto.country),
      status: LeadStatus.NUEVO,
    });
    return this.repo.save(lead);
  }

  findAll(coordination?: Coordination): Promise<Lead[]> {
    return this.repo.find({
      where: coordination ? { coordination } : {},
      order: { createdAt: 'DESC' },
    });
  }

  async stats(): Promise<{
    total: number;
    nacional: number;
    internacional: number;
  }> {
    const rows = await this.repo
      .createQueryBuilder('l')
      .select('l.coordination', 'coordination')
      .addSelect('COUNT(*)', 'count')
      .groupBy('l.coordination')
      .getRawMany<{ coordination: Coordination; count: string }>();
    const get = (c: Coordination) =>
      Number(rows.find((r) => r.coordination === c)?.count ?? 0);
    const nacional = get(Coordination.NACIONAL);
    const internacional = get(Coordination.INTERNACIONAL);
    return { total: nacional + internacional, nacional, internacional };
  }

  async updateStatus(id: string, next: LeadStatus): Promise<Lead> {
    const lead = await this.repo.findOneBy({ id });
    if (!lead) throw new NotFoundException('Solicitud no encontrada');
    if (!ALLOWED_TRANSITIONS[lead.status].includes(next)) {
      throw new BadRequestException(
        `No se puede pasar de ${lead.status} a ${next}`,
      );
    }
    lead.status = next;
    return this.repo.save(lead);
  }
}
