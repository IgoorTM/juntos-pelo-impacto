import { Body, Controller, Post, Request } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { TeamsService } from './teams.service';
import { JoinTeamDto } from './dtos/join-team.dto';

interface AuthenticatedRequest extends ExpressRequest {
  user: { userId: string; email: string; role: string };
}

@ApiTags('teams')
@ApiBearerAuth()
@Controller('teams')
export class TeamsController {
  constructor(private teamsService: TeamsService) {}

  @Post('join')
  @Roles('STUDENT')
  @ApiOperation({
    summary: 'Aluno entra em equipe existente pelo codigo de 6 caracteres',
  })
  @ApiResponse({
    status: 200,
    description: 'Entrada na equipe realizada com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Equipe nao encontrada' })
  @ApiResponse({ status: 409, description: 'Aluno ja e membro desta equipe' })
  @ApiResponse({ status: 422, description: 'Validacao falhou' })
  joinTeam(@Request() req: AuthenticatedRequest, @Body() dto: JoinTeamDto) {
    return this.teamsService.joinTeam(req.user.userId, dto.code);
  }
}
