import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DailyProduction } from './entities/daily-production.entity';
import { Repository } from 'typeorm';
import { ProductionGoal } from 'src/production-goal/entities/production-goal.entity';
import { isWeekend } from 'date-fns';
import { DailyProductionEditDTO } from './dto/update-daily-production.dto';
import { ProductionGoalService } from 'src/production-goal/production-goal.service';

@Injectable()
export class DailyProductionService {
  constructor(
    @InjectRepository(DailyProduction)
    private readonly dailyProductionRepository: Repository<DailyProduction>,
    @InjectRepository(ProductionGoal)
    private readonly productionGoalRepository: Repository<ProductionGoal>,
  ) {}

  async getDailyProductionWithMachines(): Promise<DailyProduction[]> {
    return this.dailyProductionRepository
      .createQueryBuilder('daily')
      .leftJoinAndSelect('daily.productionGoal', 'productionGoal')
      .leftJoinAndSelect('productionGoal.pipeModel', 'pipeModel')
      .leftJoinAndSelect('daily.processes', 'processes')
      .leftJoinAndSelect('processes.machineModel', 'machineModel')
      .where('processes.process_status = :status', { status: true })
      .getMany();
  }

  // ! Listagem de todas as op
  async findAll(): Promise<DailyProduction[]> {
    return await this.dailyProductionRepository.find();
  }

  // ! Listagem de produções diárias por op
  async findByProductionGoalOrder(productionGoalOrder: string): Promise<DailyProduction[]> {
    const productionGoal = await this.productionGoalRepository.findOne({
      where: { production_goal_order: productionGoalOrder },
    });

    if (!productionGoal) {
      throw new NotFoundException('Production goal order não existe');
    }

    return this.dailyProductionRepository.find({
      where: { production_goal_id: productionGoal.production_goal_id },
      order: { daily_production_date: 'ASC' },
    });
  }

  // ! Criar varias dailys com uma production goal
  async generateDailyProductionGoalsTrue(productionGoal: ProductionGoal): Promise<void> {
    const { production_goal_start_date, production_goal_finish_date, production_goal_expected } =
      productionGoal;
    const currentDate = new Date(production_goal_start_date);
    const endDate = new Date(production_goal_finish_date);
    const totalDays =
      Math.ceil((endDate.getTime() - currentDate.getTime()) / (1000 * 3600 * 24)) + 1;

    // *const chamada somente para dividir os valores iguais para cada dia de produção
    // *const dailyProductionGoal = Math.ceil(production_goal_expected / totalDays);

    while (currentDate <= endDate) {
      const dailyProduction = new DailyProduction();
      dailyProduction.production_goal_id = productionGoal.production_goal_id;
      dailyProduction.daily_production_date = currentDate;
      dailyProduction.daily_production_goal = 0; //**dailyProductionGoal;
      dailyProduction.daily_production_produced = 0;
      dailyProduction.daily_production_situation = 1;
      await this.dailyProductionRepository.save(dailyProduction);
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  // ! Verificar situation 2 pra production goal
  async changeSituationTwo(production_goal_id: number) {
    const goal = await this.productionGoalRepository.findOne({
      where: {
        production_goal_id: production_goal_id,
      },
    });

    if (goal.production_goal_situation === 1) {
      goal.production_goal_situation = 2;
      await this.productionGoalRepository.save(goal);
    }
  }

  //! Ativar situation 2 pra daily production
  async changeSituationDailyTwo(daily_production_id: number) {
    const goal = await this.dailyProductionRepository.findOne({
      where: {
        daily_production_id: daily_production_id,
      },
    });

    if (goal.daily_production_situation === 1) {
      goal.daily_production_situation = 2;
      await this.changeSituationTwo(goal.production_goal_id);
      await this.dailyProductionRepository.save(goal);
    }
  }

  // ! Verificar situation 5 // incompleto
  async changeSituationDailyFive(daily_production_id: number) {
    const goal = await this.dailyProductionRepository.findOne({
      where: {
        daily_production_id: daily_production_id,
      },
    });

    if (
      goal.daily_production_situation === 2 &&
      goal.daily_production_produced < goal.daily_production_goal
    ) {
      goal.daily_production_situation = 5;
      await this.dailyProductionRepository.save(goal);
    }
  }

  // ! Verificar situation 6 // concluido
  async changeSituationDailySix(daily_production_id: number) {
    const goal = await this.dailyProductionRepository.findOne({
      where: {
        daily_production_id: daily_production_id,
      },
    });

    if (
      goal.daily_production_situation === 2 &&
      goal.daily_production_produced >= goal.daily_production_goal
    ) {
      goal.daily_production_situation = 6;
      await this.dailyProductionRepository.save(goal);
    }
  }

  // ! metodo chamado em editMultipleProduced
  async getProductionGoalExpected(production_goal_id: number): Promise<number> {
    const goal = await this.productionGoalRepository.findOne({
      where: {
        production_goal_id: production_goal_id,
      },
    });
    if (!goal) {
      throw new NotFoundException(`Meta de produção com ID ${production_goal_id} não encontrada`);
    }
    return goal.production_goal_expected;
  }

  // ! editar varias dailys depois de criar uma production goal
  async editMultipleProduced(edits: DailyProductionEditDTO[]): Promise<void> {
    for (const edit of edits) {
      const dailyProduction = await this.dailyProductionRepository.findOne({
        where: {
          daily_production_id: edit.daily_production_id,
        },
      });
      if (!dailyProduction) {
        throw new NotFoundException(
          `Produção diária com ID ${edit.daily_production_id} não encontrada`,
        );
      }

      const productionGoalExpected = await this.getProductionGoalExpected(
        dailyProduction.production_goal_id,
      );

      if (edit.daily_production_goal < 0) {
        throw new BadRequestException(
          'Não é possível cadastrar uma meta diária com número negativo',
        );
      }

      if (!Number.isInteger(edit.daily_production_goal)) {
        throw new BadRequestException(`O campo Quantidade deve ser um número inteiro`);
      }

      if (edit.daily_production_goal > productionGoalExpected) {
        throw new BadRequestException(
          'Meta diária não pode ser maior que a meta de produção esperada',
        );
      }

      dailyProduction.daily_production_goal = edit.daily_production_goal;
      await this.dailyProductionRepository.save(dailyProduction);
    }
  }

  //! Endpoint que lista todas as dailys production de hoje
  async getAllDailyProductionForDay(): Promise<DailyProduction[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.dailyProductionRepository
      .createQueryBuilder('daily')
      .leftJoinAndSelect('daily.productionGoal', 'productionGoal')
      .leftJoinAndSelect('productionGoal.pipeModel', 'pipeModel')
      .where('daily.daily_production_date = :today', { today })
      .getMany();
  }
}
