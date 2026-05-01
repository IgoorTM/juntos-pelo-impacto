import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TeamsModule } from '../teams/teams.module';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';

@Module({
  imports: [PrismaModule, TeamsModule],
  providers: [ProjectsService],
  controllers: [ProjectsController],
})
export class ProjectsModule {}
