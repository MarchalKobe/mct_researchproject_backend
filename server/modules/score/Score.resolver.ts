import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql';
import { getRepository } from 'typeorm';
import { Score } from '../../entities/score';
import { User } from '../../entities/user';
import { ContextToUserId } from '../utils/ContextAuthorization';
import { calculateLevenshteinDistance, calculateScores, divideCategories, isValidHTML } from '../utils/ScoringHelpers';
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
            const score = await this.repository.findOne({ where: { scoreId: data.scoreId }, relations: ['level'] });

            if(score) {
                // TODO: score code

                console.log(score.code!);
                

                const isValid = await isValidHTML(JSON.parse(data.code).html);

                if(isValid) {
                    const minify = require('html-minifier').minify;

                    const options = {
                        collapseBooleanAttributes: true,
                        collapseWhitespace: true,
                        removeComments: true,
                        sortAttributes: true,
                    };

                    const assignmentMinify = minify(JSON.parse(score.level!.code!).html, options);
                    const studentMinify = minify(JSON.parse(data.code).html, options);

                    const resultAssignment = divideCategories(assignmentMinify);
                    const resultStudent = divideCategories(studentMinify);

                    resultAssignment.code = JSON.parse(score.level!.code!).html;
                    resultStudent.code = JSON.parse(data.code).html;

                    const distances = calculateLevenshteinDistance(resultAssignment, resultStudent);

                    const scores = calculateScores(distances);

                    console.log('Student:', resultStudent);
                    console.log('Assignment:', resultAssignment);
                    console.log('Levenshtein distance:', distances);
                    console.log('Scores:', scores);
                    console.log('Total:', scores.total);

                    score.status = data.status;
                    score.code = data.code;
                    score.scores = JSON.stringify(scores);

                    await this.repository.save(score);
                    return true;
                } else {
                    // Give 0 score
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
