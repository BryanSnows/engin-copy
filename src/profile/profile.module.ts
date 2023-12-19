import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProfileEntity } from "./entities/profile.entity";
import { ProfileService } from "./profile.service";
import { ProfileController } from "./profile.controller";
import { TransactionEntity } from "src/access-control/entities/transaction.entity";
import { TransactionService } from "src/access-control/transaction.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([ProfileEntity, TransactionEntity]),
    ],
    controllers: [ProfileController],
    providers: [ProfileService, TransactionService],
    exports: [ProfileService, TransactionService]
})

export class ProfileModule {}