import { IsArray, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class LocationPingDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;

  @IsNumber() @IsOptional()
  accuracy?: number;

  @IsNumber() @IsOptional()
  battery?: number;
}

export class BulkLocationDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LocationPingDto)
  pings: LocationPingDto[];
}
