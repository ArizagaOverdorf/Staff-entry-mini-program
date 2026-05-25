import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { AccountModule } from './modules/account/account.module';
import { AdminModule } from './modules/admin/admin.module';
import { DictModule } from './modules/dict/dict.module';
import { StaffModule } from './modules/staff/staff.module';
import { CredentialModule } from './modules/credential/credential.module';
import { FileModule } from './modules/file/file.module';
import { IntakeModule } from './modules/intake/intake.module';
import { ListingModule } from './modules/listing/listing.module';
import { ServiceRecordModule } from './modules/service-record/service-record.module';
import { MessageModule } from './modules/message/message.module';
import { OperationLogModule } from './modules/operation-log/operation-log.module';
import { IntegrationModule } from './modules/integration/integration.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuthModule,
    AccountModule,
    AdminModule,
    DictModule,
    StaffModule,
    CredentialModule,
    FileModule,
    IntakeModule,
    ListingModule,
    ServiceRecordModule,
    MessageModule,
    OperationLogModule,
    IntegrationModule,
  ],
})
export class AppModule {}
