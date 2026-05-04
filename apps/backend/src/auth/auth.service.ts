import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signIn(email: string, password: string) {
    this.logger.log(`Sign in attempt for email: ${email}`);

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      this.logger.warn(`User not found: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.debug(`User found: ${email}, validating password...`);
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      this.logger.warn(`Invalid password for user: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log(`Successful sign in for user: ${email}`);
    return this.generateAuthResponse(user);
  }

  async signUp(name: string, email: string, password: string) {
    const appConfig = await this.prisma.appConfig.findFirst();

    if (!appConfig?.signUpEnabled) {
      throw new ForbiddenException('Sign up is currently disabled');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        role: 'STUDENT',
      },
    });

    return this.generateAuthResponse(user);
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return user;
  }

  async toggleSignUp() {
    const appConfig = await this.prisma.appConfig.findFirst();

    const updated = await this.prisma.appConfig.upsert({
      where: { id: appConfig?.id ?? 1 },
      create: { signUpEnabled: true },
      update: { signUpEnabled: !appConfig?.signUpEnabled },
    });

    return {
      signUpEnabled: updated.signUpEnabled,
      updatedAt: updated.updatedAt,
    };
  }

  private generateAuthResponse(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
}
