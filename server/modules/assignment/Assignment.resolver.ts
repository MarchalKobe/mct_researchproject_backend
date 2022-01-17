import { Authorized, Query, Resolver } from 'type-graphql';
import { getRepository } from 'typeorm';
import { Assignment } from '../../entities/assignment';

@Resolver()
export class AssignmentResolver {
    repository = getRepository(Assignment);

    @Authorized()
    @Query(() => [Assignment], { nullable: true })
    async getCategories(): Promise<Assignment[] | undefined | null> {
        try {
            return await this.repository.find();
        } catch(error: any) {
            console.error(error);
            return null;
        };
    };
};
