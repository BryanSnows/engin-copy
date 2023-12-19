import { Body, Controller, Get, Param, Patch, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PermissionGuard } from 'src/auth/shared/guards/permission.guard';
import { ChangeProfileArrayDto } from '../profile/dto/change-profile.dto';
import { ProfileTransactionEntity } from './entities/profile-transaction.entity';
import { TransactionEntity } from './entities/transaction.entity';
import { ProfileTransactionService } from './profile-transaction.service';
import { TransactionService } from './transaction.service';
import { PublicRoute } from 'src/common/decorators/public_route.decorator';
import Permission from 'src/auth/enums/permissions.type';


@Controller('access-control')
@ApiTags('Access Control')
@ApiBearerAuth()
export class AccessControlController {
    constructor(
        private readonly profileTransactionService: ProfileTransactionService,
        private readonly transactionService: TransactionService
    ) {}


    @Put('profiles')
    @PublicRoute()
    @ApiOperation({ summary: 'Listing Of All Profiles With Transactions'})
    async changeProfile(@Body() changeProfileArrayDto: ChangeProfileArrayDto): Promise<ProfileTransactionEntity[]> {
        return this.profileTransactionService.changeProfile(changeProfileArrayDto);
    };

    @Get('transactions')
    @PublicRoute()
    @ApiOperation({ summary: 'Listing Of All Transactions'})
    async getAllTransactions(): Promise<TransactionEntity[]> {
        return this.transactionService.getAll();
    };

    @Patch('transactions/changeStatus/:transaction_id')
    @PublicRoute()
    @ApiOperation({ summary: 'Change Status A Transaction By Transaction Id'})
    async changeStatus(@Param('transaction_id') transaction_id: number): Promise<TransactionEntity> {
        return this.transactionService.changeStatus(transaction_id);
    };


}
