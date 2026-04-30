import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class JoinTeamDto {
  @ApiProperty({
    example: 'ABCDEF',
    description: 'Team code — 6 characters, charset A-Z (no I/O) and 2-9 (no 0/1)',
  })
  @IsString()
  @Length(6, 6)
  code: string;
}
