import { Field, ID, ObjectType } from 'type-graphql';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Category } from './category';

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
    @Column({ name: 'position' })
    position?: number;

    @Field(() => Category)
    @ManyToOne(() => Category)
    @JoinColumn({ name: 'category-id' })
    category?: Category;
};
