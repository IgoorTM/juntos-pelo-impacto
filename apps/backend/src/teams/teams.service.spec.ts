import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TeamsService } from './teams.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TeamsService', () => {
  let module: TestingModule;
  let service: TeamsService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        TeamsService,
        {
          provide: PrismaService,
          useValue: {
            team: { findUnique: jest.fn() },
            teamMember: { create: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<TeamsService>(TeamsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateUniqueCode', () => {
    const VALID_CHARSET = new Set('ABCDEFGHJKLMNPQRSTUVWXYZ23456789');
    const INVALID_CHARS = new Set('IO01');

    it('returns a string of exactly 6 characters', () => {
      expect(service.generateUniqueCode()).toHaveLength(6);
    });

    it('uses only characters from the valid charset', () => {
      for (let i = 0; i < 50; i++) {
        const code = service.generateUniqueCode();
        for (const char of code) {
          expect(VALID_CHARSET.has(char)).toBe(true);
        }
      }
    });

    it('never includes ambiguous characters (I, O, 0, 1)', () => {
      for (let i = 0; i < 50; i++) {
        const code = service.generateUniqueCode();
        for (const char of code) {
          expect(INVALID_CHARS.has(char)).toBe(false);
        }
      }
    });
  });

  describe('joinTeam', () => {
    let prisma: PrismaService;

    const mockTeam = {
      id: 'team-1',
      projectId: 'proj-1',
      semester: '2026-1',
      code: 'ABCDEF',
      createdBy: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      project: { id: 'proj-1', name: 'Projeto Test' },
      members: [{ user: { id: 'user-2', name: 'Outro Aluno' } }],
    };

    beforeEach(() => {
      prisma = module.get<PrismaService>(PrismaService);
    });

    it('throws NotFoundException when team code does not exist', async () => {
      jest.spyOn(prisma.team, 'findUnique').mockResolvedValue(null);

      await expect(service.joinTeam('user-99', 'XXXXXX')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ConflictException when user is already a member', async () => {
      jest.spyOn(prisma.team, 'findUnique').mockResolvedValue(mockTeam);
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '6.0.0' },
      );
      jest.spyOn(prisma.teamMember, 'create').mockRejectedValue(prismaError);

      await expect(service.joinTeam('user-1', 'ABCDEF')).rejects.toThrow(
        ConflictException,
      );
    });

    it('returns team with project and updated members on success', async () => {
      const teamWithNewMember = {
        ...mockTeam,
        members: [
          { user: { id: 'user-2', name: 'Outro Aluno' } },
          { user: { id: 'user-99', name: 'Novo Aluno' } },
        ],
      };
      jest
        .spyOn(prisma.team, 'findUnique')
        .mockResolvedValueOnce(mockTeam)
        .mockResolvedValueOnce(teamWithNewMember);
      jest.spyOn(prisma.teamMember, 'create').mockResolvedValue({
        teamId: 'team-1',
        userId: 'user-99',
        joinedAt: new Date(),
      });

      const result = await service.joinTeam('user-99', 'ABCDEF');

      expect(result.id).toBe('team-1');
      expect(result.code).toBe('ABCDEF');
      expect(result.project).toEqual({ id: 'proj-1', name: 'Projeto Test' });
      expect(result.members).toHaveLength(2);
      expect(result.members).toContainEqual({
        id: 'user-99',
        name: 'Novo Aluno',
      });
    });
  });
});
