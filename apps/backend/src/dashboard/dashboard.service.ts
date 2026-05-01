import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getCurrentSemester } from '../common/get-current-semester';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    const currentSemester = getCurrentSemester();

    const [totalOscs, activeProjects, blockedOscs, availableOscs, rawProjects, appConfig] =
      await Promise.all([
        this.prisma.osc.count(),
        this.prisma.project.count({ where: { status: 'IN_PROGRESS' } }),
        this.prisma.osc.count({ where: { status: 'IN_PROGRESS' } }),
        this.prisma.osc.count({ where: { status: 'AVAILABLE' } }),
        this.prisma.project.findMany({
          where: { status: 'IN_PROGRESS' },
          include: {
            teams: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        }),
        this.prisma.appConfig.findFirst(),
      ]);

    if (!appConfig) {
      throw new InternalServerErrorException('AppConfig not found');
    }

    const pendingProjects = rawProjects.filter(
      (p) => p.teams.length > 0 && p.teams[0].semester !== currentSemester,
    ).length;

    return {
      totalOscs,
      activeProjects,
      blockedOscs,
      availableOscs,
      pendingProjects,
      signUp: {
        enabled: appConfig.signUpEnabled,
        updatedAt: appConfig.updatedAt,
      },
    };
  }
}
