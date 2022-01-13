import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";
import { getRepository } from "typeorm";
import { Classroom } from "../../entities/classroom";
import { User } from "../../entities/user";
import Context from "../../types/Context";
import { ContextToUserId } from "../utils/ContextAuthorization";
import { AddClassroomInput } from "./add/AddClassroomInput";

@Resolver()
export class ClassroomResolver {
    repository = getRepository(Classroom);
    userRepository = getRepository(User);

    @Query(() => [Classroom], { nullable: true })
    async getClassrooms(): Promise<Classroom[] | null> {
        try {
            const classrooms = await this.repository.find();
            console.log(classrooms);
            return classrooms;
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
                let classroom = null;

                do {
                    data.classcode = (Math.floor(Math.random() * 10000) + 10000).toString().substring(1);
                    classroom = await this.repository.findOne({ classcode: data.classcode });
                } while(classroom !== undefined && classroom !== null);
    
                data.userCreated = user;

                console.log(data);
                
                await this.repository.save(data);
                return true;
            };

            return false;
        } catch(error: any) {
            console.error(error);
            return false;
        };
    };
};
