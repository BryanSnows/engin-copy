import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Validations } from 'src/common/validations';
import { CodeError, ObjectSize, ValidType } from 'src/common/enums';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Brackets, Repository } from 'typeorm';
import { Pagination, paginate } from 'nestjs-typeorm-paginate';
import { UserFilter } from './dto/filter-user.dto';
import { UserWithProfileName } from './entities/user.response';
import { ProfileEntity } from 'src/profile/entities/profile.entity';
import { ErrorResponse } from 'src/common/error-reponse';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ProfileEntity)
    private readonly profileRepository: Repository<ProfileEntity>,
  ) {}

  async updateRefreshToken(id: number, refresh_token: string) {
    Validations.getInstance().validateWithRegex(`${id}`, ValidType.IS_NUMBER);

    if (id > ObjectSize.INTEGER) {
      throw new BadRequestException(
        new ErrorResponse(CodeError.IS_INTEGER, `Numero de id Invalido`),
      );
    }

    const user = await this.findOne(id);

    if (!user) {
      throw new NotFoundException(
        new ErrorResponse(CodeError.NOT_FOUND, `Usuario com id ${id} não existe`),
      );
    }

    user.user_refresh_token = refresh_token;

    await this.userRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('profile.transactions', 'transactions')
      .where('user.user_email = :user_email', {
        user_email: email,
      })
      .getOne();
  }

  async findProfileById(id: number): Promise<ProfileEntity | null> {
    return this.profileRepository.findOneBy({
      profile_id: id,
    });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { user_email } = createUserDto;
    const user = this.userRepository.create(createUserDto);

    if (!user.user_name)
      throw new BadRequestException(
        new ErrorResponse(CodeError.NOT_EMPTY, `O campo username não pode estar vazio`),
      );

    if (user_email.trim() == '' || user_email == undefined)
      throw new BadRequestException(
        new ErrorResponse(CodeError.NOT_EMPTY, `O campo email não pode estar vazio`),
      );

    user.user_name = user.user_name.toUpperCase().trim();

    Validations.getInstance().validateWithRegex(
      user.user_name,
      'user_name',
      ValidType.IS_STRING,
      ValidType.NO_SPECIAL_CHARACTER,
      ValidType.NO_MANY_SPACE,
    );
    Validations.getInstance().verifyLength(user.user_name, 'user_name', 4, 40);

    if (user.user_email) {
      Validations.getInstance().validateWithRegex(
        user.user_email,
        'user_email',
        ValidType.IS_EMAIL,
        ValidType.NO_SPACE,
      );

      const emailAreadyExists = await this.findByEmail(user.user_email);

      if (emailAreadyExists)
        throw new BadRequestException(
          new ErrorResponse(CodeError.IS_REGISTERED, 'E-mail existente'),
        );
    }

    const profile = await this.findProfileById(createUserDto.profile_id);

    if (!profile)
      throw new NotFoundException(
        new ErrorResponse(CodeError.NOT_FOUND, 'Perfil de acesso não encontrado'),
      );

    user.user_status = true;

    const newUser = await this.userRepository.save(user);

    return newUser;
  }

  async updateUser(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    Validations.getInstance().validateWithRegex(`${id}`, ValidType.IS_NUMBER);

    const isRegistered = await this.profileRepository.findOne({
      where: {
        profile_id: updateUserDto.profile_id,
      },
    });

    if (!isRegistered) {
      throw new NotFoundException(new ErrorResponse(CodeError.NOT_FOUND, `O Perfil não existe`));
    }

    const user = await this.userRepository.preload({
      user_id: id,
      ...updateUserDto,
    });

    await this.userRepository.save(user);

    return this.findOne(id);
  }

  async findAll(filter: UserFilter): Promise<Pagination<UserWithProfileName>> {
    const { search, user_status } = filter;

    const userBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .orderBy('user.user_name', 'ASC');

    if (search) {
      userBuilder.andWhere(
        new Brackets((queryBuilderOne) => {
          queryBuilderOne
            .where('user.user_name LIKE :user_name', {
              user_name: `%${search}%`,
            })
            .orWhere('user.user_email LIKE :user_email', {
              user_email: `%${search}%`,
            });
        }),
      );
    }

    if (user_status) {
      userBuilder.andWhere('user.user_status = :user_status', { user_status });
    }

    const paginatedUsers = await paginate<User>(userBuilder, filter);

    const itemsWithProfileName: UserWithProfileName[] = paginatedUsers.items.map((user) => ({
      user_email: user.user_email,
      user_name: user.user_name,
      user_id: user.user_id,
      user_status: user.user_status,
      profile_name: user.profile?.profile_name || null,
    }));

    return {
      ...paginatedUsers,
      items: itemsWithProfileName,
    };
  }

  async findOne(id: number): Promise<User> {
    return this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .where('user.user_id = :user_id', { user_id: id })
      .getOne();
  }

  async changeStatus(id: number): Promise<User> {
    Validations.getInstance().validateWithRegex(`${id}`, ValidType.IS_NUMBER);

    if (id > ObjectSize.INTEGER) {
      throw new BadRequestException(
        new ErrorResponse(CodeError.IS_INTEGER, `Número de id inválido`),
      );
    }

    const userSaved = await this.findOne(id);

    if (!userSaved) {
      throw new NotFoundException(new ErrorResponse(CodeError.NOT_FOUND, `Usuário não existe`));
    }

    const { user_status: status } = userSaved;

    userSaved.user_status = status === true ? false : true;

    return this.userRepository.save(userSaved);
  }
}
