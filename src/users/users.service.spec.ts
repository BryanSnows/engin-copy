import { Test } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { ProfileEntity } from 'src/profile/entities/profile.entity';

describe('UsersService', () => {
  let usersService: UsersService;
  let userRepository: Repository<User>;
  let profileRepository: Repository<ProfileEntity>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(ProfileEntity),
          useClass: Repository,
        },
      ],
    }).compile();

    usersService = moduleRef.get<UsersService>(UsersService);
    userRepository = moduleRef.get<Repository<User>>(getRepositoryToken(User));
    profileRepository = moduleRef.get<Repository<ProfileEntity>>(getRepositoryToken(ProfileEntity));
  });

  describe('create', () => {
    it('should create a new user', async () => {
        const createUserDto: any = {
            user_name: 'John Doe',
            user_email: 'john.doe@example.com',
            user_enrollment: '123456789',
            profile_id: 1,
          };
          
          const profileEntity: any = {
            profile_id: 1,
            profile_name: 'Admin',
            profile_status: true,
          };

      jest.spyOn(userRepository, 'create').mockReturnValue(createUserDto);
      jest.spyOn(userRepository, 'save').mockResolvedValue(createUserDto);
      jest.spyOn(profileRepository, 'findOneBy').mockResolvedValue(profileEntity);

      const result = await usersService.create(createUserDto);

      expect(result).toEqual(createUserDto);
      expect(userRepository.create).toHaveBeenCalledWith(createUserDto);
      expect(userRepository.save).toHaveBeenCalledWith(createUserDto);
      expect(profileRepository.findOneBy).toHaveBeenCalledWith({
        profile_id: createUserDto.profile_id,
      });
    });
  });

  describe('findByEmail', () => {
    it('should find a user by email', async () => {
      const email = 'test@example.com';
      const user: any = {
        user_name: 'John Doe',
        user_email: 'john.doe@example.com',
        user_enrollment: '123456789',
        profile_id: 1,
      };

      jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(user);

      const result = await usersService.findByEmail(email);

      expect(result).toEqual(user);
      expect(userRepository.findOneBy).toHaveBeenCalledWith({
        user_email: email,
      });
    });
  });


});