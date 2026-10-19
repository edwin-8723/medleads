import { IsEnum } from 'class-validator';
import { LeadStatus } from '../lead.enums.js';

export class UpdateStatusDto {
  @IsEnum(LeadStatus, { message: 'Estado no válido' })
  status: LeadStatus;
}
