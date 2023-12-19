import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('INSPECTION')
export class Inspection {
  @PrimaryGeneratedColumn()
  inspection_id: number;

  @Column()
  inspection_process_id: number;

  @Column()
  inspection_process_status: boolean;

  @Column()
  inspection_machine_model_id: number;

  @Column()
  inspection_daily_production_id: number;

  @Column()
  inspection_daily_production_produced: number;

  @Column()
  inspection_daily_production_date: Date;

  @Column()
  inspection_pipe_model_id: number;

  @Column()
  inspection_production_goal_id: number;

  @Column()
  inspection_status: boolean;

  @Column()
  inspection_clp_count: number;
}
