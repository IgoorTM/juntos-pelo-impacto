import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOscDto } from './dtos/create-osc.dto';
import { UpdateOscDto } from './dtos/update-osc.dto';

@Injectable()
export class OscsService {
  constructor(private prisma: PrismaService) {}

  async findAll(role: string) {
    const where = role === 'STUDENT' ? { status: 'AVAILABLE' as const } : {};
    const oscs = await this.prisma.osc.findMany({
      where,
      include: { _count: { select: { projects: true } } },
    });
    return oscs.map(({ _count, ...osc }) => ({
      ...osc,
      projectCount: _count.projects,
    }));
  }

  async create(dto: CreateOscDto) {
    try {
      return await this.prisma.osc.create({ data: dto });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('OSC name already registered');
      }
      throw e;
    }
  }

  async findOne(id: string) {
    const osc = await this.prisma.osc.findUnique({ where: { id } });
    if (!osc) throw new NotFoundException('OSC not found');
    return osc;
  }

  async update(id: string, dto: UpdateOscDto) {
    try {
      const osc = await this.prisma.osc.update({
        where: { id },
        data: dto,
        include: { _count: { select: { projects: true } } },
      });
      const { _count, ...rest } = osc;
      return { ...rest, projectCount: _count.projects };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025') throw new NotFoundException('OSC not found');
        if (e.code === 'P2002')
          throw new ConflictException('OSC name already registered');
      }
      throw e;
    }
  }
}
