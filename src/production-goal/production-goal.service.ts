import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductionGoal } from './entities/production-goal.entity';
import { LessThan, Repository } from 'typeorm';
import { CreateProductionGoalDto } from './dto/create-production-goal.dto';
import { PipeModelService } from 'src/pipe-model/pipe-model.service';
import { DailyProductionService } from 'src/daily-production/daily-production.service';
import { ProductionGoalFilter } from './dto/filter-production-goal.dto';
import { Pagination } from 'nestjs-typeorm-paginate';
import { CodeError, ValidType } from 'src/common/enums';
import { UpdateProductionGoalDto } from './dto/update-production-goal.dto';
import { DailyProduction } from 'src/daily-production/entities/daily-production.entity';
import { Validations } from 'src/common/validations';
import { ErrorResponse } from 'src/common/error-reponse';
import * as xlsx from 'xlsx';
import * as fs from 'fs';
import { BufferedFile } from 'src/common/services/minio/interfaces/file.interface';
import { IRow } from './interfaces/row-upload.interface';
import { listItems } from 'src/common/pagination/pagination.Utils';
import { Utils } from 'src/common/utils';
@Injectable()
export class ProductionGoalService {
  constructor(
    @InjectRepository(ProductionGoal)
    private readonly productionGoalRepository: Repository<ProductionGoal>,
    private pipeModelService: PipeModelService,
    @InjectRepository(DailyProduction)
    private readonly dailyProductionRepository: Repository<DailyProduction>,
    private dailyProductionService: DailyProductionService,
  ) {}

  //* Verificar situation 3 (se a meta tá vencida)!
  async checkAndUpdateProductionGoalAndForAll(): Promise<void> {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - 1);

    const goalsToUpdate = await this.productionGoalRepository.find({
      where: {
        production_goal_produced: 0,
        production_goal_finish_date: LessThan(currentDate),
      },
    });

    for (const goal of goalsToUpdate) {
      goal.production_goal_situation = 3;
    }

