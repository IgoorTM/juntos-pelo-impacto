import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { DashboardService } from './dashboard.service';
import { DashboardResponseDto } from './dtos/dashboard-response.dto';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get()
  @Roles('COORDINATOR')
  @ApiOperation({
    summary: 'Painel do coordenador: metricas, alertas e config (COORDINATOR)',
  })
  @ApiResponse({ status: 200, type: DashboardResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getDashboard() {
    return this.dashboardService.getDashboard();
  }
}
