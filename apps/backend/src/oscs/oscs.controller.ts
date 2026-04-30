import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { OscsService } from './oscs.service';
import { CreateOscDto } from './dtos/create-osc.dto';
import { UpdateOscDto } from './dtos/update-osc.dto';
import { Roles } from '../auth/decorators/roles.decorator';

interface AuthenticatedRequest extends ExpressRequest {
  user: { userId: string; email: string; role: string };
}

@ApiTags('oscs')
@ApiBearerAuth()
@Controller('oscs')
export class OscsController {
  constructor(private oscsService: OscsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista OSCs (STUDENT vê apenas AVAILABLE)' })
  @ApiResponse({ status: 200, description: 'Lista de OSCs' })
  findAll(@Request() req: AuthenticatedRequest) {
    return this.oscsService.findAll(req.user.role);
  }

  @Post()
  @Roles('COORDINATOR')
  @ApiOperation({ summary: 'Cadastra nova OSC (COORDINATOR, ADMIN)' })
  @ApiResponse({ status: 201, description: 'OSC criada' })
  @ApiResponse({ status: 409, description: 'Nome já cadastrado' })
  @ApiResponse({ status: 422, description: 'Validação falhou' })
  create(@Body() dto: CreateOscDto) {
    return this.oscsService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retorna detalhes de uma OSC' })
  @ApiResponse({ status: 200, description: 'OSC encontrada' })
  @ApiResponse({ status: 404, description: 'Não encontrada' })
  findOne(@Param('id') id: string) {
    return this.oscsService.findOne(id);
  }

  @Patch(':id')
  @Roles('COORDINATOR')
  @ApiOperation({ summary: 'Atualiza dados de uma OSC (COORDINATOR, ADMIN)' })
  @ApiResponse({ status: 200, description: 'OSC atualizada' })
  @ApiResponse({ status: 404, description: 'Não encontrada' })
  @ApiResponse({ status: 409, description: 'Nome já cadastrado' })
  @ApiResponse({ status: 422, description: 'Validação falhou' })
  update(@Param('id') id: string, @Body() dto: UpdateOscDto) {
    return this.oscsService.update(id, dto);
  }
}
