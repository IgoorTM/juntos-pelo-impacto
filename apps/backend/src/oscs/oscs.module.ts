import { Module } from '@nestjs/common';
import { OscsService } from './oscs.service';
import { OscsController } from './oscs.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [OscsService],
  controllers: [OscsController],
  exports: [OscsService],
})
export class OscsModule {}
