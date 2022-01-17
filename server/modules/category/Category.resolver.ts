import { Arg, Authorized, Mutation, Query, Resolver } from 'type-graphql';
import { getRepository } from 'typeorm';
import { Category } from '../../entities/category';
import { Classroom } from '../../entities/classroom';
import { AddCategoryInput } from './add/AddCategoryInput';
import { UpdateCategoryInput } from './update/UpdateCategoryInput';

@Resolver()
export class CategoryResolver {
    repository = getRepository(Category);
    classroomRepository = getRepository(Classroom);

    @Authorized()
    @Query(() => Category, { nullable: true })
    async getCategory(@Arg('categoryId') categoryId: string): Promise<Category | undefined | null> {
        try {
            return await this.repository.findOne({ categoryId: categoryId });
        } catch(error: any) {
            console.error(error);
            return null;
        };
    };

    @Authorized()
    @Query(() => [Category], { nullable: true })
    async getCategoriesByClassroom(@Arg('classroomId') classroomId: string): Promise<Category[] | undefined | null> {
        try {
            const classroom = await this.classroomRepository.findOne({ classroomId: classroomId });

            if(classroom) {
                return await this.repository.createQueryBuilder('category')
                    .leftJoinAndSelect('category.classroom', 'classroom')
                    .where(`classroom.classroom-id = '${classroom.classroomId}'`)
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
    async addCategory(@Arg('data') data: AddCategoryInput): Promise<Boolean> {
        try {
            const classroom = await this.classroomRepository.findOne({ classroomId: data.classroomId });

            if(classroom) {
                let category: Category = {
                    name: data.name,
                    classroom: classroom,
                };

                await this.repository.save(category);
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
    async updateCategory(@Arg('data') data: UpdateCategoryInput): Promise<Boolean> {
        try {
            const category = await this.repository.findOne({ categoryId: data.categoryId });

            if(category) {
                category.name = data.name;
                await this.repository.save(category);
                return true;
            };

            return false;
        } catch(error: any) {
            console.error(error);
            return false;
        };
    };

    // @Authorized(['TEACHER'])
    // @Mutation(() => Boolean)
    // async deleteCategory(@Arg('categoryId') categoryId: string): Promise<Boolean> {
    //     try {
    //         const category = await this.repository.findOne({ categoryId: categoryId });

    //         if(category) {
    //             await this.repository.delete(category);
    //             return true;
    //         };

    //         return false;
    //     } catch(error: any) {
    //         console.error(error);
    //         return false;
    //     };
    // };
};
