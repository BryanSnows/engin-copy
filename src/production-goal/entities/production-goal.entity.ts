import { DailyProduction } from 'src/daily-production/entities/daily-production.entity';
import { PipeModel } from 'src/pipe-model/entities/pipe-model.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('PRODUCTION_GOAL')
export class ProductionGoal {
  @PrimaryGeneratedColumn()
  production_goal_id: number;

  @Column()
  production_goal_order: string;

  @Column()
  production_goal_expected: number;

  @Column()
  production_goal_produced: number;

  @Column()
  production_goal_situation: number;

  @Column()
  production_goal_start_date: Date;

  @Column()
  pipe_model_id: number;

  @Column()
  production_goal_finish_date: Date;

  @Column()
  production_goal_created_at: Date;

  @Column()
  production_goal_elaborated: boolean;

  @ManyToOne(() => PipeModel)
  @JoinColumn({ name: 'pipe_model_id' })
  pipeModel: PipeModel;

  @OneToMany(() => DailyProduction, (production) => production.productionGoal)
  dailyProduction: DailyProduction[];
}
