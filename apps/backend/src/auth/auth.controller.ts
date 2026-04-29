import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Request,
  HttpCode,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { SignInDto } from './dtos/sign-in.dto';
import { SignUpDto } from './dtos/sign-up.dto';
import { AuthResponseDto } from './dtos/auth-response.dto';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('sign-in')
  @HttpCode(200)
  @ApiOperation({ summary: 'Autenticação com email e senha' })
  @ApiBody({ type: SignInDto })
  @ApiResponse({
    status: 200,
    description: 'Autenticação bem-sucedida',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  @ApiResponse({ status: 422, description: 'Validação falhou' })
  async signIn(@Body() signInDto: SignInDto): Promise<AuthResponseDto> {
    return this.authService.signIn(signInDto.email, signInDto.password);
  }

  @Public()
  @Post('sign-up')
  @HttpCode(201)
  @ApiOperation({ summary: 'Criar nova conta de usuário' })
  @ApiBody({ type: SignUpDto })
  @ApiResponse({
    status: 201,
    description: 'Conta criada com sucesso',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Cadastro desabilitado' })
  @ApiResponse({ status: 409, description: 'Email já registrado' })
  @ApiResponse({ status: 422, description: 'Validação falhou' })
  async signUp(@Body() signUpDto: SignUpDto): Promise<AuthResponseDto> {
    return this.authService.signUp(
      signUpDto.name,
      signUpDto.email,
      signUpDto.password,
    );
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Retorna dados do usuário autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Dados do usuário',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Token inválido ou ausente' })
  async getMe(@Request() req: AuthenticatedRequest) {
    return this.authService.getCurrentUser(req.user.userId);
  }

  @ApiBearerAuth()
  @Roles('COORDINATOR')
  @Patch('sign-up/toggle')
  @ApiOperation({
    summary: 'Habilita/desabilita cadastro público (apenas COORDINATOR)',
  })
  @ApiResponse({
    status: 200,
    description: 'Status atualizado',
    schema: {
      type: 'object',
      properties: {
        signUpEnabled: { type: 'boolean', example: true },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Token inválido' })
  @ApiResponse({ status: 403, description: 'Apenas COORDINATOR pode acessar' })
  async toggleSignUp() {
    return this.authService.toggleSignUp();
  }
}
