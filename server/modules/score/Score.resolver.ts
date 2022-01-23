import { Authorized, Query, Resolver } from 'type-graphql';
import { getRepository } from 'typeorm';
import { Score } from '../../entities/score';

@Resolver()
export class ScoreResolver {
    repository = getRepository(Score);

    @Authorized()
    @Query(() => [Score], { nullable: true })
    async getScores(): Promise<Score[] | undefined | null> {
        try {
            return await this.repository.find();
        } catch(error: any) {
            console.error(error);
            return null;
        };
    };
};
