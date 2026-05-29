import {
  IsArray, IsDateString, IsNotEmpty, IsNumber,
  IsOptional, IsString, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStopDto {
  @IsString() @IsNotEmpty()
  customerName: string;

  @IsString() @IsNotEmpty()
  address: string;

  @IsNumber() @IsOptional()
  lat?: number;

  @IsNumber() @IsOptional()
  lng?: number;

  @IsNumber()
  order: number;

  @IsString() @IsOptional()
  notes?: string;
}

export class CreateRouteDto {
  @IsString() @IsNotEmpty()
  userId: string; // which rep this route is assigned to

  @IsDateString()
  date: string;

  @IsString() @IsOptional()
  name?: string;

  @IsString() @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStopDto)
  stops: CreateStopDto[];
}
