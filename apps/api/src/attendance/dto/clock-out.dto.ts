import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class ClockOutDto {
  @IsDateString()
  @IsOptional()
  clockOut?: string;

  @IsNumber()
  @IsOptional()
  lat?: number;

  @IsNumber()
  @IsOptional()
  lng?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
