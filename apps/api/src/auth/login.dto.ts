import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MaxLength(200)
  password: string;
}
