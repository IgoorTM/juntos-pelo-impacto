import { Test, TestingModule } from '@nestjs/testing';
import { OscsService } from './oscs.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

describe('OscsService', () => {
  const mockOsc = {
    id: 'osc-123',
    name: 'OSC Test',
    description: 'A test OSC',
    email: 'osc@test.com',
    phone: null,
    status: 'AVAILABLE' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

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
    it('should return all OSCs for COORDINATOR', async () => {
      jest.spyOn(prisma.osc, 'findMany').mockResolvedValue([mockOsc]);

      const result = await service.findAll('COORDINATOR');

      expect(prisma.osc.findMany).toHaveBeenCalledWith({ where: {} });
      expect(result).toEqual([mockOsc]);
    });

    it('should return all OSCs for ADMIN', async () => {
      jest.spyOn(prisma.osc, 'findMany').mockResolvedValue([mockOsc]);

      const result = await service.findAll('ADMIN');

      expect(prisma.osc.findMany).toHaveBeenCalledWith({ where: {} });
      expect(result).toEqual([mockOsc]);
    });

    it('should return only AVAILABLE OSCs for STUDENT', async () => {
      jest.spyOn(prisma.osc, 'findMany').mockResolvedValue([mockOsc]);

      const result = await service.findAll('STUDENT');

      expect(prisma.osc.findMany).toHaveBeenCalledWith({ where: { status: 'AVAILABLE' } });
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
});
