import { ApiProperty } from '@nestjs/swagger';

export class SignUpStatusDto {
  @ApiProperty({ example: true, description: 'Whether public sign-up is enabled' })
  enabled!: boolean;

  @ApiProperty({ example: '2025-03-01T10:00:00.000Z', description: 'Last toggle timestamp' })
  updatedAt!: Date;
}

export class DashboardResponseDto {
  @ApiProperty({ example: 12, description: 'Total number of registered OSCs' })
  totalOscs!: number;

  @ApiProperty({ example: 3, description: 'Projects with status IN_PROGRESS' })
  activeProjects!: number;

  @ApiProperty({ example: 3, description: 'OSCs with status IN_PROGRESS (in use by an active project)' })
  blockedOscs!: number;

  @ApiProperty({ example: 9, description: 'OSCs with status AVAILABLE' })
  availableOscs!: number;

  @ApiProperty({ example: 1, description: 'IN_PROGRESS projects whose latest team belongs to a previous semester' })
  pendingProjects!: number;

  @ApiProperty({ type: SignUpStatusDto, description: 'Current state of public sign-up toggle' })
  signUp!: SignUpStatusDto;
}
