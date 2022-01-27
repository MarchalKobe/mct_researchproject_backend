import { Field, ID, ObjectType } from 'type-graphql';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Assignment } from './assignment';
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

    @Field(() => Boolean)
    @Column({ name: 'done', type: 'boolean', default: false })
    done?: boolean;

    @Field(() => Boolean)
    @Column({ name: 'visible', type: 'boolean', default: false })
    visible?: boolean;

    @Field(() => Classroom)
    @ManyToOne(() => Classroom, classroom => classroom.categories)
    @JoinColumn({ name: 'classroom-id' })
    classroom?: Classroom;

    @Field(() => [Assignment], { nullable: true })
    @OneToMany(() => Assignment, assignment => assignment.category)
    assignments?: Assignment[];
};
