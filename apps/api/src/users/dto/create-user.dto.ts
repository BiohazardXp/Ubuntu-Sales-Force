import {
  IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength,
} from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @IsString() @IsNotEmpty()
  username: string;

  @IsEmail()
  email: string;

  @IsString() @MinLength(6)
  password: string;

  @IsString() @IsNotEmpty()
  firstName: string;

  @IsString() @IsNotEmpty()
  lastName: string;

  @IsString() @IsOptional()
  phone?: string;

  @IsEnum(Role) @IsOptional()
  role?: Role;

  @IsString() @IsOptional()
  territory?: string;

  // Set programmatically by the service — not from the request body directly
  @IsString() @IsOptional()
  companyId?: string;
}
