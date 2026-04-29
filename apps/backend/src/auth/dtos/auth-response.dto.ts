import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({
    type: 'object',
    properties: {
      id: { type: 'string', example: 'user-123' },
      email: { type: 'string', example: 'user@example.com' },
      role: {
        type: 'string',
        enum: ['STUDENT', 'COORDINATOR', 'ADMIN'],
        example: 'STUDENT',
      },
      name: { type: 'string', example: 'User Name' },
    },
  })
  user: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}
