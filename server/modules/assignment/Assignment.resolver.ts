import { Arg, Authorized, Mutation, Query, Resolver } from 'type-graphql';
import { getRepository } from 'typeorm';
import { Assignment } from '../../entities/assignment';
import { Category } from '../../entities/category';
import { Level } from '../../entities/level';
import { AddAssignmentInput } from './add/AddAssignmentInput';
import { UpdateAssignmentInput } from './update/UpdateAssignmentInput';

@Resolver()
export class AssignmentResolver {
    repository = getRepository(Assignment);
    categoryRepository = getRepository(Category);
    levelRepository = getRepository(Level);

    // @Authorized()
    // @Query(() => Assignment, { nullable: true })
    // async getAssignment(@Arg('assignmentId') assignmentId: string): Promise<Assignment | undefined | null> {
    //     try {
    //         return await this.repository.findOne({ assignmentId: assignmentId });
    //     } catch(error: any) {
    //         console.error(error);
    //         return null;
    //     };
    // };

    @Authorized()
    @Query(() => [Assignment], { nullable: true })
    async getAssignmentsByCategory(@Arg('categoryId') categoryId: string): Promise<Assignment[] | undefined | null> {
        // TODO: Check if user can see this assignment (if user is joined to class)

        try {
            const category = await this.categoryRepository.findOne({ categoryId: categoryId });

            if(category) {
                return await this.repository.createQueryBuilder('assignment')
                    .leftJoinAndSelect('assignment.category', 'category')
                    .leftJoinAndSelect('assignment.levels', 'levels')
                    .where(`category.category-id = '${category.categoryId}'`)
                    .orderBy('levels.level')
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
            // TODO: Check if teacher is joined to class where category is in

            const category = await this.categoryRepository.findOne({ categoryId: data.categoryId });

            if(category) {
                const assignments = await this.repository.createQueryBuilder('assignment')
                    .leftJoinAndSelect('assignment.category', 'category')
                    .where(`category.category-id = '${category.categoryId}'`)
                    .orderBy('assignment.position', 'DESC')
                    .getMany();
                
                let levels: Level[] = [];

                const defaultCode = {
                    html: '',
                };

                for(let i = 1; i <= 3; i++) {
                    const level: Level = {
                        level: i,
                        code: JSON.stringify(defaultCode),
                        startcode: JSON.stringify(defaultCode),
                    };

                    await this.levelRepository.save(level);
                    levels.push(level);
                };

                const assignment: Assignment = {
                    subject: data.subject,
                    position: assignments.length ? assignments[0].position! + 1 : 1,
                    category: category,
                    levels: levels,
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
            // TODO: Check if teacher is joined to class where category is in

            // TODO: Update visibility
            console.log(data);
            

            const assignment = await this.repository.findOne({ assignmentId: data.assignmentId });

            if(assignment) {
                assignment.subject = data.subject;
                if(data.position) assignment.position = data.position;
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
