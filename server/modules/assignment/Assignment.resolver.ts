import { Arg, Authorized, Mutation, Query, Resolver } from 'type-graphql';
import { getRepository } from 'typeorm';
import { Assignment } from '../../entities/assignment';
import { Category } from '../../entities/category';
import { AddAssignmentInput } from './add/AddAssignmentInput';
import { UpdateAssignmentInput } from './update/UpdateAssignmentInput';

@Resolver()
export class AssignmentResolver {
    repository = getRepository(Assignment);
    categoryRepository = getRepository(Category);

    @Authorized()
    @Query(() => Assignment, { nullable: true })
    async getAssignment(@Arg('assignmentId') assignmentId: string): Promise<Assignment | undefined | null> {
        try {
            return await this.repository.findOne({ assignmentId: assignmentId });
        } catch(error: any) {
            console.error(error);
            return null;
        };
    };

    @Authorized()
    @Query(() => [Assignment], { nullable: true })
    async getAssignmentsByCategory(@Arg('categoryId') categoryId: string): Promise<Assignment[] | undefined | null> {
        try {
            const category = await this.categoryRepository.findOne({ categoryId: categoryId });

            if(category) {
                return await this.repository.createQueryBuilder('assignment')
                    .leftJoinAndSelect('assignment.category', 'category')
                    .where(`category.category-id = '${category.categoryId}'`)
                    .getMany();
            };

            return null;
        } catch(error: any) {
            console.error(error);
            return null;
        };
    };

    @Authorized(['TEACHER'])
    @Mutation(() => Boolean)
    async addAssignment(@Arg('data') data: AddAssignmentInput): Promise<Boolean> {
        try {
            const category = await this.categoryRepository.findOne({ categoryId: data.categoryId });

            if(category) {
                let assignment: Assignment = {
                    subject: data.subject,
                    category: category,
                };

                await this.repository.save(assignment);
                return true;
            };

            return false;
        } catch(error: any) {
            console.error(error);
            return false;
        };
    };

    @Authorized(['TEACHER'])
    @Mutation(() => Boolean)
    async updateAssignment(@Arg('data') data: UpdateAssignmentInput): Promise<Boolean> {
        try {
            const assignment = await this.repository.findOne({ assignmentId: data.assignmentId });

            if(assignment) {
                assignment.subject = data.subject;
                await this.repository.save(assignment);
                return true;
            };

            return false;
        } catch(error: any) {
            console.error(error);
            return false;
        };
    };
};
