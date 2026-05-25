import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '../../config/config.service';
import { AdminAuthService } from './admin-auth.service';
import { AdminAuthController } from './admin-auth.controller';
import { AdminUserService } from './admin-user.service';
import { AdminUserController } from './admin-user.controller';
import { AdminRoleService } from './admin-role.service';
import { AdminRoleController } from './admin-role.controller';
import { AdminStaffService } from './admin-staff.service';
import { AdminStaffController } from './admin-staff.controller';
import { AdminJwtStrategy } from './strategies/admin-jwt.strategy';
import { AdminJwtAuthGuard } from './guards/admin-jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.jwtSecret,
        signOptions: { expiresIn: config.jwtExpiresIn },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AdminAuthController, AdminUserController, AdminRoleController, AdminStaffController],
  providers: [
    AdminAuthService,
    AdminUserService,
    AdminRoleService,
    AdminStaffService,
    AdminJwtStrategy,
    AdminJwtAuthGuard,
    PermissionsGuard,
  ],
  exports: [AdminJwtAuthGuard, PermissionsGuard],
})
export class AdminModule {}
