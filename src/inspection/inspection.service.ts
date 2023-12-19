import { Injectable, NotFoundException } from '@nestjs/common';
import { Inspection } from './entities/inspection.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RedisService } from 'src/config/cache/redis.service';
import { FilterProductivityHours } from './dto/filter-productivity-hours';
import { FilterProductivityDate } from './dto/filter-productivity-date';
import { DailyProduction } from 'src/daily-production/entities/daily-production.entity';

@Injectable()
export class InspectionService {
  constructor(
    @InjectRepository(Inspection)
    private readonly inspectionRepository: Repository<Inspection>,
    @InjectRepository(DailyProduction)
    private readonly dailyProductionRepository: Repository<DailyProduction>,
    private readonly redisService: RedisService,
  ) {}

  //* listagem de todos as inspeções.
  async findAll() {
    return await this.inspectionRepository.find();
  }

  //* Método usado no endpoint updateProductionProducedFromInspection.
  private async findDailyProductionByDailyProductionId(
    dailyProductionId: number,
  ): Promise<DailyProduction | undefined> {
    try {
      return await this.dailyProductionRepository.findOne({
        where: { daily_production_id: dailyProductionId },
      });
    } catch (error) {
      throw new Error('Error finding daily production by daily_production_id: ' + error);
    }
  }

  //* Endpoint utilizado para atualizar daily production na tabela daily_production.
  async updateProductionProducedFromInspection(): Promise<void> {
    try {
      const inspections = await this.inspectionRepository.find();

      for (const inspection of inspections) {
        const dailyProduction = await this.findDailyProductionByDailyProductionId(
          inspection.inspection_daily_production_id,
        );

        if (dailyProduction) {
          dailyProduction.daily_production_produced =
            inspection.inspection_daily_production_produced;

          await this.dailyProductionRepository.save(dailyProduction);
        }
      }
    } catch (error) {
      throw new Error('Error updating production produced from inspection: ' + error);
    }
  }

  //* Método utilizado em saveDataToDatabase.
  async create(data: Partial<Inspection>): Promise<Inspection> {
    const inspection = this.inspectionRepository.create(data);
    return await this.inspectionRepository.save(inspection);
  }

  //* Salvando dados da IA do REDIS no banco de dados
  async saveDataToDatabase(): Promise<void> {
    try {
      const rawData = await this.redisService.hgetall('production');

      if (rawData) {
        // *Inicialize um array para armazenar os dados das inspeções
        const inspections: Partial<Inspection>[] = [];

        // *Itere pelos campos da hash (que são chaves UUID)
        for (const key of Object.keys(rawData)) {
          const value = rawData[key];

          // *Analise o valor JSON
          const inspectionData = JSON.parse(value);

          //*Fazendo contagem das dailys ids que ja existe no banco
          const existingCount = await this.inspectionRepository.count({
            where: { inspection_daily_production_id: inspectionData.daily_production_id },
          });

          //* Incrementando contagem
          const newProductionProduced = existingCount + 1;

          // *Adicione os dados da inspeção ao array
          inspections.push({
            inspection_process_id: inspectionData.op,
            inspection_process_status: true,
            inspection_machine_model_id: inspectionData.machine_id,
            inspection_daily_production_id: inspectionData.daily_production_id,
            inspection_daily_production_produced: newProductionProduced, //* Chamando incrementação de contagem de dailys
            inspection_daily_production_date: inspectionData.daily_production.daily_production_date,
            inspection_pipe_model_id: inspectionData.daily_production.productionGoal.pipe_model_id,
            inspection_production_goal_id: inspectionData.daily_production.production_goal_id,
            inspection_status: inspectionData.approved,
            inspection_clp_count: inspectionData.inspection_clp_count,
            // *Adicione outros campos conforme necessário
          });
        }
        for (const inspection of inspections) {
          await this.create(inspection);
        }

        //* Deletando key para não repetir os dados.
        await this.redisService.del('production');
      }
    } catch (error) {
      throw new Error('Error saving data to the database: ' + error);
    }
  }

