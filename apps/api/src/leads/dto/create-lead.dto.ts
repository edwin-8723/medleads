import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateLeadDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'El nombre completo es obligatorio' })
  @MaxLength(120)
  fullName: string;

  @Transform(trim)
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @MaxLength(160)
  email: string;

  @Transform(trim)
  @IsString()
  @Matches(/^\+?[0-9\s\-()]{7,20}$/, {
    message: 'El teléfono no es válido (7 a 20 dígitos)',
  })
  phone: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'El país es obligatorio' })
  @MaxLength(80)
  country: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'El procedimiento de interés es obligatorio' })
  @MaxLength(120)
  procedure: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(2000)
  message?: string;
}
