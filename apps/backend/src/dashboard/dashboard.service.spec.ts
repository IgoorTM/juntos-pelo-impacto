import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DashboardService', () => {
  let module: TestingModule;
  let service: DashboardService;
  let prisma: PrismaService;

  const CURRENT_SEMESTER = (() => {
    const now = new Date();
    const semester = now.getUTCMonth() < 6 ? 1 : 2;
    return `${now.getUTCFullYear()}-${semester}`;
  })();

  const PREVIOUS_SEMESTER = (() => {
    const now = new Date();
    const month = now.getUTCMonth();
    if (month < 6) {
      return `${now.getUTCFullYear() - 1}-2`;
    }
    return `${now.getUTCFullYear()}-1`;
  })();

  const mockAppConfig = {
    id: 1,
    signUpEnabled: false,
    updatedAt: new Date('2025-03-01T10:00:00.000Z'),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: PrismaService,
          useValue: {
            osc: { count: jest.fn() },
            project: { count: jest.fn(), findMany: jest.fn() },
            appConfig: { findFirst: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboard', () => {
    beforeEach(() => {
      jest.spyOn(prisma.osc, 'count').mockImplementation(((args?: {
        where?: { status?: string };
      }) => {
        if (!args?.where) return Promise.resolve(12);
        if (args.where.status === 'IN_PROGRESS') return Promise.resolve(3);
        return Promise.resolve(9);
      }) as any);
      jest.spyOn(prisma.project, 'count').mockResolvedValue(3);
      jest
        .spyOn(prisma.appConfig, 'findFirst')
        .mockResolvedValue(mockAppConfig);
    });

    it('returns all metrics and signUp state', async () => {
      jest.spyOn(prisma.project, 'findMany').mockResolvedValue([]);

      const result = await service.getDashboard();

      expect(result.totalOscs).toBe(12);
      expect(result.activeProjects).toBe(3);
      expect(result.blockedOscs).toBe(3);
      expect(result.availableOscs).toBe(9);
      expect(result.signUp.enabled).toBe(false);
      expect(result.signUp.updatedAt).toEqual(mockAppConfig.updatedAt);
    });

    it('counts pendingProjects when latest team semester is before current', async () => {
      jest.spyOn(prisma.project, 'findMany').mockResolvedValue([
        {
          id: 'proj-1',
          name: 'Projeto Antigo',
          oscId: 'osc-1',
          status: 'IN_PROGRESS' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          teams: [
            {
              id: 'team-1',
              projectId: 'proj-1',
              semester: PREVIOUS_SEMESTER,
              code: 'ABCDEF',
              createdBy: 'user-1',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        },
      ] as any);

      const result = await service.getDashboard();

      expect(result.pendingProjects).toBe(1);
    });

    it('does not count as pending when latest team semester is current', async () => {
      jest.spyOn(prisma.project, 'findMany').mockResolvedValue([
        {
          id: 'proj-2',
          name: 'Projeto Atual',
          oscId: 'osc-2',
          status: 'IN_PROGRESS' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          teams: [
            {
              id: 'team-2',
              projectId: 'proj-2',
              semester: CURRENT_SEMESTER,
              code: 'XYZABC',
              createdBy: 'user-1',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        },
      ] as any);

      const result = await service.getDashboard();

      expect(result.pendingProjects).toBe(0);
    });

    it('returns pendingProjects = 0 when there are no IN_PROGRESS projects', async () => {
      jest.spyOn(prisma.project, 'count').mockResolvedValue(0);
      jest.spyOn(prisma.project, 'findMany').mockResolvedValue([]);

      const result = await service.getDashboard();

      expect(result.pendingProjects).toBe(0);
      expect(result.activeProjects).toBe(0);
    });

    it('throws InternalServerErrorException when AppConfig is missing', async () => {
      jest.spyOn(prisma.appConfig, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.project, 'findMany').mockResolvedValue([]);

      await expect(service.getDashboard()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
