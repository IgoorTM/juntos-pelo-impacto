import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import {
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockUser: User = {
    id: 'user-123',
    email: 'user@test.com',
    passwordHash: 'hashed-password',
    name: 'Test User',
    role: 'STUDENT',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
            appConfig: {
              findFirst: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signIn', () => {
    it('should return accessToken and user on valid credentials', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(jwtService, 'sign').mockReturnValue('fake-token');

      const result = await service.signIn('user@test.com', 'password123');

      expect(result).toEqual({
        accessToken: 'fake-token',
        user: {
          id: 'user-123',
          email: 'user@test.com',
          name: 'Test User',
          role: 'STUDENT',
        },
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(
        service.signIn('nonexistent@test.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException on invalid password', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(
        service.signIn('user@test.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('signUp', () => {
    it('should return accessToken and user on valid data', async () => {
      jest.spyOn(prismaService.appConfig, 'findFirst').mockResolvedValue({
        id: 1,
        signUpEnabled: true,
        updatedAt: new Date(),
      });
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed' as never);

      jest.spyOn(prismaService.user, 'create').mockResolvedValue(mockUser);
      jest.spyOn(jwtService, 'sign').mockReturnValue('fake-token');

      const result = await service.signUp(
        'Test User',
        'new@test.com',
        'password123',
      );

      expect(result).toEqual({
        accessToken: 'fake-token',
        user: {
          id: 'user-123',
          email: 'user@test.com',
          name: 'Test User',
          role: 'STUDENT',
        },
      });
    });

    it('should throw ForbiddenException when signUpEnabled is false', async () => {
      jest.spyOn(prismaService.appConfig, 'findFirst').mockResolvedValue({
        id: 1,
        signUpEnabled: false,
        updatedAt: new Date(),
      });

      await expect(
        service.signUp('Test User', 'new@test.com', 'password'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException when email already exists', async () => {
      jest.spyOn(prismaService.appConfig, 'findFirst').mockResolvedValue({
        id: 1,
        signUpEnabled: true,
        updatedAt: new Date(),
      });

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

      await expect(
        service.signUp('Test User', 'user@test.com', 'password'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getCurrentUser', () => {
    it('should return user data without passwordHash', async () => {
      const userWithoutSensitiveData: {
        id: string;
        email: string;
        name: string;
        role: string;
      } = {
        id: 'user-123',
        email: 'user@test.com',
        name: 'Test User',
        role: 'STUDENT',
      };

      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(userWithoutSensitiveData as never);

      const result = await service.getCurrentUser('user-123');

      expect(result).toEqual({
        id: 'user-123',
        email: 'user@test.com',
        name: 'Test User',
        role: 'STUDENT',
      });
    });

    it('should return null when user not found', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      const result = await service.getCurrentUser('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('toggleSignUp', () => {
    it('should toggle signUpEnabled from true to false', async () => {
      jest.spyOn(prismaService.appConfig, 'findFirst').mockResolvedValue({
        id: 1,
        signUpEnabled: true,
        updatedAt: new Date(),
      });
      jest.spyOn(prismaService.appConfig, 'update').mockResolvedValue({
        id: 1,
        signUpEnabled: false,
        updatedAt: new Date(),
      });

      const result = await service.toggleSignUp();

      expect(result.signUpEnabled).toBe(false);
      expect(result).toHaveProperty('updatedAt');
    });

    it('should toggle signUpEnabled from false to true', async () => {
      jest.spyOn(prismaService.appConfig, 'findFirst').mockResolvedValue({
        id: 1,
        signUpEnabled: false,
        updatedAt: new Date(),
      });
      jest.spyOn(prismaService.appConfig, 'update').mockResolvedValue({
        id: 1,
        signUpEnabled: true,
        updatedAt: new Date(),
      });

      const result = await service.toggleSignUp();

      expect(result.signUpEnabled).toBe(true);
      expect(result).toHaveProperty('updatedAt');
    });
  });
});
