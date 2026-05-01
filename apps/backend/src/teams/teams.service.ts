import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  generateUniqueCode(): string {
    let code = '';
    for (let i = 0; i < CODE_LENGTH; i++) {
      code += CODE_CHARSET[Math.floor(Math.random() * CODE_CHARSET.length)];
    }
    return code;
  }

  async joinTeam(userId: string, code: string) {
    const team = await this.prisma.team.findUnique({
      where: { code },
      include: {
        project: { select: { id: true, name: true } },
        members: { include: { user: { select: { id: true, name: true } } } },
      },
    });
    if (!team) throw new NotFoundException('Team not found');

    try {
      await this.prisma.teamMember.create({
        data: { teamId: team.id, userId },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('Already a member of this team');
      }
      throw e;
    }

    const updated = await this.prisma.team.findUnique({
      where: { id: team.id },
      include: {
        project: { select: { id: true, name: true } },
        members: { include: { user: { select: { id: true, name: true } } } },
      },
    });
    if (!updated) throw new NotFoundException('Team not found');

    return {
      id: updated.id,
      semester: updated.semester,
      code: updated.code,
      project: updated.project,
      members: updated.members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
      })),
    };
  }
}
