import { Test, TestingModule } from '@nestjs/testing';
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
});
