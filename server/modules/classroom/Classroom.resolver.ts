import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql';
import { getRepository } from 'typeorm';
import { Assignment } from '../../entities/assignment';
import { Category } from '../../entities/category';
import { Classroom } from '../../entities/classroom';
import { Level } from '../../entities/level';
import { User } from '../../entities/user';
import Context from '../../types/Context';
import { ContextToUserId } from '../utils/ContextAuthorization';
import { sendEmail } from '../utils/sendEmail';
import { AddClassroomInput } from './add/AddClassroomInput';
import { DeleteUserFromClassroomInput } from './delete/DeleteUserFromClassroomInput';
import { DupplicateClassroomInput } from './dupplicate/DupplicateClassroomInput';
import { InviteUserToClassroomInput } from './invite/InviteUserToClassroomInput';
import { JoinClassroomInput } from './join/JoinClassroomInput';
import { UpdateClassroomInput } from './update/UpdateClassroomInput';

@Resolver()
export class ClassroomResolver {
    repository = getRepository(Classroom);
    userRepository = getRepository(User);
    categoryRepository = getRepository(Category);
    assignmentRepository = getRepository(Assignment);
    levelRepository = getRepository(Level);

    @Authorized()
    @Query(() => Classroom, { nullable: true })
    async getClassroom(@Arg('classroomId') classroomId: string): Promise<Classroom | undefined | null> {
        try {
            // TODO: Check if user is joined to class

            return await this.repository.createQueryBuilder('classroom')
                .leftJoinAndSelect('classroom.userCreated', 'userCreated')
                .leftJoinAndSelect('classroom.users', 'users')
                .where(`classroom.classroom-id = '${classroomId}'`)
                .orderBy('users.last-name')
                .addOrderBy('users.first-name')
                .getOne();
        } catch(error: any) {
            console.error(error);
            return null;
        };
    };

