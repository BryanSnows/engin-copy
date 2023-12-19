// import { BitToBooleanTransformer } from "src/config/database/transformers/bit-to-boolean.transformer";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ProfileEntity } from "../../profile/entities/profile.entity";

@Entity('TRANSACTION')
export class TransactionEntity {

    @PrimaryGeneratedColumn()
    transaction_id: number;

    @Column()
    transaction_name: string;

    @Column()
    transaction_number: number;

    @Column()
    transaction_status: boolean;

    @ManyToOne(() => ProfileEntity, (profile) => profile.transactions)
    @JoinColumn({ name: 'transaction_id' })
    profile: ProfileEntity;
}