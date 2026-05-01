import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';
import { TeamsService } from '../teams/teams.service';

describe('ProjectsService', () => {
  let module: TestingModule;
  let service: ProjectsService;
  let prisma: PrismaService;
  let teamsService: TeamsService;

  const mockOsc = {
    id: 'osc-1',
    name: 'OSC Test',
    description: 'Desc',
    email: null,
    phone: null,
    status: 'AVAILABLE' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProject = {
    id: 'proj-1',
    name: 'Projeto Test',
    oscId: 'osc-1',
    status: 'IN_PROGRESS' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTeam = {
    id: 'team-1',
    projectId: 'proj-1',
    semester: '2026-1',
    code: 'ABCDEF',
    createdBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCreator = {
    id: 'user-1',
    name: 'Aluno Test',
    email: 'aluno@test.com',
    role: 'STUDENT' as const,
    passwordHash: 'hash',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: PrismaService,
          useValue: {
            user: { findUnique: jest.fn() },
            osc: { findUnique: jest.fn(), update: jest.fn() },
            project: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            team: { create: jest.fn() },
            teamMember: { create: jest.fn() },
            $transaction: jest.fn(),
          },
        },
        {
          provide: TeamsService,
          useValue: { generateUniqueCode: jest.fn().mockReturnValue('ABCDEF') },
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    prisma = module.get<PrismaService>(PrismaService);
    teamsService = module.get<TeamsService>(TeamsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    beforeEach(() => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockCreator);
      (prisma.$transaction as jest.Mock).mockImplementation((fn) => fn(prisma));
    });

    it('throws NotFoundException when OSC does not exist', async () => {
      jest.spyOn(prisma.osc, 'findUnique').mockResolvedValue(null);

      await expect(
        service.create('user-1', { name: 'Proj', oscId: 'osc-1' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when OSC is not AVAILABLE', async () => {
      jest
        .spyOn(prisma.osc, 'findUnique')
        .mockResolvedValue({ ...mockOsc, status: 'IN_PROGRESS' as const });

      await expect(
        service.create('user-1', { name: 'Proj', oscId: 'osc-1' }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when project name is already registered', async () => {
      jest.spyOn(prisma.osc, 'findUnique').mockResolvedValue(mockOsc);
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '6.0.0', meta: { target: ['name'] } },
      );
      jest.spyOn(prisma.project, 'create').mockRejectedValue(prismaError);

      await expect(
        service.create('user-1', { name: 'Duplicado', oscId: 'osc-1' }),
      ).rejects.toThrow(ConflictException);
    });

    it('returns created project with osc, team, and creator as member on success', async () => {
      jest.spyOn(prisma.osc, 'findUnique').mockResolvedValue(mockOsc);
      jest.spyOn(prisma.project, 'create').mockResolvedValue(mockProject);
      jest.spyOn(prisma.team, 'create').mockResolvedValue(mockTeam);
      jest
        .spyOn(prisma.teamMember, 'create')
        .mockResolvedValue({ teamId: 'team-1', userId: 'user-1', joinedAt: new Date() });
      jest
        .spyOn(prisma.osc, 'update')
        .mockResolvedValue({ ...mockOsc, status: 'IN_PROGRESS' as const });

      const result = await service.create('user-1', {
        name: 'Projeto Test',
        oscId: 'osc-1',
      });

      expect(result.id).toBe('proj-1');
      expect(result.status).toBe('IN_PROGRESS');
      expect(result.osc).toEqual({ id: 'osc-1', name: 'OSC Test' });
      expect(result.teams).toHaveLength(1);
      expect(result.teams[0].code).toBe('ABCDEF');
      expect(result.teams[0].members).toEqual([
        { id: 'user-1', name: 'Aluno Test' },
      ]);
    });
  });

  const mockProjectFull = {
    id: 'proj-1',
    name: 'Projeto Test',
    oscId: 'osc-1',
    status: 'IN_PROGRESS' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    osc: { id: 'osc-1', name: 'OSC Test' },
    teams: [
      {
        id: 'team-1',
        semester: '2026-1',
        code: 'ABCDEF',
        createdBy: 'user-1',
        projectId: 'proj-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        members: [{ user: { id: 'user-1', name: 'Aluno Test' } }],
      },
    ],
  };

  describe('findAll', () => {
    it('returns all projects with osc, teams and members', async () => {
      jest.spyOn(prisma.project, 'findMany').mockResolvedValue([mockProjectFull] as any);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].osc).toEqual({ id: 'osc-1', name: 'OSC Test' });
      expect(result[0].teams[0].members).toEqual([{ id: 'user-1', name: 'Aluno Test' }]);
    });
  });

  describe('findOne', () => {
    it('returns a project by id', async () => {
      jest.spyOn(prisma.project, 'findUnique').mockResolvedValue(mockProjectFull as any);

      const result = await service.findOne('proj-1');

      expect(result.id).toBe('proj-1');
      expect(result.teams[0].code).toBe('ABCDEF');
    });

    it('throws NotFoundException when project does not exist', async () => {
      jest.spyOn(prisma.project, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne('nope')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('updates and returns the project', async () => {
      const updated = { ...mockProjectFull, status: 'COMPLETED' as const };
      jest.spyOn(prisma.project, 'update').mockResolvedValue(updated as any);

      const result = await service.updateStatus('proj-1', 'COMPLETED' as any);

      expect(result.status).toBe('COMPLETED');
    });

    it('throws NotFoundException when project does not exist', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        { code: 'P2025', clientVersion: '6.0.0' },
      );
      jest.spyOn(prisma.project, 'update').mockRejectedValue(prismaError);

      await expect(service.updateStatus('nope', 'COMPLETED' as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ConflictException on partial unique index violation', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '6.0.0' },
      );
      jest.spyOn(prisma.project, 'update').mockRejectedValue(prismaError);

      await expect(
        service.updateStatus('proj-1', 'IN_PROGRESS' as any),
      ).rejects.toThrow(ConflictException);
    });
  });
});
