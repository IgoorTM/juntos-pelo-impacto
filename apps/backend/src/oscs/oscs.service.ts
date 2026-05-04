import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OscStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOscDto } from './dtos/create-osc.dto';
import { ListOscsQueryDto } from './dtos/list-oscs-query.dto';
import { UpdateOscDto } from './dtos/update-osc.dto';

@Injectable()
export class OscsService {
  constructor(private prisma: PrismaService) {}

  async findAll(role: string, query: ListOscsQueryDto) {
    const { page = 1, limit = 10, search, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.OscWhereInput = {};

    if (role === 'STUDENT') {
      where.status = OscStatus.AVAILABLE;
    } else if (status) {
      where.status = status;
    }

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [oscs, total] = await Promise.all([
      this.prisma.osc.findMany({
        where,
        include: { _count: { select: { projects: true } } },
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.osc.count({ where }),
    ]);

    return {
      data: oscs.map(({ _count, ...osc }) => ({
        ...osc,
        projectCount: _count.projects,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
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
