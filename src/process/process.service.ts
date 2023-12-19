import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Process } from './entities/process.entity';
import { ProcessCreateDto } from './dto/process-create.dto';
import { MachineModel } from 'src/machine-model/entities/machine-model.entity';
import { RedisService } from 'src/config/cache/redis.service';
import { DailyProduction } from 'src/daily-production/entities/daily-production.entity';
import { ProductionGoalService } from 'src/production-goal/production-goal.service';
import { DailyProductionService } from 'src/daily-production/daily-production.service';
import { ProcessFilter } from './dto/filter-process.dto';

@Injectable()
export class ProcessService {
  constructor(
    @InjectRepository(Process)
    private processRepository: Repository<Process>,
    @InjectRepository(MachineModel)
    private machineModelRepository: Repository<MachineModel>,
    @InjectRepository(DailyProduction)
    private readonly dailyProductionRepository: Repository<DailyProduction>,
    private readonly productionGoalService: ProductionGoalService,
    private readonly dailyProductionService: DailyProductionService,
    private readonly redisService: RedisService,
  ) {}

  //* Listando todos os processos por nome da maquina
  async getAllProcessesWithMachineName(filter: ProcessFilter): Promise<Process[]> {
    const { search } = filter;

    const processBuilder = this.processRepository
      .createQueryBuilder('process')
      .leftJoinAndSelect('process.machineModel', 'machineModel')
      .leftJoinAndSelect('process.dailyProduction', 'dailyProduction')
      .leftJoinAndSelect('dailyProduction.productionGoal', 'productionGoal')
      .leftJoinAndSelect('productionGoal.pipeModel', 'pipeModel');

    if (search) {
      processBuilder.andWhere(
        new Brackets((queryBuilderOne) => {
          queryBuilderOne.where('machineModel.machine_model_name LIKE :machine_model_name', {
            machine_model_name: `%${search}%`,
          });
        }),
      );
    }

    return await processBuilder.getMany();
  }

  //* Iniciando um processo de produção
  async createProcess(processDto: ProcessCreateDto): Promise<Process[]> {
    const dailyProduction = await this.dailyProductionRepository.findOne({
      where: {
        daily_production_id: processDto.daily_production_id,
      },
    });
    if (!dailyProduction) {
      throw new NotFoundException('Daily Production não existe');
    }

    if (!dailyProduction.daily_production_goal) {
      throw new BadRequestException('Não e possível iniciar um processo com uma meta diária vazia');
    }

    //* Verificar se já existe um processo em execução para alguma das máquinas
    const existingRunningProcess = await this.processRepository
      .createQueryBuilder('process')
      .where('process.machine_model_id IN (:...machineIds)', {
        machineIds: processDto.machine_model_ids,
      })
      .getOne();

    if (existingRunningProcess) {
      throw new ConflictException('Pelo menos uma das máquinas já está em processo');
    }

    //* Criar uma matriz para armazenar os processos criados
    const createdProcesses: Process[] = [];

    for (const machineModelId of processDto.machine_model_ids) {
      // *Verificar se a máquina existe
      const machine = await this.machineModelRepository.findOne({
        where: {
          machine_model_id: machineModelId,
        },
      });

      if (!machine) {
        throw new NotFoundException(`Machine com machine_model_id ${machineModelId} não existe`);
      }

      //* Criar um novo processo para a máquina!
      const process = this.processRepository.create({
        machine_model_id: machineModelId,
        daily_production_id: processDto.daily_production_id,
        process_status: true,
      });

      await this.dailyProductionService.changeSituationDailyTwo(process.daily_production_id);
      const createdProcess = await this.processRepository.save(process);

      const redisKey = `machine:${createdProcess.machine_model_id}`;

      const completeProcess = await this.processRepository
        .createQueryBuilder('process')
        .leftJoinAndSelect('process.machineModel', 'machineModel')
        .leftJoinAndSelect('process.dailyProduction', 'dailyProduction')
        .leftJoinAndSelect('dailyProduction.productionGoal', 'productionGoal')
        .leftJoinAndSelect('productionGoal.pipeModel', 'pipeModel')
        .leftJoinAndSelect('pipeModel.pipeModelAngle', 'pipeModelAngle')
        .leftJoinAndSelect('pipeModelAngle.angles', 'angles')
        .where('process.process_id = :processId', { processId: createdProcess.process_id })
        .getOne();

      // *Adicionar o processo criado à matriz
      createdProcesses.push(completeProcess);
      try {
        const redisValue = JSON.stringify(completeProcess);
        await this.redisService.set(redisKey, redisValue);
      } catch (error) {
        console.error('Error adding process data to Redis:', error);
      }
    }

    return createdProcesses;
  }
  //* Metodo utilizado ao finalizar um processo
  async findProcessesByMachineIp(machineModelIp: string): Promise<Process | null> {
    return this.processRepository
      .createQueryBuilder('process')
      .leftJoinAndSelect('process.machineModel', 'machineModel')
      .leftJoinAndSelect('process.dailyProduction', 'dailyProduction')
      .leftJoinAndSelect('dailyProduction.productionGoal', 'productionGoal')
      .leftJoinAndSelect('productionGoal.pipeModel', 'pipeModel')
      .where('machineModel.machine_model_ip = :machineModelIp', { machineModelIp })
      .getOne();
  }

  //* finalizando um processo de produção
  async changeProcessStatusByMachineIp(machineModelIp: string) {
    const processSaved = await this.findProcessesByMachineIp(machineModelIp);

    const redisKey = `machine:${processSaved.machine_model_id}`;

    try {
      const redisValue = JSON.stringify(processSaved);
      await this.redisService.set(redisKey, redisValue);
    } catch (error) {
      console.error('Error adding process data to Redis:', error);
    }
    //* situation 5 e 6 pra dailys
    await this.dailyProductionService.changeSituationDailyFive(
      processSaved.dailyProduction.daily_production_id,
    );
    await this.dailyProductionService.changeSituationDailySix(
      processSaved.dailyProduction.daily_production_id,
    );

    //* situation 5 e 6 pra production goals
    await this.productionGoalService.changeSituationFive(
      processSaved.dailyProduction.productionGoal.production_goal_id,
    );
    await this.productionGoalService.changeSituationSix(
      processSaved.dailyProduction.productionGoal.production_goal_id,
    );

    await this.redisService.del(redisKey);
    return await this.processRepository.remove(processSaved);
  }
}
