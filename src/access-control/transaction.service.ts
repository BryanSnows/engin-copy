import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionEntity } from './entities/transaction.entity';
import { ErrorResponse } from 'src/common/error-reponse';
import { CodeError } from 'src/common/enums';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(TransactionEntity)
    private readonly transactionRepository: Repository<TransactionEntity>,
  ) {}

  async getAll(): Promise<TransactionEntity[]> {
    return this.transactionRepository.find();
  }

  async changeStatus(transaction_id: number): Promise<TransactionEntity> {
    const transaction = await this.transactionRepository.findOne({
      where: { transaction_id: transaction_id },
    });

    if (!transaction) {
      throw new NotFoundException(
        new ErrorResponse(CodeError.NOT_FOUND, 'Transação não cadastrada!'),
      );
    }

    transaction.transaction_status = !transaction.transaction_status;

    return this.transactionRepository.save(transaction);
  }

  async verifyRegisteredTransactions(transaction_ids: number[]): Promise<void> {
    const transactions = await this.getAll();
    const registered_ids = transactions.map(
      (transaction) => transaction.transaction_id,
    );

    transaction_ids?.forEach((transaction_id: number) => {
      if (!registered_ids.includes(transaction_id)) {
        throw new NotFoundException(
          new ErrorResponse(
            CodeError.NOT_FOUND,
            `Transação com id ${transaction_id} não registrada!`,
          ),
        );
      }
    });
  }

  async findOneById(transaction_id: number) {
    return this.transactionRepository.findOne({
      where: { transaction_id },
    });
  }
}