  //! MÉTODOS PARA O GRÁFICO DE PRODUTIVIDADE !//
  async getProductivityHors(filter: FilterProductivityHours) {
    const {
      inspection_daily_production_date,
      inspection_machine_model_id,
      inspection_pipe_model_id,
      start_hour,
      end_hour,
    } = filter;

    const inspection = this.inspectionRepository.createQueryBuilder('inspection');

    if (inspection_machine_model_id) {
      inspection.andWhere('inspection.inspection_machine_model_id = :inspection_machine_model_id', {
        inspection_machine_model_id,
      });
    }

    if (inspection_pipe_model_id) {
      inspection.andWhere('inspection.inspection_pipe_model_id = :inspection_pipe_model_id', {
        inspection_pipe_model_id,
      });
    }

    if (inspection_daily_production_date) {
      inspection.andWhere(
        'CONVERT(DATE, inspection_daily_production_date) = :inspection_daily_production_date',
        { inspection_daily_production_date },
      );
    }

    if (start_hour > end_hour) {
      throw new NotFoundException(`A hora inicial não pode ser maior que a hora final`);
    }

    if ((start_hour && !end_hour) || (!start_hour && end_hour)) {
      throw new NotFoundException(`Selecione um intervalo de hora`);
    }

    if (start_hour || end_hour) {
      inspection
        .andWhere('DATEPART(HOUR, inspection_daily_production_date) >= :start_hour', { start_hour })
        .andWhere('DATEPART(HOUR, inspection_daily_production_date) <= :end_hour', { end_hour });
    }

    let inspectionGet = await inspection.getMany();

    let final = [];

    final.push(
      inspectionGet.reduce((acc, cur) => {
        let hours = cur.inspection_daily_production_date.getHours();
        if (!acc[hours]) {
          acc[hours] = {
            hours_inspection: hours,
            inspection_approved: cur.inspection_status ? 1 : 0,
            inspection_reproved: cur.inspection_status ? 0 : 1,
            inspection_clp_count: 1,
          };
        } else {
          acc[hours].inspection_approved += cur.inspection_status ? 1 : 0;
          acc[hours].inspection_reproved += cur.inspection_status ? 0 : 1;
          acc[hours].inspection_clp_count =
            acc[hours].inspection_approved + acc[hours].inspection_reproved;
        }
        return acc;
      }, {}),
    );

    final = final.map((item) => {
      return Object.values(item);
    })[0];

    return final;
  }

  async getProductivityDate(filter: FilterProductivityDate) {
    const { inspection_machine_model_id, inspection_pipe_model_id, start_date, end_date } = filter;
    const inspection = this.inspectionRepository.createQueryBuilder('inspection');

    if (inspection_machine_model_id) {
      inspection.andWhere('inspection.inspection_machine_model_id = :inspection_machine_model_id', {
        inspection_machine_model_id,
      });
    }

    if (inspection_pipe_model_id) {
      inspection.andWhere('inspection.inspection_pipe_model_id = :inspection_pipe_model_id', {
        inspection_pipe_model_id,
      });
    }

    if (start_date > end_date) {
      throw new NotFoundException(`A data inicial não pode ser maior que a data final`);
    }

    if ((start_date && !end_date) || (!start_date && end_date)) {
      throw new NotFoundException(`Selecione um intervalo de data`);
    }

    if (start_date || end_date) {
      inspection
        .andWhere('CONVERT(varchar, inspection_daily_production_date, 120) >= :start_date', {
          start_date,
        })
        .andWhere('CONVERT(varchar, inspection_daily_production_date, 120) <= :end_date', {
          end_date,
        });
    }

    let inspectionGet = await inspection.getMany();

    let final = [];

    final.push(
      inspectionGet.reduce((acc, cur) => {
        let date = new Intl.DateTimeFormat('pt-BR', {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
        }).format(new Date(cur.inspection_daily_production_date));
        if (!acc[date]) {
          acc[date] = {
            date_inspection: date,
            inspection_approved: cur.inspection_status ? 1 : 0,
            inspection_reproved: cur.inspection_status ? 0 : 1,
            inspection_clp_count: 1,
          };
        } else {
          acc[date].inspection_approved += cur.inspection_status ? 1 : 0;
          acc[date].inspection_reproved += cur.inspection_status ? 0 : 1;
          acc[date].inspection_clp_count =
            acc[date].inspection_approved + acc[date].inspection_reproved;
        }
        return acc;
      }, {}),
    );

    final = final.map((item) => {
      return Object.values(item);
    })[0];

    return final;
  }
}
