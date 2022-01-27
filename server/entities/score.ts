import { Field, ID, ObjectType } from 'type-graphql';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Level } from './level';
import { User } from './user';

@ObjectType()
@Entity('score')
export class Score {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid', { name: 'score-id' })
    scoreId?: string;

    @Field(() => String, { nullable: true })
    @Column({ name: 'code', type: 'longtext', nullable: true })
    code?: string;

    @Field(() => Number)
    @Column({ name: 'status', type: 'int', default: 0 })
    status?: number; // 0: not started; 1: finished

    @Field(() => String, { nullable: true })
    @Column({ name: 'scores', nullable: true })
    scores?: string;
    
    @Field(() => Date)
    @UpdateDateColumn()
    updated_at?: Date;

    @Field(() => User)
    @ManyToOne(() => User, user => user.scores)
    @JoinColumn({ name: 'user-id' })
    user?: User;

    @Field(() => Level)
    @ManyToOne(() => Level, level => level.scores)
    @JoinColumn({ name: 'level-id' })
    level?: Level;
};
