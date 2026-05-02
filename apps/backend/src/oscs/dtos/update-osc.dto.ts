import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { OscStatus } from '@prisma/client';

export class UpdateOscDto {
  @ApiPropertyOptional({
    example: 'Associação Comunitária Vila Verde',
    description: 'OSC name (must be unique)',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({
    example: 'Educação',
    description: 'Area of activity / category of the OSC',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  category?: string;

  @ApiPropertyOptional({
    example: 'Organization focused on community development and education',
    description: 'Detailed description of the OSC',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @ApiPropertyOptional({
    example: 'contact@villaverde.org',
    description: 'Contact email address',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: '+55 11 98765-4321',
    description: 'Contact phone number',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    enum: Object.values(OscStatus),
    example: 'AVAILABLE',
    description: 'Current status of the OSC',
  })
  @IsOptional()
  @IsEnum(OscStatus)
  status?: OscStatus;
}
