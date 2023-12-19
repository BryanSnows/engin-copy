import { Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { TransactionEntity } from "../../access-control/entities/transaction.entity";
import { User } from "../../users/entities/user.entity";


@Entity('PROFILE')
export class ProfileEntity {

    @PrimaryGeneratedColumn()
    profile_id: number;

    @Column()
    profile_name: string;

    @Column()
    profile_status: boolean;

    @OneToMany(() => User, (user) => user.profile)
    users: User[];

    @ManyToMany(() => TransactionEntity, { eager: true })
    @JoinTable({
        name: 'PROFILE_TRANSACTION',
        joinColumn: {
            name: 'profile_id',
            referencedColumnName: 'profile_id'
        },
        inverseJoinColumn: {
            name: 'transaction_id',
            referencedColumnName: 'transaction_id'
        }
    })
    transactions?: TransactionEntity[];
}