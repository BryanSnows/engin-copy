import { Process } from "src/process/entities/process.entity";
import { ProductionGoal } from "src/production-goal/entities/production-goal.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('DAILY_PRODUCTION')
export class DailyProduction {
    @PrimaryGeneratedColumn() 
    daily_production_id: number;

    @Column()
    production_goal_id: number;

    @Column()
    daily_production_date: Date;

    @Column()
    daily_production_goal: number;

    @Column()
    daily_production_produced: number;

    @Column()
    daily_production_situation: number;

    @OneToMany(() => Process, process => process.dailyProduction)
    processes: Process[];

    @ManyToOne(() => ProductionGoal)
    @JoinColumn({ name: 'production_goal_id' })
    productionGoal: ProductionGoal;


}