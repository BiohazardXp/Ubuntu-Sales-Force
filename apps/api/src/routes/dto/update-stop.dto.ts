import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { StopStatus } from '@prisma/client';

export class UpdateStopDto {
  @IsEnum(StopStatus)
  status: StopStatus;

  @IsDateString() @IsOptional()
  visitedAt?: string;

  @IsNumber() @IsOptional()
  lat?: number;

  @IsNumber() @IsOptional()
  lng?: number;

  @IsString() @IsOptional()
  notes?: string;
}
