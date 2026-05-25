import { Module } from '@nestjs/common';
import { DictController } from './dict.controller';
import { DictAppController } from './dict-app.controller';
import { DictService } from './dict.service';

@Module({
  controllers: [DictController, DictAppController],
  providers: [DictService],
  exports: [DictService],
})
export class DictModule {}
