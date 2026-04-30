import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Server } from 'http';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { HttpExceptionFilter } from '../src/auth/filters/http-exception.filter';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import * as bcrypt from 'bcrypt';

interface AuthResponse {
  accessToken: string;
  user: { email: string; name: string; role: string };
}

interface MessageResponse {
  message: string;
}

describe('Auth E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const httpServer = (): Server => app.getHttpServer() as Server;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Apply ValidationPipe like in main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    // Apply HttpExceptionFilter globally
    app.useGlobalFilters(new HttpExceptionFilter());

    // Apply guards like in main.ts
    const reflector = app.get<Reflector>(Reflector);
    app.useGlobalGuards(new JwtAuthGuard(reflector));
    app.useGlobalGuards(new RolesGuard(reflector));

    await app.init();

    // Cleanup database before tests
    await prisma.user.deleteMany();
    await prisma.appConfig.deleteMany();

    // Create AppConfig with signUpEnabled = true
    await prisma.appConfig.create({
      data: {
        signUpEnabled: true,
      },
    });

    // Create test user
    await prisma.user.create({
      data: {
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        name: 'Test User',
        role: 'STUDENT',
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/sign-in', () => {
    it('should return 200 with accessToken and user on valid credentials', async () => {
      const response = await request(httpServer()).post('/auth/sign-in').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(200);
      const body = response.body as AuthResponse;
      expect(body).toHaveProperty('accessToken');
      expect(body.user).toEqual(
        expect.objectContaining({
          email: 'test@example.com',
          name: 'Test User',
          role: 'STUDENT',
        }),
      );
    });

    it('should return 401 on invalid email', async () => {
      const response = await request(httpServer()).post('/auth/sign-in').send({
        email: 'nonexistent@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(401);
      expect((response.body as MessageResponse).message).toBe(
        'Invalid credentials',
      );
    });

    it('should return 401 on invalid password', async () => {
      const response = await request(httpServer()).post('/auth/sign-in').send({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
      expect((response.body as MessageResponse).message).toBe(
        'Invalid credentials',
      );
    });

    it('should return 400 on missing email', async () => {
      const response = await request(httpServer()).post('/auth/sign-in').send({
        password: 'password123',
      });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /auth/sign-up', () => {
    it('should return 201 with accessToken and user on valid data', async () => {
      const response = await request(httpServer()).post('/auth/sign-up').send({
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password456',
      });

      expect(response.status).toBe(201);
      const body = response.body as AuthResponse;
      expect(body).toHaveProperty('accessToken');
      expect(body.user).toEqual(
        expect.objectContaining({
          email: 'newuser@example.com',
          role: 'STUDENT',
        }),
      );
    });

    it('should return 409 on duplicate email', async () => {
      const response = await request(httpServer()).post('/auth/sign-up').send({
        name: 'Duplicate User',
        email: 'test@example.com',
        password: 'password789',
      });

      expect(response.status).toBe(409);
      expect((response.body as MessageResponse).message).toBe(
        'Email already registered',
      );
    });

    it('should return 403 when signUpEnabled is false', async () => {
      await prisma.appConfig.updateMany({
        data: { signUpEnabled: false },
      });

      const response = await request(httpServer()).post('/auth/sign-up').send({
        name: 'Another User',
        email: 'another@example.com',
        password: 'password999',
      });

      expect(response.status).toBe(403);
      expect((response.body as MessageResponse).message).toBe(
        'Sign up is currently disabled',
      );

      // Reset for other tests
      await prisma.appConfig.updateMany({
        data: { signUpEnabled: true },
      });
    });

    it('should return 400 on missing required fields', async () => {
      const response = await request(httpServer()).post('/auth/sign-up').send({
        name: 'Incomplete User',
        // Missing email and password
      });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /auth/me', () => {
    let validToken: string;

    beforeAll(async () => {
      const signInResponse = await request(httpServer())
        .post('/auth/sign-in')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      validToken = (signInResponse.body as AuthResponse).accessToken;
    });

    it('should return 200 with user data when authenticated', async () => {
      const response = await request(httpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          email: 'test@example.com',
          name: 'Test User',
          role: 'STUDENT',
        }),
      );
    });

    it('should return 401 when no token provided', async () => {
      const response = await request(httpServer()).get('/auth/me');

      expect(response.status).toBe(401);
    });

    it('should return 401 when invalid token provided', async () => {
      const response = await request(httpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /auth/sign-up/toggle', () => {
    let coordinatorToken: string;
    let studentToken: string;

    beforeAll(async () => {
      // Check if coordinator already exists, if not create it
      const existingCoordinator = await prisma.user.findUnique({
        where: { email: 'coordinator@example.com' },
      });

      if (!existingCoordinator) {
        // Create coordinator user
        await prisma.user.create({
          data: {
            email: 'coordinator@example.com',
            passwordHash: await bcrypt.hash('password123', 10),
            name: 'Coordinator User',
            role: 'COORDINATOR',
          },
        });
      }

      // Get coordinator token
      const coordinatorResponse = await request(httpServer())
        .post('/auth/sign-in')
        .send({
          email: 'coordinator@example.com',
          password: 'password123',
        });

      coordinatorToken = (coordinatorResponse.body as AuthResponse).accessToken;

      // Get student token
      const studentResponse = await request(httpServer())
        .post('/auth/sign-in')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      studentToken = (studentResponse.body as AuthResponse).accessToken;
    });

    it('should return 200 when COORDINATOR toggles sign-up', async () => {
      const response = await request(httpServer())
        .patch('/auth/sign-up/toggle')
        .set('Authorization', `Bearer ${coordinatorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('signUpEnabled');
      expect(response.body).toHaveProperty('updatedAt');
    });

    it('should return 403 when STUDENT tries to toggle sign-up', async () => {
      const response = await request(httpServer())
        .patch('/auth/sign-up/toggle')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
    });
  });
});
