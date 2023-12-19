import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Put } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginationPipe } from 'src/common/pipes/pagination.pipe';
import { User } from './entities/user.entity';
import { UserFilter } from './dto/filter-user.dto';
import { PermissionGuard } from 'src/auth/shared/guards/permission.guard';
import { PublicRoute } from 'src/common/decorators/public_route.decorator';
import Permission from 'src/auth/enums/permissions.type';

@ApiTags('Users')
@Controller('users')
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(PermissionGuard(Permission.User.CREATE))
  @ApiOperation({ summary: 'Create User' })
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return await this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(PermissionGuard(Permission.User.READ))
  @ApiOperation({ summary: 'List All Users' })
  findAll(@Query(PaginationPipe) filter: UserFilter) {
    return this.usersService.findAll(filter);
  }

  @Get(':id')
  @UseGuards(PermissionGuard(Permission.User.READ))
  @ApiOperation({ summary: 'List User' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Put(':id')
  @UseGuards(PermissionGuard(Permission.User.UPDATE))
  @ApiOperation({ summary: 'Update User' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateUser(+id, updateUserDto);
  }

  @Patch('/status/:id')
  @UseGuards(PermissionGuard(Permission.User.CHANGE_STATUS))
  @ApiOperation({ summary: 'Change User Status' })
  async changeStatus(@Param('id') id: number): Promise<User> {
    return this.usersService.changeStatus(id);
  }
}
