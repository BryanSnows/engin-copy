import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PermissionGuard } from 'src/auth/shared/guards/permission.guard';
import { ProfileEntity } from '../profile/entities/profile.entity';
import { ProfileService } from '../profile/profile.service';
import { PublicRoute } from 'src/common/decorators/public_route.decorator';
import { CreateProfileDto } from '../profile/dto/create-profile.dto';
import Permission from 'src/auth/enums/permissions.type';
import { Pagination } from 'nestjs-typeorm-paginate';
import { PaginationPipe } from 'src/common/pipes/pagination.pipe';
import { FilterProfile } from '../profile/dto/filter-profile.dto';
import { UpdateProfileDto } from '../profile/dto/update-profile.dto';

@Controller('profile')
@ApiTags('Profile')
@ApiBearerAuth()
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post()
  @UseGuards(PermissionGuard(Permission.Profile.CREATE_PROFILE))
  @ApiOperation({ summary: 'Create Profile' })
  async create(@Body() createProfileDto: CreateProfileDto) {
    return await this.profileService.createProfile(createProfileDto);
  };

  @Get()
  @UseGuards(PermissionGuard(Permission.Profile.READ_PROFILES))
  @ApiOperation({ summary: 'Listing Of All Profiles' })
  async getAllProfiles(@Query() filterProfile: FilterProfile): Promise<Pagination<ProfileEntity>> {
    return this.profileService.findAll(filterProfile);
  };

  @Get('/profilesTrue')
  @PublicRoute()
  @ApiOperation({ summary: 'Listing Of All Profiles By Status True' })
  async getAllProfilesTrue(): Promise<ProfileEntity[]> {
    return this.profileService.findProfiles();
  };


  @Get(':profile_id')
  @UseGuards(PermissionGuard(Permission.Profile.READ_PROFILES_BY_ID))
  @ApiOperation({ summary: 'Search A Profile By Id' })
  async getProfileById(@Param('profile_id') profile_id: number): Promise<ProfileEntity> {
    return this.profileService.getOne(profile_id);
  };

  @Put(':profile_id')
  @UseGuards(PermissionGuard(Permission.Profile.CHANGE_PROFILE))
  @ApiOperation({ summary: 'Update A Profile By Id' })
  async update(
    @Param('profile_id') profile_id: string,
    @Body() update: UpdateProfileDto
    ): Promise<ProfileEntity> {
    return await this.profileService.updateProfile(+profile_id, update);
  };

  @Patch('/status/:profile_id')
  @UseGuards(PermissionGuard(Permission.Profile.CHANGE_TRANSACTION_STATUS_BY_ID))
  @ApiOperation({ summary: 'Change Profile Status' })
  async changeProfileStatus(@Param('profile_id') profile_id: number): Promise<ProfileEntity> {
    return this.profileService.changeProfileStatus(profile_id);
  };
}
