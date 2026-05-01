import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProjectStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TeamsService } from '../teams/teams.service';
import { getCurrentSemester } from '../common/get-current-semester';
import { CreateProjectDto } from './dtos/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private teamsService: TeamsService,
  ) {}

  private readonly projectInclude = {
    osc: { select: { id: true, name: true } },
    teams: {
      orderBy: { createdAt: 'desc' as const },
      include: {
        members: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
    },
  } as const;

  private mapProject(project: any) {
    return {
      id: project.id,
      name: project.name,
      status: project.status,
      osc: project.osc,
      teams: project.teams.map((team: any) => ({
        id: team.id,
        semester: team.semester,
        code: team.code,
        members: team.members.map((m: any) => ({
          id: m.user.id,
          name: m.user.name,
        })),
      })),
    };
  }

  async findAll() {
    const projects = await this.prisma.project.findMany({
      include: this.projectInclude,
    });
    return projects.map((p) => this.mapProject(p));
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: this.projectInclude,
    });
    if (!project) throw new NotFoundException('Project not found');
    return this.mapProject(project);
  }

  async updateStatus(id: string, status: ProjectStatus) {
    try {
      const project = await this.prisma.project.update({
        where: { id },
        data: { status },
        include: this.projectInclude,
      });
      return this.mapProject(project);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025') throw new NotFoundException('Project not found');
        if (e.code === 'P2002') {
          throw new ConflictException('Unique constraint violation');
        }
      }
      throw e;
    }
  }

  async create(userId: string, dto: CreateProjectDto) {
    const MAX_CODE_ATTEMPTS = 5;

    const creator = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    });

    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
      const code = this.teamsService.generateUniqueCode();
      const semester = getCurrentSemester();

      try {
        return await this.prisma.$transaction(async (tx) => {
          const osc = await tx.osc.findUnique({ where: { id: dto.oscId } });
          if (!osc) throw new NotFoundException('OSC not found');
          if (osc.status !== 'AVAILABLE') {
            throw new ConflictException('OSC is not available');
          }

          const project = await tx.project.create({
            data: { name: dto.name, oscId: dto.oscId },
          });

          const team = await tx.team.create({
            data: {
              projectId: project.id,
              semester,
              code,
              createdBy: userId,
            },
          });

          await tx.teamMember.create({ data: { teamId: team.id, userId } });
          await tx.osc.update({
            where: { id: dto.oscId },
            data: { status: 'IN_PROGRESS' },
          });

          return {
            id: project.id,
            name: project.name,
            status: project.status,
            osc: { id: osc.id, name: osc.name },
            teams: [
              {
                id: team.id,
                semester: team.semester,
                code: team.code,
                members: [{ id: creator.id, name: creator.name }],
              },
            ],
          };
        });
      } catch (e) {
        if (e instanceof NotFoundException || e instanceof ConflictException) {
          throw e;
        }
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2002'
        ) {
          const targets = ([] as string[]).concat(
            (e.meta?.target as string | string[]) ?? [],
          );
          if (targets.some((t) => t.includes('code'))) {
            continue;
          }
          throw new ConflictException('Project name already registered');
        }
        throw e;
      }
    }

    throw new InternalServerErrorException(
      'Failed to generate a unique team code',
    );
  }
}
