import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { ChangeProfileArrayDto } from '../profile/dto/change-profile.dto';
import { ProfileTransactionEntity } from './entities/profile-transaction.entity';
import { ProfileService } from '../profile/profile.service';
import { TransactionService } from './transaction.service';
import { ErrorResponse } from 'src/common/error-reponse';
import { CodeError } from 'src/common/enums';

@Injectable()
export class ProfileTransactionService {
  constructor(
    @InjectRepository(ProfileTransactionEntity)
    private readonly profileTransactionRepository: Repository<ProfileTransactionEntity>,
    private readonly profileService: ProfileService,
    private readonly transactionService: TransactionService,
  ) {}

  async changeProfile(
    changeProfileArrayDto: ChangeProfileArrayDto,
  ): Promise<ProfileTransactionEntity[]> {
    const { profiles } = changeProfileArrayDto;

    const transaction_ids: number[] = [];

    const profile_ids = profiles.map((profile) => {
      if (profile.profile_id === 0) {
        throw new UnauthorizedException(
          new ErrorResponse(
            CodeError.CANNOT_BE_CHANGED,
            `Perfil com id ${profile.profile_id} não pode ser alterado!`,
          ),
        );
      }
      transaction_ids.push(...profile.transaction_ids);
      return profile.profile_id;
    });

    await this.profileService.verifyRegisteredProfiles(profile_ids);
    await this.transactionService.verifyRegisteredTransactions(transaction_ids);

    let transactionsToProfile: ProfileTransactionEntity[] = [];

    return Promise.all(
      profiles.map(async (profile) => {
        await this.deleteTransactionsByProfileId(profile.profile_id);
        return profile.transaction_ids?.forEach((transaction_id: number) =>
          transactionsToProfile.push({
            profile_id: profile.profile_id,
            transaction_id: transaction_id,
          }),
        );
      }),
    ).then(() => {
      return this.profileTransactionRepository.save(transactionsToProfile);
    });
  }

  async deleteTransactionsByProfileId(
    profile_id: number,
  ): Promise<DeleteResult> {
    return this.profileTransactionRepository
      .createQueryBuilder()
      .delete()
      .from(ProfileTransactionEntity)
      .where('"PROFILE_TRANSACTION".profile_id = :profile_id', {
        profile_id: profile_id,
      })
      .execute();
  }
}
