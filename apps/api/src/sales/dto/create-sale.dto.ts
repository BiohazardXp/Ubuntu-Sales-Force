import {
  IsNotEmpty, IsNumber, IsOptional, IsString, IsPositive, Min,
} from 'class-validator';

export class CreateSaleDto {
  @IsString() @IsNotEmpty()
  product: string;

  @IsNumber() @IsPositive()
  quantity: number;

  @IsNumber() @Min(0)
  unitPrice: number;

  @IsString() @IsOptional()
  stopId?: string;

  @IsNumber() @IsOptional()
  lat?: number;

  @IsNumber() @IsOptional()
  lng?: number;

  @IsString() @IsOptional()
  notes?: string;

  @IsString() @IsOptional()
  receiptUrl?: string;

  // Client-generated ID for offline deduplication
  @IsString() @IsOptional()
  localId?: string;
}
