import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOscDto } from './dtos/create-osc.dto';
import { UpdateOscDto } from './dtos/update-osc.dto';

@Injectable()
export class OscsService {
  constructor(private prisma: PrismaService) {}

  async findAll(role: string) {
    return [];
  }

  async create(dto: CreateOscDto) {
    return null;
  }

  async findOne(id: string) {
    return null;
  }

  async update(id: string, dto: UpdateOscDto) {
    return null;
  }
}
