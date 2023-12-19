import { DailyProduction } from "src/daily-production/entities/daily-production.entity";
import { MachineModel } from "src/machine-model/entities/machine-model.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('PROCESS')
export class Process {
    @PrimaryGeneratedColumn()
    process_id: number;

    @Column()
    process_status: boolean;

    @Column()
    machine_model_id: number;

    @Column()
    daily_production_id: number;

    @ManyToOne(() => MachineModel, { eager: true })
    @JoinColumn({ name: 'machine_model_id' })
    machineModel: MachineModel;

    @ManyToOne(() => DailyProduction)
    @JoinColumn({ name: 'daily_production_id' })
    dailyProduction: DailyProduction;

};