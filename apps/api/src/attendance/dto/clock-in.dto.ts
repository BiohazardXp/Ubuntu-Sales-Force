import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class ClockInDto {
  @IsDateString()
  @IsOptional()
  clockIn?: string; // ISO string — defaults to now() if omitted

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
