import { Query, Resolver } from "type-graphql";
import { getRepository } from "typeorm";
import { User } from "../../entities/user";

@Resolver()
export class UserResolver {
    repository = getRepository(User);

    @Query(() => User, { nullable: true })
    async getUsers() {
        try {
            return await this.repository.find();
        } catch(error: any) {
            console.error(error);
        };
    };
};
