import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProfileEntity } from 'src/profile/entities/profile.entity';
import { Repository } from 'typeorm';
import { TransactionService } from '../access-control/transaction.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { FilterProfile } from './dto/filter-profile.dto';
import { Pagination, paginate } from 'nestjs-typeorm-paginate';
import {
  CodeError,
  DashboardTransactions,
  ModelTransactions,
  ObjectSize,
  ReportTransactions,
  RestrictTransactions,
  UserTransactions,
  ValidType,
} from 'src/common/enums';
import { Validations } from 'src/common/validations';
import { ErrorResponse } from 'src/common/error-reponse';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { listItems } from 'src/common/pagination/pagination.Utils';
import { TransactionEntity } from 'src/access-control/entities/transaction.entity';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(ProfileEntity)
    private readonly profileRepository: Repository<ProfileEntity>,
    private readonly transactionService: TransactionService,
  ) {}

  async createProfile(createProfile: CreateProfileDto) {
    let { profile_name, transaction_id } = createProfile;

    if (profile_name.trim() == '' || profile_name == undefined) {
      throw new BadRequestException(
        new ErrorResponse(CodeError.NO_SPACE, 'O campo user_name não pode estar vazio'),
      );
    }

    let profile = this.profileRepository.create({
      ...createProfile,
      profile_name: profile_name.toUpperCase().trim(),
    });

    Validations.getInstance().validateWithRegex(
      profile.profile_name,
      'profile_name',
      ValidType.IS_STRING,
      ValidType.NO_SPECIAL_CHARACTER,
      ValidType.NO_MANY_SPACE,
    );
    Validations.getInstance().verifyLength(profile.profile_name, 'profile_name', 5, 40);

    if (transaction_id) {
      profile.transactions = await this.verifyTransactionRequirements(transaction_id);
    }

    const isRegistered = await this.findByProfile(profile.profile_name);

    if (isRegistered) {
      throw new BadRequestException(
        new ErrorResponse(CodeError.IS_REGISTERED, 'Nome de perfil já cadastrado'),
      );
    }

    profile.profile_status = true;
    const profileSaved = await this.profileRepository.save(profile);
    return profileSaved;
  }

  async updateProfile(profile_id: number, updateProfile: UpdateProfileDto): Promise<ProfileEntity> {
    const { transaction_id, profile_name } = updateProfile;
    Validations.getInstance().validateWithRegex(`${profile_id}`, ValidType.IS_NUMBER);

    if (profile_id > ObjectSize.INTEGER) {
      throw new BadRequestException(
        new ErrorResponse(CodeError.INVALID_NUMBER, `Numero de id invalido`),
      );
    }

    const profile = await this.profileRepository.preload({
      ...updateProfile,
      profile_id: profile_id,
    });

    if (profile_name) {
      profile.profile_name = updateProfile.profile_name.toUpperCase().trim();

      Validations.getInstance().validateWithRegex(
        profile.profile_name,
        'profile_name',
        ValidType.IS_STRING,
        ValidType.NO_SPECIAL_CHARACTER,
        ValidType.NO_MANY_SPACE,
      );
      Validations.getInstance().verifyLength(profile.profile_name, 'profile_name', 5, 40);
    }

    const isProfileNameRegistered = await this.findByProfile(profile.profile_name);

    if (isProfileNameRegistered && isProfileNameRegistered.profile_id !== profile_id) {
      throw new BadRequestException(
        new ErrorResponse(CodeError.IS_REGISTERED, 'Nome de perfil já cadastrado'),
      );
    }

    if (transaction_id) {
      profile.transactions = await this.verifyTransactionRequirements(
        transaction_id,
        profile.profile_id,
      );
    }

    await this.profileRepository.save(profile);
    return this.getOne(profile_id);
  }

  async findAll(filterProfile: FilterProfile): Promise<any | Pagination<ProfileEntity>> {
    const { profile_name, profile_status, page, limit } = filterProfile;
    const profile = this.profileRepository
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.transactions', 'transactions')
      .orderBy('profile.profile_name', 'ASC');

    if (profile_name) {
      profile.andWhere('profile.profile_name LIKE :profile_name', {
        profile_name: `%${profile_name}%`,
      });
    }

    if (profile_status) {
      profile.andWhere('profile.profile_status = :profile_status', {
        profile_status,
      });
    }

    profile.andWhere('profile.profile_name != :admin', {
      admin: 'administrador',
    });

    const items = await profile.getMany();

    const returnPagination = listItems(items, page, limit, filterProfile);

    return returnPagination;
  }

  async findProfiles(): Promise<ProfileEntity[]> {
    const queryBuilder = this.profileRepository
      .createQueryBuilder('profile')
      .where('profile.profile_status = :profile_status', { profile_status: 1 })
      .orderBy('profile.profile_name', 'ASC');
    return await queryBuilder.getMany();
  }

  async getAll(): Promise<ProfileEntity[]> {
    const profiles = await this.profileRepository
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.transactions', 'transactions')
      .getMany();

    return Promise.all(
      profiles.map(async (profile: ProfileEntity) => {
        if (profile.profile_id === 0) {
          return this.putAllTransactionsOnProfile(profile);
        }
        return profile;
      }),
    );
  }

  async getOne(profile_id: number): Promise<ProfileEntity> {
    let profile = await this.profileRepository
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.transactions', 'transactions')
      .where('profile.profile_id = :profile_id', { profile_id: profile_id })
      .getOne();

    if (profile.profile_id === 0) {
      return this.putAllTransactionsOnProfile(profile);
    }

    return profile;
  }

  async findByProfile(profile_name: string): Promise<ProfileEntity> {
    return await this.profileRepository.findOne({
      where: { profile_name },
    });
  }

  async matchByTransactions(transactions: any): Promise<ProfileEntity | null> {
    const profiles = await this.profileRepository.find({
      relations: ['transactions'],
    });

    for (const profile of profiles) {
      const profileTransactions = profile.transactions;

      if (profileTransactions.length === transactions.length) {
        const match = profileTransactions.every((profileTransaction) => {
          return transactions.some(
            (transaction) => transaction.transaction_id == profileTransaction.transaction_id,
          );
        });

        if (match) {
          return profile;
        }
      }
    }

    return null;
  }

  async verifyRegisteredProfiles(profile_ids: number[]) {
    const profiles = await this.getAll();
    const registered_ids = profiles.map((profile) => profile.profile_id);

    profile_ids?.forEach((profile_id: number) => {
      if (!registered_ids.includes(profile_id)) {
        throw new UnauthorizedException(
          new ErrorResponse(CodeError.NOT_FOUND, `Perfil com id ${profile_id} não registrado!`),
        );
      }
    });
  }

  async putAllTransactionsOnProfile(profile: ProfileEntity): Promise<ProfileEntity> {
    const transactions = await this.transactionService.getAll();
    return { ...profile, transactions: transactions };
  }

  async changeProfileStatus(profile_id: number): Promise<ProfileEntity> {
    Validations.getInstance().validateWithRegex(`${profile_id}`, ValidType.IS_NUMBER);

    if (profile_id > ObjectSize.INTEGER) {
      throw new BadRequestException(
        new ErrorResponse(CodeError.INVALID_NUMBER, `Numero de id invalido`),
      );
    }
    const profileSaved = await this.getOne(profile_id);

    if (!profileSaved) {
      throw new BadRequestException(new ErrorResponse(CodeError.NOT_FOUND, `Perfil nao existe`));
    }

    const { profile_status: status } = profileSaved;

    profileSaved.profile_status = status === true ? false : true;

    return this.profileRepository.save(profileSaved);
  }

  async verifyTransactionRequirements(
    transactionId: number[],
    profile_id?: number,
  ): Promise<TransactionEntity[]> {
    let listTransactions = [];
    let transactionsFound = {
      user: false,
      dashboard: false,
      report: false,
      model: false,
    };

    for (const elements of transactionId) {
      const transaction = await this.transactionService.findOneById(elements);

      if (!transaction) {
        throw new BadRequestException(
          new ErrorResponse(CodeError.NOT_FOUND, 'Esta transação não é válida'),
        );
      }

      if (elements >= UserTransactions.USER_RESTRICT && elements <= UserTransactions.USER_TOTAL) {
        if (transactionsFound.user) {
          throw new BadRequestException(
            new ErrorResponse(
              CodeError.MAX_ONE_TRANSACTION_FOR_RESOURCE,
              'Só é permitido adicionar uma transação da guia de Usuarios',
            ),
          );
        }
        transactionsFound.user = true;
      } else if (
        elements >= DashboardTransactions.DASHBOARD_RESTRICT &&
        elements <= DashboardTransactions.DASHBOARD_TOTAL
      ) {
        if (transactionsFound.dashboard) {
          throw new BadRequestException(
            new ErrorResponse(
              CodeError.MAX_ONE_TRANSACTION_FOR_RESOURCE,
              'Só é permitido adicionar uma transação da guia de Dashboard',
            ),
          );
        }
        transactionsFound.dashboard = true;
      } else if (
        elements >= ReportTransactions.REPORT_RESTRICT &&
        elements <= ReportTransactions.REPORT_TOTAL
      ) {
        if (transactionsFound.report) {
          throw new BadRequestException(
            new ErrorResponse(
              CodeError.MAX_ONE_TRANSACTION_FOR_RESOURCE,
              'Só é permitido adicionar uma transação da guia de Relatórios',
            ),
          );
        }
        transactionsFound.report = true;
      } else if (
        elements >= ModelTransactions.MODEL_RESTRICT &&
        elements <= ModelTransactions.MODEL_TOTAL
      ) {
        if (transactionsFound.model) {
          throw new BadRequestException(
            new ErrorResponse(
              CodeError.MAX_ONE_TRANSACTION_FOR_RESOURCE,
              'Só é permitido adicionar uma transação da guia de Modelos',
            ),
          );
        }
        transactionsFound.model = true;
      }

      if (elements === 0) {
        throw new BadRequestException(
          new ErrorResponse(
            CodeError.NOT_ALLOWED,
            'A transação de Controle de Acesso é atrelada somente ao perfil de Administrador',
          ),
        );
      }
      listTransactions.push(transaction);
    }
    if (listTransactions.length === 0) {
      throw new BadRequestException(
        new ErrorResponse(
          CodeError.NOT_EMPTY,
          'Não é possível cadastrar perfil sem atribuir ao menos uma transação',
        ),
      );
    }
    if (
      listTransactions.every((transaction) =>
        Object.values(RestrictTransactions).includes(transaction.transaction_id),
      )
    ) {
      throw new BadRequestException(
        new ErrorResponse(
          CodeError.NOT_ALLOWED_RESTRICTED_TRANSACTIONS_ONLY,
          'Não é possível cadastrar perfil apenas com transações restritas',
        ),
      );
    }
    const profileWithSameTransactions = await this.matchByTransactions(listTransactions);
    if (profileWithSameTransactions && profileWithSameTransactions.profile_id != profile_id) {
      throw new BadRequestException(
        new ErrorResponse(
          CodeError.NOT_ALLOWED_SAME_TRANSACTIONS,
          `Permissões selecionadas já foram igualmente utilizadas/cadastradas no perfil ${profileWithSameTransactions.profile_name}`,
        ),
      );
    }
    return listTransactions;
  }
}
