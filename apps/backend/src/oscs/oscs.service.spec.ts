import { Test, TestingModule } from '@nestjs/testing';
import { OscsService } from './oscs.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

describe('OscsService', () => {
  const oscBase = {
    id: 'osc-123',
    name: 'OSC Test',
    description: 'A test OSC',
    email: 'osc@test.com',
    phone: null as string | null,
    status: 'AVAILABLE' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Raw Prisma return (includes _count from include clause)
  const mockOscRaw = { ...oscBase, _count: { projects: 2 } };

  // Mapped service output (replaces _count with projectCount)
  const mockOsc = { ...oscBase, projectCount: 2 };

  let service: OscsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OscsService,
        {
          provide: PrismaService,
          useValue: {
            osc: {
              findMany: jest.fn(),
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<OscsService>(OscsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    const includeProjects = {
      include: { _count: { select: { projects: true } } },
    };

    it('should return all OSCs for COORDINATOR', async () => {
      const findManySpy = jest
        .spyOn(prisma.osc, 'findMany')
        .mockResolvedValue([mockOscRaw]);

      const result = await service.findAll('COORDINATOR');

      expect(findManySpy).toHaveBeenCalledWith({
        where: {},
        ...includeProjects,
      });
      expect(result).toEqual([mockOsc]);
    });

    it('should return all OSCs for ADMIN', async () => {
      const findManySpy = jest
        .spyOn(prisma.osc, 'findMany')
        .mockResolvedValue([mockOscRaw]);

      const result = await service.findAll('ADMIN');

      expect(findManySpy).toHaveBeenCalledWith({
        where: {},
        ...includeProjects,
      });
      expect(result).toEqual([mockOsc]);
    });

    it('should return only AVAILABLE OSCs for STUDENT', async () => {
      const findManySpy = jest
        .spyOn(prisma.osc, 'findMany')
        .mockResolvedValue([mockOscRaw]);

      const result = await service.findAll('STUDENT');

      expect(findManySpy).toHaveBeenCalledWith({
        where: { status: 'AVAILABLE' },
        ...includeProjects,
      });
      expect(result).toEqual([mockOsc]);
    });
  });

  describe('create', () => {
    it('should create and return an OSC', async () => {
      jest.spyOn(prisma.osc, 'create').mockResolvedValue(mockOsc);

      const result = await service.create({
        name: 'OSC Test',
        description: 'A test OSC',
        email: 'osc@test.com',
      });

      expect(result).toEqual(mockOsc);
    });

    it('should throw ConflictException when name already exists', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '6.0.0' },
      );
      jest.spyOn(prisma.osc, 'create').mockRejectedValue(prismaError);

      await expect(
        service.create({ name: 'OSC Test', description: 'A test OSC' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should return an OSC by id', async () => {
      const findUniqueSpy = jest
        .spyOn(prisma.osc, 'findUnique')
        .mockResolvedValue(mockOsc);

      const result = await service.findOne('osc-123');

      expect(findUniqueSpy).toHaveBeenCalledWith({
        where: { id: 'osc-123' },
      });
      expect(result).toEqual(mockOsc);
    });

    it('should throw NotFoundException when OSC does not exist', async () => {
      jest.spyOn(prisma.osc, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update and return the OSC', async () => {
      const updatedRaw = { ...mockOscRaw, name: 'Updated Name' };
      const updatedMapped = { ...mockOsc, name: 'Updated Name' };
      const updateSpy = jest
        .spyOn(prisma.osc, 'update')
        .mockResolvedValue(updatedRaw);

      const result = await service.update('osc-123', { name: 'Updated Name' });

      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: 'osc-123' },
        data: { name: 'Updated Name' },
        include: { _count: { select: { projects: true } } },
      });
      expect(result).toEqual(updatedMapped);
    });

    it('should throw NotFoundException when OSC does not exist', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        { code: 'P2025', clientVersion: '6.0.0' },
      );
      jest.spyOn(prisma.osc, 'update').mockRejectedValue(prismaError);

      await expect(
        service.update('nonexistent', { status: 'BLOCKED' as const }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when name already exists', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '6.0.0' },
      );
      jest.spyOn(prisma.osc, 'update').mockRejectedValue(prismaError);

      await expect(
        service.update('osc-123', { name: 'Duplicate Name' }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
