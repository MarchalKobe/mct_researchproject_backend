import { Field, ID, ObjectType } from 'type-graphql';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Category } from './category';
import { Level } from './level';

@ObjectType()
@Entity('assignment')
export class Assignment {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid', { name: 'assignment-id' })
    assignmentId?: string;

    @Field(() => String)
    @Column({ name: 'subject' })
    subject?: string;

    @Field(() => Number)
    @Column({ name: 'position', type: 'int' })
    position?: number;

    @Field(() => Category)
    @ManyToOne(() => Category, category => category.assignments)
    @JoinColumn({ name: 'category-id' })
    category?: Category;

    @Field(() => [Level], { nullable: true })
    @OneToMany(() => Level, level => level.assignment)
    levels?: Level[];
};
