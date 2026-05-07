import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { OscCategory } from '@prisma/client';

export class CreateOscDto {
  @ApiProperty({
    example: 'Associação Comunitária Vila Verde',
    description: 'OSC name (must be unique)',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    enum: Object.values(OscCategory),
    example: OscCategory.EDUCACAO,
    description: 'Area of activity / category of the OSC',
  })
  @IsOptional()
  @IsEnum(OscCategory)
  category?: OscCategory;

  @ApiProperty({
    example: 'Organization focused on community development and education',
    description: 'Detailed description of the OSC',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

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
}
