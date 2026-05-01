import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ProjectStatus } from '@prisma/client';

export class UpdateProjectStatusDto {
  @ApiProperty({
    enum: ProjectStatus,
    description: 'New status for the project',
  })
  @IsEnum(ProjectStatus)
  status: ProjectStatus;
}
