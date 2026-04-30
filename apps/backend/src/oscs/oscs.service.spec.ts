import { Test, TestingModule } from '@nestjs/testing';
import { OscsService } from './oscs.service';
import { PrismaService } from '../prisma/prisma.service';

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
});
