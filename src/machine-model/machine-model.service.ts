import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateMachineModelDto } from './dto/create-machine-model.dto';
import { UpdateMachineModelDto } from './dto/update-machine-model.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { MachineModel } from './entities/machine-model.entity';
import { Brackets, Repository } from 'typeorm';
import { ErrorResponse } from 'src/common/error-reponse';
import { CodeError, ObjectSize, ValidType } from 'src/common/enums';
import { Validations } from 'src/common/validations';
import { MachineModelFilter } from './dto/filter-machine-model';
import { Pagination } from 'nestjs-typeorm-paginate';
import { listItems } from 'src/common/pagination/pagination.Utils';
import { RedisService } from 'src/config/cache/redis.service';
@Injectable()
export class MachineModelService {
  constructor(
    @InjectRepository(MachineModel)
    private readonly machineModelRepository: Repository<MachineModel>,
    private readonly redisService: RedisService,
  ) {}

  async findByMachineName(name: string): Promise<MachineModel | undefined> {
    return await this.machineModelRepository.findOneBy({
      machine_model_name: name,
    });
  }

  async findByMachineIp(ip: string): Promise<MachineModel | undefined> {
    return await this.machineModelRepository.findOneBy({
      machine_model_ip: ip,
    });
  }

  async create(createMachineModelDto: CreateMachineModelDto): Promise<MachineModel> {
    const { machine_model_ip, machine_model_name } = createMachineModelDto;
    const machineModel = this.machineModelRepository.create(createMachineModelDto);

    if (!machine_model_name || machine_model_name.trim() == '')
      throw new BadRequestException(
        new ErrorResponse(CodeError.NOT_EMPTY, `O campo descrição da máquina não pode estar vazio`),
      );

    if (!machine_model_ip || machine_model_ip.trim() == '')
      throw new BadRequestException(
        new ErrorResponse(CodeError.NOT_EMPTY, `O campo IP da máquina não pode estar vazio`),
      );

    machineModel.machine_model_name = machine_model_name.toLocaleUpperCase().trim();

    Validations.getInstance().validateWithRegex(
      machineModel.machine_model_name,
      'descrição',
      ValidType.NO_SPECIAL_CHARACTER,
      ValidType.NO_MANY_SPACE,
    );
    Validations.getInstance().verifyLength(machineModel.machine_model_name, 'descrição', 5, 40);

    const machineNameAlreadyExists = await this.findByMachineName(machineModel.machine_model_name);

    if (machineNameAlreadyExists)
      throw new BadRequestException(
        new ErrorResponse(CodeError.IS_REGISTERED, 'Descrição da máquina já cadastrada'),
      );

    Validations.getInstance().validateWithRegex(
      machineModel.machine_model_ip,
      'IP',
      ValidType.IS_MACHINE_IP,
    );

    const machineIpAlreadyExists = await this.findByMachineIp(machineModel.machine_model_ip);

    if (machineIpAlreadyExists)
      throw new BadRequestException(new ErrorResponse(CodeError.IS_REGISTERED, 'IP já cadastrado'));

    machineModel.machine_model_status = true;

    const createdMachineModel = await this.machineModelRepository.save(machineModel);

    const redisKey = `machine:${createdMachineModel.machine_model_id}`;
    const redisValue = JSON.stringify(createdMachineModel);

    try {
      await this.redisService.set(redisKey, redisValue);
    } catch (error) {
      console.error('Error adding key to Redis:', error);
    }

    return createdMachineModel;
  }

  async findMachinesWithoutProcesses(): Promise<MachineModel[]> {
    return this.machineModelRepository
      .createQueryBuilder('machine')
      .where((qb) => {
        const subQuery = qb
          .subQuery()
          .select('process.machine_model_id')
          .from('PROCESS', 'process')
          .where('process.machine_model_id = machine.machine_model_id')
          .andWhere('machine.machine_model_status = :status', { status: true })
          .getQuery();
        return `NOT EXISTS ${subQuery}`;
      })
      .getMany();
  }

