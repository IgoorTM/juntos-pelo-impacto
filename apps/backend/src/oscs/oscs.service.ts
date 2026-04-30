import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOscDto } from './dtos/create-osc.dto';
import { UpdateOscDto } from './dtos/update-osc.dto';

@Injectable()
export class OscsService {
  constructor(private prisma: PrismaService) {}

  async findAll(role: string) {
    const where = role === 'STUDENT' ? { status: 'AVAILABLE' as const } : {};
    return this.prisma.osc.findMany({ where });
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
      return await this.prisma.osc.update({ where: { id }, data: dto });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025') throw new NotFoundException('OSC not found');
        if (e.code === 'P2002') throw new ConflictException('OSC name already registered');
      }
      throw e;
    }
  }
}
