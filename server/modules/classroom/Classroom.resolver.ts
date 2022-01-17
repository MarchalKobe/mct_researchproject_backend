import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql';
import { getRepository } from 'typeorm';
import { Classroom } from '../../entities/classroom';
import { User } from '../../entities/user';
import Context from '../../types/Context';
import { ContextToUserId } from '../utils/ContextAuthorization';
import { sendEmail } from '../utils/sendEmail';
import { AddClassroomInput } from './add/AddClassroomInput';
import { DeleteUserFromClassroomInput } from './delete/DeleteUserFromClassroomInput';
import { InviteUserToClassroomInput } from './invite/InviteUserToClassroomInput';
import { JoinClassroomInput } from './join/JoinClassroomInput';

@Resolver()
export class ClassroomResolver {
    repository = getRepository(Classroom);
    userRepository = getRepository(User);

    @Authorized()
    @Query(() => Classroom, { nullable: true })
    async getClassroom(@Arg('classroomId') classroomId: string): Promise<Classroom | undefined | null> {
        try {
            return await this.repository.createQueryBuilder('classroom')
                .leftJoinAndSelect('classroom.userCreated', 'userCreated')
                .leftJoinAndSelect('classroom.users', 'users')
                .where(`classroom.classroom-id = '${classroomId}'`)
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

    @Authorized()
    @Mutation(() => Boolean)
    async joinClassroom(@Ctx() { req }: Context, @Arg('data') data: JoinClassroomInput): Promise<Boolean> {
        try {
            const userId = ContextToUserId(req);
            const user = await this.userRepository.findOne({ userId: userId });

            if(user) {
                const classroom = await this.repository.findOne({ where: { classcode: data.classcode }, relations: ['users'] });

                if(classroom) {
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
            const classroom = await this.repository.findOne({ where: { classroomId: classroomId } });

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
            const user = await this.userRepository.findOne({ email: data.email });

            if(user) {
                const classroom = await this.repository.findOne({ where: { classroomId: data.classroomId } });

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
};
