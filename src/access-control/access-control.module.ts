import { AccessControlController } from './access-control.controller';
import { ProfileService } from '../profile/profile.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileEntity } from '../profile/entities/profile.entity';
import { ProfileTransactionEntity } from './entities/profile-transaction.entity';
import { ProfileTransactionService } from './profile-transaction.service';
import { TransactionEntity } from './entities/transaction.entity';
import { TransactionService } from './transaction.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([ProfileEntity, TransactionEntity, ProfileTransactionEntity])
    ],
    controllers: [
        AccessControlController
    ],
    providers: [
        ProfileService,
        ProfileTransactionService,
        TransactionService
    ],
    exports: [
        ProfileService,
        ProfileTransactionService,
        TransactionService
    ]
})
export class AccessControlModule { }
