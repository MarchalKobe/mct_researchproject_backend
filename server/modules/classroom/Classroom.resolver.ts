import { Arg, createParamDecorator, Ctx, Mutation, Query, Resolver } from "type-graphql";
import { getRepository } from "typeorm";
import { Classroom } from "../../entities/classroom";
import { User } from "../../entities/user";
import Context from "../../types/Context";
import { ContextToUserId } from "../utils/ContextAuthorization";
import { AddClassroomInput } from "./add/AddClassroomInput";
import { JoinClassroomInput } from "./join/JoinClassroomInput";

@Resolver()
export class ClassroomResolver {
    repository = getRepository(Classroom);
    userRepository = getRepository(User);

    @Query(() => [Classroom], { nullable: true })
    async getMyJoinedClassrooms(@Ctx() { req }: Context): Promise<Classroom[] | null> {
        try {
            const userId = ContextToUserId(req);
            const user = await this.userRepository.findOne({ userId: userId });

            if(user) {
                const classrooms = await this.repository.createQueryBuilder('classroom')
                    .leftJoinAndSelect('classroom.userCreated', 'userCreated')
                    .leftJoinAndSelect('classroom.users', 'users')
                    .where(`users.user-id = '${user.userId}'`)
                    .getMany();

                return classrooms;
            };

            return null;
        } catch(error: any) {
            console.error(error);
            return null;
        };
    };

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
};
