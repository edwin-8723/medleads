import { IsEnum, IsOptional } from 'class-validator';
import { Coordination } from '../lead.enums.js';

export class ListLeadsDto {
  @IsOptional()
  @IsEnum(Coordination, { message: 'Coordinación no válida' })
  coordination?: Coordination;
}
