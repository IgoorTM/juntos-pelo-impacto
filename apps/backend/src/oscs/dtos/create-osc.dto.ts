import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateOscDto {
  @ApiProperty({
    example: 'Associação Comunitária Vila Verde',
    description: 'OSC name (must be unique)',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'Educação',
    description: 'Area of activity / category of the OSC',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  category?: string;

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