  async update(
    machine_model_id: number,
    updateMachineModelDto: UpdateMachineModelDto,
  ): Promise<MachineModel> {
    const { machine_model_ip, machine_model_name } = updateMachineModelDto;

    const machineModel = await this.machineModelRepository.preload({
      ...updateMachineModelDto,
      machine_model_id: machine_model_id,
    });

    if (!machineModel)
      throw new BadRequestException(new ErrorResponse(CodeError.NOT_FOUND, `Máquina não existe`));

    if (machine_model_name.trim() == '' || machine_model_name == undefined) {
      throw new BadRequestException(
        new ErrorResponse(CodeError.NOT_EMPTY, 'O campo descrição de máquina não pode estar vazio'),
      );
    }

    if (machine_model_ip.trim() == '' || machine_model_ip == undefined) {
      throw new BadRequestException(
        new ErrorResponse(CodeError.NOT_EMPTY, 'O campo IP de máquina não pode estar vazio'),
      );
    }

    if (machine_model_name) {
      machineModel.machine_model_name = machine_model_name.toLocaleUpperCase().trim();

      Validations.getInstance().validateWithRegex(
        machineModel.machine_model_name,
        'descrição',
        ValidType.NO_SPECIAL_CHARACTER,
        ValidType.NO_MANY_SPACE,
      );
      Validations.getInstance().verifyLength(machineModel.machine_model_name, 'descrição', 5, 40);

      const machineNameAlreadyExists = await this.findByMachineName(
        machineModel.machine_model_name,
      );

      if (machineNameAlreadyExists && machineNameAlreadyExists.machine_model_id != machine_model_id)
        throw new BadRequestException(
          new ErrorResponse(CodeError.IS_REGISTERED, 'Descrição da máquina já cadastrada'),
        );
    }

    if (machine_model_ip) {
      const machineIpAlreadyExists = await this.findByMachineIp(machine_model_ip);

      if (machineIpAlreadyExists && machineIpAlreadyExists.machine_model_id != machine_model_id)
        throw new BadRequestException(
          new ErrorResponse(CodeError.IS_REGISTERED, 'IP já cadastrado'),
        );
    }

    await this.machineModelRepository.save(machineModel);

    return await this.findOne(machine_model_id);
  }

  async findAll(filter: MachineModelFilter): Promise<Pagination<MachineModel>> {
    const { search, machine_model_status, page, limit } = filter;

    const machineModelBuilder = this.machineModelRepository
      .createQueryBuilder('machine_model')
      .orderBy('machine_model.machine_model_name', 'ASC');

    if (search) {
      machineModelBuilder.andWhere(
        new Brackets((queryBuilderOne) => {
          queryBuilderOne
            .where('machine_model.machine_model_name LIKE :machine_model_name', {
              machine_model_name: `%${search}%`,
            })
            .orWhere('machine_model.machine_model_ip LIKE :machine_model_ip', {
              machine_model_ip: `%${search}%`,
            });
        }),
      );
    }

    if (machine_model_status) {
      machineModelBuilder.andWhere('machine_model.machine_model_status = :machine_model_status', {
        machine_model_status,
      });
    }

    const items = await machineModelBuilder.getMany();

    return listItems(items, page, limit, filter);
  }

  async findMachineModels(): Promise<MachineModel[]> {
    const queryBuilder = this.machineModelRepository
      .createQueryBuilder('machine_model')
      .where('machine_model.machine_model_status = :machine_model_status', {
        machine_model_status: 1,
      })
      .orderBy('machine_model.machine_model_name', 'ASC');

    return await queryBuilder.getMany();
  }

  async findOne(machine_model_id: number): Promise<MachineModel> {
    Validations.getInstance().validateWithRegex(`${machine_model_id}`, ValidType.IS_NUMBER);

    if (machine_model_id > ObjectSize.INTEGER) {
      throw new BadRequestException(
        new ErrorResponse(CodeError.INVALID_NUMBER, `Número de id invalido`),
      );
    }

    const machineModel = await this.machineModelRepository
      .createQueryBuilder('machine_model')
      .where('machine_model.machine_model_id = :machine_model_id', { machine_model_id })
      .getOne();

    if (!machineModel)
      throw new BadRequestException(new ErrorResponse(CodeError.NOT_FOUND, `Máquina não existe`));

    return machineModel;
  }

  async changeStatus(machine_model_id: number): Promise<MachineModel> {
    const machineModel = await this.machineModelRepository
      .createQueryBuilder('machine')
      .where('machine.machine_model_id = :machine_model_id', { machine_model_id })
      .leftJoinAndSelect('machine.processes', 'processes')
      .getOne();

    const isMachineOnProcess = machineModel?.processes.some((e) => e.process_status === true);

    if (isMachineOnProcess) {
      throw new BadRequestException(
        new ErrorResponse(CodeError.IN_PROCESS, `Máquina está em processo`),
      );
    }

    machineModel.machine_model_status = !machineModel.machine_model_status;

    return this.machineModelRepository.save(machineModel);
  }
}
