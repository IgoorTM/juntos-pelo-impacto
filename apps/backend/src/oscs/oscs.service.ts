import { ConflictException, Injectable } from '@nestjs/common';
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
    return null;
  }

  async update(id: string, dto: UpdateOscDto) {
    return null;
  }
}
