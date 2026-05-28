import { Module } from '@nestjs/common';
import { ServiceRecordService } from './service-record.service';
import { AppServiceRecordController } from './app-service-record.controller';

@Module({
  controllers: [AppServiceRecordController],
  providers: [ServiceRecordService],
  exports: [ServiceRecordService],
})
export class ServiceRecordModule {}