    await this.productionGoalRepository.save(goalsToUpdate);
  }

  //* Verificar situation 4 (se a meta tá atrasada)!
  async checkAndUpdateProductionGoalStatusForAll(): Promise<void> {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const goalsToUpdate = await this.productionGoalRepository.find({
      where: {
        production_goal_situation: 1,
        production_goal_produced: 0,
        production_goal_start_date: LessThan(currentDate),
      },
    });

    for (const goal of goalsToUpdate) {
      goal.production_goal_situation = 4;
    }

    await this.productionGoalRepository.save(goalsToUpdate);
  }

  //* Verificar situation 5 // incompleto
  async changeSituationFive(production_goal_id: number) {
    const goal = await this.productionGoalRepository.findOne({
      where: {
        production_goal_id: production_goal_id,
      },
    });

    if (
      (goal.production_goal_situation === 2 || goal.production_goal_situation === 3) &&
      goal.production_goal_produced < goal.production_goal_expected &&
      goal.production_goal_finish_date < new Date()
    ) {
      goal.production_goal_situation = 5;
      await this.productionGoalRepository.save(goal);
    }
  }

  //* Verificar situation 6 // concluido
  async changeSituationSix(production_goal_id: number) {
    const goal = await this.productionGoalRepository.findOne({
      where: {
        production_goal_id: production_goal_id,
      },
    });

    if (
      (goal.production_goal_situation === 2 || goal.production_goal_situation === 4) &&
      goal.production_goal_produced >= goal.production_goal_expected
    ) {
      goal.production_goal_situation = 6;
      await this.productionGoalRepository.save(goal);
    }
  }

  //* Muda status de elaborado
  async changeElaboratedStatusForAll() {
    const allProductionGoals = await this.productionGoalRepository.find();

    for (const productionGoal of allProductionGoals) {
      const dailyProductions = await this.dailyProductionRepository.find({
        where: {
          production_goal_id: productionGoal.production_goal_id,
        },
      });

      const total = dailyProductions.reduce((acc: number, curr: DailyProduction) => {
        return acc + curr.daily_production_goal;
      }, 0);

      if (total >= productionGoal.production_goal_expected) {
        productionGoal.production_goal_elaborated = true;
      } else {
        productionGoal.production_goal_elaborated = false;
      }

      await this.productionGoalRepository.save(productionGoal);
    }
  }

  //* Criando production Goal Manual
  async create(createProductionGoalDto: CreateProductionGoalDto): Promise<ProductionGoal> {
    const {
      production_goal_order,
      pipe_model_id,
      production_goal_finish_date,
      production_goal_start_date,
    } = createProductionGoalDto;

    const goal = this.productionGoalRepository.create(createProductionGoalDto);

    if (!goal.production_goal_order)
      throw new BadRequestException(`O campo ordem de produção não pode estar vazio`);

    Validations.getInstance().validateWithRegex(
      goal.production_goal_order,
      'Ordem de produção',
      ValidType.IS_NUMBER,
      ValidType.NO_SPACE,
    );
    Validations.getInstance().verifyLength(goal.production_goal_order, 'Ordem de produção', 7, 8);

    const existingGoal = await this.productionGoalRepository.findOne({
      where: {
        production_goal_order,
      },
    });

    if (existingGoal) {
      throw new BadRequestException(`Ordem de produção já cadastrada`);
    }

    const isPipeRegistered = await this.pipeModelService.findOne(pipe_model_id);

    if (!isPipeRegistered) {
      throw new BadRequestException(`Esse tubo não existe`);
    }

    if (isPipeRegistered.pipe_model_status == false) {
      throw new BadRequestException(`Esse tubo está desativado`);
    }

    if (!production_goal_finish_date) {
      throw new BadRequestException(`O campo data final não pode estar vazio`);
    }

    if (!production_goal_start_date) {
      throw new BadRequestException(`O campo data de início não pode estar vazio`);
    }

    if (!goal.production_goal_expected && goal.production_goal_expected !== 0) {
      throw new BadRequestException(`O campo Quantidade  não pode estar vazio`);
    }

    if (!Number.isInteger(goal.production_goal_expected)) {
      throw new BadRequestException(`O campo Quantidade deve ser um número inteiro`);
    }

    if (goal.production_goal_expected <= 0) {
      throw new BadRequestException(`Não é possível cadastrar uma quantidade menor que 1`);
    }

    if (goal.production_goal_expected > 99999) {
      throw new BadRequestException(
        `Não é possível cadastrar uma quantidade igual ou superior a 100000`,
      );
    }

    const startDateIsValid = Utils.getInstance().isValidDate(production_goal_start_date);
    const finishDateIsValid = Utils.getInstance().isValidDate(production_goal_finish_date);

    if (!startDateIsValid) {
      throw new BadRequestException(
        new ErrorResponse(CodeError.INVALID_DATE, 'A data de início não é válida'),
      );
    }

    if (!finishDateIsValid) {
      throw new BadRequestException(
        new ErrorResponse(CodeError.INVALID_DATE, 'A data final não é válida'),
      );
    }

    goal.production_goal_start_date = new Date(createProductionGoalDto.production_goal_start_date);
    goal.production_goal_finish_date = new Date(
      createProductionGoalDto.production_goal_finish_date,
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (goal.production_goal_start_date < today) {
      throw new BadRequestException(
        new ErrorResponse(
          CodeError.INVALID_DATE_RANGER,
          'Não é possível definir data de início para um dia antes de hoje',
        ),
      );
    }

    if (goal.production_goal_finish_date < goal.production_goal_start_date) {
      throw new BadRequestException(
        new ErrorResponse(
          CodeError.INVALID_DATE_RANGER,
          'A data final da ordem de produção não pode anteceder a data de início',
        ),
      );
    }

    const maxDate = new Date(goal.production_goal_start_date);
    maxDate.setDate(maxDate.getDate() + 60);

    if (goal.production_goal_finish_date > maxDate) {
      throw new BadRequestException(
        new ErrorResponse(
          CodeError.INVALID_DATE_RANGER,
          'A ordem de produção não pode ultrapassar 60 dias',
        ),
      );
    }

    goal.production_goal_situation = 1;
    goal.production_goal_produced = 0;
    goal.production_goal_created_at = new Date();
    goal.production_goal_elaborated = false;

    const savedGoal = await this.productionGoalRepository.save(goal);

    await this.dailyProductionService.generateDailyProductionGoalsTrue(savedGoal);

    return savedGoal;
  }

  //* Criar production goal com upload de excel
  async createProcessExcel(file: BufferedFile): Promise<ProductionGoal[]> {
    const maxFileSize = 32768;

    if (file.size > maxFileSize)
      throw new BadRequestException(
        new ErrorResponse(CodeError.MAX_SIZE, 'Tamanho máximo do arquivo permitido é de 32KB'),
      );

    if (!file.originalname.includes('.xlsx'))
      throw new BadRequestException(
        new ErrorResponse(
          CodeError.INVALID_TYPE,
          'Somente arquivos em formato xlsx (excel) são permitidos',
        ),
      );

    const workbook = xlsx.read(fs.readFileSync(file.path), { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data: IRow[] = xlsx.utils.sheet_to_json(sheet);

    if (!data[0] || !data[0].Ordem)
      throw new BadRequestException(
        new ErrorResponse(CodeError.EMPTY_FILE, 'Arquivo não contém nenhuma OP válida'),
      );

    const productionGoals: any = [];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    for (let i = 0; i < data.length - 1; i++) {
      const row = data[i];

      if (
        !row.Ordem ||
        !row['Quantidade da ordem (GMEIN)'] ||
        !row['Data início (prog.)'] ||
        !row['Data de conclusão base'] ||
        !row.Material
      )
        throw new BadRequestException(
          'Informações de ordem de produção estão faltando, verifique se alguma das as seguintes colunas estão faltando: Material, Texto breve material, Ordem, Data início (prog.), Quantidade da ordem (GMEIN), Data de conclusão base',
        );

      Validations.getInstance().validateWithRegex(
        `${row['Quantidade da ordem (GMEIN)']}`,
        `quantidade inválida: ${row.Ordem}`,
        ValidType.IS_EXCEL_NUMBER,
      );

      if (row['Quantidade da ordem (GMEIN)'] < 0)
        throw new BadRequestException(`Ordem de produção com quantidade inválida: ${row.Ordem}`);

      Validations.getInstance().validateWithRegex(
        `${row.Ordem}`,
        `número de op inválido: ${row.Ordem}`,
        ValidType.IS_EXCEL_NUMBER,
      );

      const startDate = new Date(1900, 0, row['Data início (prog.)'] - 1);
      const finishDate = new Date(1900, 0, row['Data de conclusão base'] - 1);

      if (startDate < yesterday)
        throw new BadRequestException(
          `Ordem de produção com data inicial anterior ao dia de hoje: ${row.Ordem}`,
        );

      if (finishDate < startDate) {
        throw new BadRequestException(
          new ErrorResponse(
            CodeError.INVALID_DATE_RANGER,
            `A data final da ordem de produção não pode anteceder a data de início: ${row.Ordem}`,
          ),
        );
      }

      const pipeModel = await this.pipeModelService.findByPipeCode(row.Material);

      if (!pipeModel) throw new BadRequestException(`Material não encontrado: ${row.Material}`);

      if (!pipeModel.pipe_model_status) throw new BadRequestException(`Esse tubo está desativado`);

      const productionGoalAlreadyExists = await this.productionGoalRepository.findOne({
        where: { production_goal_order: String(row.Ordem) },
      });

      if (productionGoalAlreadyExists)
        throw new BadRequestException(`Ordem de Produção já cadastrada: ${row.Ordem}`);

      const productionGoal = this.productionGoalRepository.create({
        production_goal_order: String(row.Ordem),
        production_goal_expected: row['Quantidade da ordem (GMEIN)'],
        production_goal_start_date: startDate,
        production_goal_finish_date: finishDate,
        pipe_model_id: pipeModel.pipe_model_id,
        production_goal_situation: 1,
        production_goal_produced: 0,
        production_goal_created_at: new Date(),
        production_goal_elaborated: false,
      });

      productionGoals.push(productionGoal);
    }
    await this.productionGoalRepository.save(productionGoals);
    for (const productionGoal of productionGoals) {
      await this.dailyProductionService.generateDailyProductionGoalsTrue(productionGoal);
    }
    return productionGoals;
  }

  //* Atualizando production goal
  async updateProductionGoal(
    id: number,
    updateDto: UpdateProductionGoalDto,
  ): Promise<ProductionGoal> {
    const {
      pipe_model_id,
      production_goal_order,
      production_goal_expected,
      production_goal_finish_date,
      production_goal_start_date,
    } = updateDto;

    const goal = await this.productionGoalRepository.preload({
      production_goal_id: id,
      ...updateDto,
    });

    if (production_goal_order) {
      Validations.getInstance().validateWithRegex(
        production_goal_order,
        'Ordem de produção',
        ValidType.IS_NUMBER,
        ValidType.NO_SPACE,
      );

      Validations.getInstance().verifyLength(production_goal_order, 'Ordem de produção', 7, 8);

      const foundOP = await this.getProductionGoalOrder(production_goal_order);

      if (foundOP && foundOP.production_goal_id != id) {
        throw new BadRequestException(`Essa Ordem de Produção pertence a outra meta`);
      }
    }

    if (pipe_model_id) {
      const isPipeRegistered = await this.pipeModelService.findOne(pipe_model_id);

      if (!isPipeRegistered) {
        throw new BadRequestException(`Esse tubo não existe`);
      }

      if (isPipeRegistered.pipe_model_status == false) {
        throw new BadRequestException(`Esse tubo está desativado`);
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (production_goal_start_date) {
      const startDateIsValid = Utils.getInstance().isValidDate(
        updateDto.production_goal_start_date,
      );

      if (!startDateIsValid) {
        throw new BadRequestException(
          new ErrorResponse(CodeError.INVALID_DATE, 'A data de início não é válida'),
        );
      }

      goal.production_goal_start_date = new Date(updateDto.production_goal_start_date);

      if (goal.production_goal_start_date < today) {
        throw new BadRequestException(
          new ErrorResponse(
            CodeError.INVALID_DATE_RANGER,
            'Não é possível definir data de início para hoje ou qualquer dia antes de hoje',
          ),
        );
      }
    }

    if (production_goal_finish_date) {
      const finishDateIsValid = Utils.getInstance().isValidDate(
        updateDto.production_goal_finish_date,
      );

      if (!finishDateIsValid) {
        throw new BadRequestException(
          new ErrorResponse(CodeError.INVALID_DATE, 'A data final não é válida'),
        );
      }

      goal.production_goal_finish_date = new Date(updateDto.production_goal_finish_date);

      if (goal.production_goal_finish_date < new Date(goal.production_goal_start_date)) {
        throw new BadRequestException(
          new ErrorResponse(
            CodeError.INVALID_DATE_RANGER,
            'A data final da ordem de produção não pode anteceder a data de início',
          ),
        );
      }

      const maxDate = new Date(goal.production_goal_start_date);
      maxDate.setDate(maxDate.getDate() + 60);

      if (goal.production_goal_finish_date > maxDate) {
        throw new BadRequestException(
          new ErrorResponse(
            CodeError.INVALID_DATE_RANGER,
            'A ordem de produção não pode ultrapassar 60 dias',
          ),
        );
      }
    }

    if (production_goal_expected) {
      if (!Number.isInteger(goal.production_goal_expected)) {
        throw new BadRequestException(`O campo Quantidade deve ser um número inteiro`);
      }

      if (production_goal_expected <= 0) {
        throw new BadRequestException(`Não é possível cadastrar uma quantidade menor que 1`);
      }

      if (production_goal_expected > 99999) {
        throw new BadRequestException(
          `Não é possível cadastrar uma quantidade igual ou superior a 100000`,
        );
      }
    }

    if (goal.production_goal_produced > 0) {
      throw new BadRequestException(
        'Não é possivel atualizar uma meta de produção que já está em execução!',
      );
    }

    if (goal.production_goal_situation === 2) {
      throw new BadRequestException(
        'Não é possivel atualizar uma meta de produção que está em andamento',
      );
    }

    if (goal.production_goal_situation === 3) {
      throw new BadRequestException(
        'Não é possivel atualizar uma meta de produção que está vencida',
      );
    }

    if (goal.production_goal_situation === 4) {
      throw new BadRequestException(
        'Não é possivel atualizar uma meta de produção que está atrasada',
      );
    }

    goal.production_goal_elaborated = false;

    const updatedGoal = await this.productionGoalRepository.save(goal);

    await this.dailyProductionRepository.delete({ production_goal_id: goal.production_goal_id });

    await this.dailyProductionService.generateDailyProductionGoalsTrue(updatedGoal);

    return updatedGoal;
  }

  //* Listando todas as production goal
  async getAll(filter: ProductionGoalFilter): Promise<Pagination<ProductionGoal>> {
    const { search, production_goal_situation, production_goal_elaborated, page, limit } = filter;

    const builder = this.productionGoalRepository.createQueryBuilder('goal');

    if (search) {
      builder.andWhere('goal.production_goal_order LIKE :production_goal_order', {
        production_goal_order: `%${search}%`,
      });
    }

    if (production_goal_situation) {
      builder.andWhere('goal.production_goal_situation = :production_goal_situation', {
        production_goal_situation,
      });
    }

    if (production_goal_elaborated) {
      builder.andWhere('goal.production_goal_elaborated = :production_goal_elaborated', {
        production_goal_elaborated,
      });
    }

    builder.orderBy('goal.production_goal_created_at', 'DESC');

    const items = await builder.getMany();
    const returnPagination = listItems(items, page, limit, filter);

    return returnPagination;
  }

  //* Listagem por id
  async findById(production_goal_id: number): Promise<ProductionGoal> {
    return await this.productionGoalRepository
      .createQueryBuilder('goal')
      .leftJoinAndSelect('goal.pipeModel', 'pipeModel')
      .leftJoinAndSelect('goal.dailyProduction', 'dailyProduction')
      .where('goal.production_goal_id = :production_goal_id', {
        production_goal_id: production_goal_id,
      })
      .orderBy('dailyProduction.daily_production_date', 'ASC')
      .getOne();
  }

  //* Listagem por op
  async getProductionGoalOrder(production_goal_order: string): Promise<ProductionGoal> {
    return await this.productionGoalRepository
      .createQueryBuilder('goal')
      .leftJoinAndSelect('goal.pipeModel', 'pipeModel')
      .where('production_goal_order = :production_goal_order', {
        production_goal_order: production_goal_order,
      })
      .getOne();
  }
}
