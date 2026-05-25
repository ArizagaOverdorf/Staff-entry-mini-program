import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { LocalStorage } from './storage/local.storage';
import { OssStorage } from './storage/oss.storage';

@Module({
  controllers: [FileController],
  providers: [FileService, LocalStorage, OssStorage],
  exports: [FileService],
})
export class FileModule {}
