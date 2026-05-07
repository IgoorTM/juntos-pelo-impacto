import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dtos/create-project.dto';
import { ListProjectsQueryDto } from './dtos/list-projects-query.dto';
import { UpdateProjectStatusDto } from './dtos/update-project-status.dto';

interface AuthenticatedRequest extends ExpressRequest {
  user: { userId: string; email: string; role: string };
}

@ApiTags('projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Post()
  @Roles('STUDENT')
  @ApiOperation({
    summary: 'Cria projeto com equipe do semestre atual (STUDENT)',
  })
  @ApiResponse({ status: 201, description: 'Projeto criado com sucesso' })
  @ApiResponse({ status: 404, description: 'OSC nao encontrada' })
  @ApiResponse({
    status: 409,
    description: 'OSC nao disponivel ou nome duplicado',
  })
  @ApiResponse({ status: 422, description: 'Validacao falhou' })
  create(@Request() req: AuthenticatedRequest, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(req.user.userId, dto);
  }

  @Get()
  @Roles('COORDINATOR', 'STUDENT')
  @ApiOperation({
    summary:
      'Lista projetos paginados com filtros (COORDINATOR: todos; STUDENT: apenas seus projetos)',
  })
  @ApiResponse({
    status: 200,
    description: 'Página de projetos com envelope de paginação',
  })
  findAll(
    @Query() query: ListProjectsQueryDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.projectsService.findAll(query, req.user.userId, req.user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retorna detalhe de um projeto (autenticado)' })
  @ApiResponse({ status: 200, description: 'Projeto encontrado' })
  @ApiResponse({ status: 404, description: 'Nao encontrado' })
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id/status')
  @Roles('COORDINATOR')
  @ApiOperation({ summary: 'Define status do projeto (COORDINATOR)' })
  @ApiResponse({ status: 200, description: 'Status atualizado' })
  @ApiResponse({ status: 404, description: 'Projeto nao encontrado' })
  @ApiResponse({ status: 409, description: 'Conflito de unicidade' })
  @ApiResponse({ status: 422, description: 'Validacao falhou' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateProjectStatusDto) {
    return this.projectsService.updateStatus(id, dto.status);
  }
}
