import { Field, ID, ObjectType } from 'type-graphql';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Classroom } from './classroom';

@ObjectType()
@Entity('category')
export class Category {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid', { name: 'category-id' })
    categoryId?: string;

    @Field(() => String)
    @Column({ name: 'name' })
    name?: string;

    @Field(() => Classroom)
    @ManyToOne(() => Classroom)
    @JoinColumn({ name: 'classroom-id' })
    classroom?: Classroom;
};
