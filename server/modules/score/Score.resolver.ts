import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql';
import { getRepository } from 'typeorm';
import { Score } from '../../entities/score';
import { User } from '../../entities/user';
import { ContextToUserId } from '../utils/ContextAuthorization';
import { UpdateScoreInput } from './update/UpdateScoreInput';

@Resolver()
export class ScoreResolver {
    repository = getRepository(Score);
    userRepository = getRepository(User);

    // @Authorized()
    // @Query(() => [Score], { nullable: true })
    // async getScores(): Promise<Score[] | undefined | null> {
    //     try {
    //         return await this.repository.find();
    //     } catch(error: any) {
    //         console.error(error);
    //         return null;
    //     };
    // };

    @Authorized()
    @Query(() => Score, { nullable: true })
    async getScore(@Arg('scoreId') scoreId: string): Promise<Score | undefined | null> {
        try {
            return await this.repository.createQueryBuilder('score')
                .leftJoinAndSelect('score.level', 'level')
                .leftJoinAndSelect('level.assignment', 'assignment')
                .leftJoinAndSelect('assignment.category', 'category')
                .where(`score.score-id = '${scoreId}'`)
                .getOne();
        } catch(error: any) {
            console.error(error);
            return null;
        };
    };

    // @Authorized()
    // @Query(() => [Score], { nullable: true })
    // async getScoresByCategory(@Arg('categoryId') categoryId: string): Promise<Score[] | undefined | null> {
    //     try {
    //         return await this.repository.createQueryBuilder('score')
    //             .leftJoinAndSelect('score.level', 'level')
    //             .leftJoinAndSelect('level.assignment', 'assignment')
    //             .leftJoinAndSelect('assignment.category', 'category')
    //             .where(`category.category-id = '${categoryId}' AND score.status = 1`)
    //             .getMany();
    //     } catch(error: any) {
    //         console.error(error);
    //         return null;
    //     };
    // };

    @Authorized()
    @Query(() => [Score], { nullable: true })
    async getMyScoresByCategory(@Ctx() { req }: any, @Arg('categoryId') categoryId: string): Promise<Score[] | undefined | null> {
        try {
            const userId = ContextToUserId(req);

            const user = await this.userRepository.findOne({ userId: userId });

            if(user) {
                return await this.repository.createQueryBuilder('score')
                    .leftJoinAndSelect('score.user', 'user')
                    .leftJoinAndSelect('score.level', 'level')
                    .leftJoinAndSelect('level.assignment', 'assignment')
                    .leftJoinAndSelect('assignment.category', 'category')
                    .where(`user.user-id = '${user.userId}' AND category.category-id = '${categoryId}' AND score.status = 1`)
                    .getMany();
            };

            return null;
        } catch(error: any) {
            console.error(error);
            return null;
        };
    };

    @Authorized()
    @Mutation(() => Boolean)
    async updateScore(@Arg('data') data: UpdateScoreInput): Promise<Boolean> {
        try {
            // TODO: Check if teacher is joined to class where category is in

            const score = await this.repository.findOne({ scoreId: data.scoreId });

            if(score) {
                score.status = data.status;
                score.code = data.code;
                await this.repository.save(score);
                return true;
            };

            return false;
        } catch(error: any) {
            console.error(error);
            return false;
        };
    };
};