    @Authorized()
    @Query(() => [Classroom], { nullable: true })
    async getMyJoinedClassrooms(@Ctx() { req }: Context): Promise<Classroom[] | null> {
        try {
            const userId = ContextToUserId(req);
            const user = await this.userRepository.findOne({ userId: userId });

            if(user) {
                return await this.repository.createQueryBuilder('classroom')
                    .leftJoinAndSelect('classroom.userCreated', 'userCreated')
                    .leftJoinAndSelect('classroom.users', 'users')
                    .where(`users.user-id = '${user.userId}'`)
                    .orderBy('classroom.open', 'DESC')
                    .addOrderBy('classroom.name')
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
    async addClassroom(@Ctx() { req }: Context, @Arg('data') data: AddClassroomInput): Promise<Boolean> {
        try {
            const userId = ContextToUserId(req);
            const user = await this.userRepository.findOne({ userId: userId });

            if(user) {
                let classroom: Classroom = {
                    name: data.name,
                    userCreated: user,
                    users: [user],
                };

                let checkClassroom = null;

                do {
                    classroom.classcode = (Math.floor(Math.random() * 10000) + 10000).toString().substring(1);
                    checkClassroom = await this.repository.findOne({ classcode: classroom.classcode });
                } while(checkClassroom !== undefined && checkClassroom !== null);
    
                await this.repository.save(classroom);
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
    async updateClassroom(@Arg('data') data: UpdateClassroomInput): Promise<Boolean> {
        try {
            // TODO: Check if teacher is joined to class where category is in

            const classroom = await this.repository.findOne({ classroomId: data.classroomId });

            if(classroom && classroom.open) {
                classroom.name = data.name;
                await this.repository.save(classroom);
                return true;
            };

            return false;
        } catch(error: any) {
            console.error(error);
            return false;
        };
    };

    @Authorized()
    @Mutation(() => Boolean)
    async joinClassroom(@Ctx() { req }: Context, @Arg('data') data: JoinClassroomInput): Promise<Boolean> {
        try {
            const userId = ContextToUserId(req);
            const user = await this.userRepository.findOne({ userId: userId });

            if(user) {
                const classroom = await this.repository.findOne({ where: { classcode: data.classcode }, relations: ['users'] });

                if(classroom && classroom.open) {
                    classroom.users!.push(user);
                    await this.repository.save(classroom);
                    return true;
                };
            };

            return false;
        } catch(error: any) {
            console.error(error);
            return false;
        };
    };

    @Authorized()
    @Mutation(() => Boolean)
    async leaveClassroom(@Ctx() { req }: Context, @Arg('classroomId') classroomId: string): Promise<Boolean> {
        try {
            const userId = ContextToUserId(req);
            const user = await this.userRepository.findOne({ userId: userId });

            if(user) {
                const classroom = await this.repository.findOne({ where: { classroomId: classroomId }, relations: ['users'] });
    
                if(classroom) {
                    classroom.users = classroom.users!.filter((thisUser: User) => thisUser.userId !== user.userId);
                    await this.repository.save(classroom);
                    return true;
                };
            };

            return false;
        } catch(error: any) {
            console.error(error);
            return false;
        };
    };

    @Authorized(['TEACHER'])
    @Mutation(() => Boolean)
    async resetClasscode(@Arg('classroomId') classroomId: string): Promise<Boolean> {
        try {
            // TODO: Check if teacher is joined to class

            const classroom = await this.repository.findOne({ classroomId: classroomId });

            if(classroom) {
                let checkClassroom = null;

                do {
                    classroom.classcode = (Math.floor(Math.random() * 10000) + 10000).toString().substring(1);
                    checkClassroom = await this.repository.findOne({ classcode: classroom.classcode });
                } while(checkClassroom !== undefined && checkClassroom !== null);

                await this.repository.save(classroom);
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
    async deleteUserFromClassroom(@Arg('data') data: DeleteUserFromClassroomInput): Promise<Boolean> {
        // TODO: Check if teacher is joined to class

        try {
            const classroom = await this.repository.findOne({ where: { classroomId: data.classroomId }, relations: ['users'] });

            if(classroom) {
                classroom.users = classroom.users!.filter((thisUser: User) => thisUser.userId !== data.userId);
                await this.repository.save(classroom);
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
    async inviteUserToClassroom(@Arg('data') data: InviteUserToClassroomInput): Promise<Boolean> {
        try {
            // TODO: Check if teacher is joined to class

            const user = await this.userRepository.findOne({ email: data.email });

            if(user) {
                const classroom = await this.repository.findOne({ classroomId: data.classroomId });

                if(classroom) {
                    sendEmail(user.email!, classroom.classcode!);
                    return true;
                };
            };

            return false;
        } catch(error: any) {
            console.error(error);
            return false;
        };
    };

    // @Authorized(['TEACHER'])
    @Mutation(() => Boolean)
    async dupplicateClassroom(@Ctx() { req }: Context, @Arg('data') data: DupplicateClassroomInput): Promise<Boolean> {
        try {
            // TODO: Check if teacher is joined to class

            const userId = ContextToUserId(req);
            const user = await this.userRepository.findOne({ userId: userId });

            if(user) {
                const classroom = await this.repository.createQueryBuilder('classroom')
                    .leftJoinAndSelect('classroom.users', 'users')
                    .leftJoinAndSelect('classroom.categories', 'categories')
                    .leftJoinAndSelect('categories.assignments', 'assignments')
                    .leftJoinAndSelect('assignments.levels', 'levels')
                    .where(`classroom.classroom-id = '${data.classroomId}'`)
                    .getOne();
                
                if(classroom) {
                    let categories: Category[] = [];

                    if(classroom.categories) {
                        const categoryPromises = classroom.categories.map(async (category: Category) => {
                            let assignments: Assignment[] = [];

                            if(category.assignments) {
                                const assignmentPromises = category.assignments.map(async (assignment: Assignment) => {
                                    let levels: Level[] = [];

                                    if(assignment.levels) {
                                        const levelPromises = assignment.levels.map(async (level: Level) => {
                                            const newLevel: Level = {
                                                level: level.level,
                                                description: level.description,
                                                status: level.status,
                                                code: level.code,
                                                startcode: level.startcode,
                                            };

                                            await this.levelRepository.save(newLevel);
                                            levels.push(newLevel);
                                        });

                                        await levelPromises.reduce((m, o) => m.then(() => o), Promise.resolve());
                                    };

                                    const newAssignment: Assignment = {
                                        subject: assignment.subject,
                                        position: assignment.position,
                                        levels: levels,
                                    };

                                    await this.assignmentRepository.save(newAssignment);
                                    assignments.push(newAssignment);
                                });

                                await assignmentPromises.reduce((m, o) => m.then(() => o), Promise.resolve());
                            };

                            const newCategory: Category = {
                                name: category.name,
                                done: false,
                                visible: false,
                                assignments: assignments,
                            };

                            await this.categoryRepository.save(newCategory);
                            categories.push(newCategory);
                        });

                        await categoryPromises.reduce((m, o) => m.then(() => o), Promise.resolve());
                    };

                    const newClassroom: Classroom = {
                        name: data.name,
                        open: true,
                        userCreated: user,
                        categories: categories,
                    };

                    let checkClassroom = null;

                    do {
                        newClassroom.classcode = (Math.floor(Math.random() * 10000) + 10000).toString().substring(1);
                        checkClassroom = await this.repository.findOne({ classcode: newClassroom.classcode });
                    } while(checkClassroom !== undefined && checkClassroom !== null);

                    newClassroom.users! = [user];
                    await this.repository.save(newClassroom);
                    return true;
                };
            };

            return false;
        } catch(error: any) {
            console.error(error);
            return false;
        };
    };

    @Authorized(['TEACHER'])
    @Mutation(() => Boolean)
    async closeClassroom(@Arg('classroomId') classroomId: string): Promise<Boolean> {
        try {
            // TODO: Check if teacher is joined to class
            const classroom = await this.repository.findOne({ where: { classroomId: classroomId } });

            if(classroom) {
                classroom.open = false;
                await this.repository.save(classroom);
                return true;
            };

            return false;
        } catch(error: any) {
            console.error(error);
            return false;
        };
    };
};
