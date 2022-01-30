import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql';
import { getRepository, MoreThan } from 'typeorm';
import { Assignment } from '../../entities/assignment';
import { Category } from '../../entities/category';
import { Level } from '../../entities/level';
import { Score } from '../../entities/score';
import { User } from '../../entities/user';
import CodeScores from '../../types/CodeScores';
import { ContextToUserId } from '../utils/ContextAuthorization';
import { AddAssignmentInput } from './add/AddAssignmentInput';
import { UpdateAssignmentInput } from './update/UpdateAssignmentInput';

const assignmentsQuery = async (repository: any, query: string, many: boolean, orderBy: string, direction: string = 'ASC') => {
    if(many) {
        return await repository.createQueryBuilder('assignment')
            .leftJoinAndSelect('assignment.category', 'category')
            .leftJoinAndSelect('assignment.levels', 'levels')
            .leftJoinAndSelect('levels.scores', 'scores')
            .leftJoinAndSelect('scores.user', 'user')
            .where(query)
            .orderBy(orderBy, direction)
            .getMany();
        } else {
        return await repository.createQueryBuilder('assignment')
            .leftJoinAndSelect('assignment.category', 'category')
            .leftJoinAndSelect('assignment.levels', 'levels')
            .leftJoinAndSelect('levels.scores', 'scores')
            .leftJoinAndSelect('scores.user', 'user')
            .where(query)
            .orderBy(orderBy, direction)
            .getOne();
    };
};

@Resolver()
export class AssignmentResolver {
    repository = getRepository(Assignment);
    categoryRepository = getRepository(Category);
    levelRepository = getRepository(Level);
    userRepository = getRepository(User);
    scoreRepository = getRepository(Score);

    @Authorized()
    @Query(() => [Assignment], { nullable: true })
    async getMyAssignmentsByCategory(@Ctx() { req }: any, @Arg('categoryId') categoryId: string): Promise<Assignment[] | undefined | null> {
        // TODO: Check if user can see this assignment (if user is joined to class)

        try {
            const userId = ContextToUserId(req);
    
            const user = await this.userRepository.findOne({ userId: userId });

            if(user) {
                const category = await this.categoryRepository.findOne({ where: { categoryId: categoryId }, relations: ['classroom']  });
    
                if(category && category.classroom!.open) {
                    const assignment1: Assignment = await assignmentsQuery(this.repository, `category.category-id = '${category.categoryId}' AND user.user-id = '${user.userId}' AND scores.status = 0`, false, 'assignment.position');
                    
                    // If student een score heeft met status 0 in deze category
                    if(assignment1) {
                        // Return alle assignments in deze category vanaf deze oefening
                        return await assignmentsQuery(this.repository, `category.category-id = '${category.categoryId}' AND (user.user-id = '${user.userId}' OR scores.user IS NULL) AND assignment.position >= ${assignment1.position}`, true, 'assignment.position');
                        // return await this.repository.createQueryBuilder('assignment')
                        //     .leftJoinAndSelect('assignment.category', 'category')
                        //     .leftJoinAndSelect('assignment.levels', 'levels')
                        //     .leftJoinAndSelect('levels.scores', 'scores')
                        //     .leftJoinAndSelect('scores.user', 'user', `scores.user-id = user.user-id AND user.user-id = '${user.userId}'`)
                        //     .where(`category.category-id = '${category.categoryId}' AND assignment.position >= ${assignment1.position}`)
                        //     .orderBy('assignment.position')
                        //     .getMany();
                    } else {
                        const assignments2: Assignment[] = await assignmentsQuery(this.repository, `category.category-id = '${category.categoryId}' AND user.user-id = '${user.userId}' AND scores.status = 1`, true, 'assignment.position', 'DESC');

                        // Als student een score heeft met status 1 in deze category
                        if(assignments2.length) {
                            // Score maken van volgende oefening en alle oefeningen meegeven vanaf deze score, level kiezen op basis van score laatste algemene oefening
                            const previousScores = await this.scoreRepository.createQueryBuilder('score')
                                .leftJoinAndSelect('score.user', 'user')
                                .leftJoinAndSelect('score.level', 'level')
                                .leftJoinAndSelect('level.assignment', 'assignment')
                                .where(`user.user-id = '${user.userId}' AND assignment.assignment-id = '${assignments2[0].assignmentId}'`)
                                .orderBy('score.updated_at', 'DESC')
                                .getMany();
                            
                            const score: Score = {
                                user: user,
                            };

                            if(previousScores) {
                                const scores: CodeScores = JSON.parse(previousScores[0].scores!);

                                const thisLevels = await this.levelRepository.createQueryBuilder('level')
                                    .leftJoinAndSelect('level.assignment', 'assignment')
                                    .where(`assignment.assignment-id = '${assignments2[0].assignmentId}'`)
                                    .orderBy('level.level')
                                    .getMany();

                                // Als student score lager heeft dan 50% -> level lager in zelfde oefening. Als geen level lager -> zelfde level
                                if(scores.total! < 50) {
                                    if(previousScores[0].level!.level === 1) {
                                        score.level = thisLevels[0];
                                        score.code = thisLevels[0].startcode;
                                    } else if(previousScores[0].level!.level === 2) {
                                        score.level = thisLevels[0];
                                        score.code = thisLevels[0].startcode;
                                    } else if(previousScores[0].level!.level === 3) {
                                        score.level = thisLevels[1];
                                        score.code = thisLevels[1].startcode;
                                    };

                                // Als student score tussen 50% en 90% -> level hoger in zelfde oefening. Als geen level hoger -> zelfde level
                                } else if(scores.total! >= 50 && scores.total! < 90) {
                                    score.level = thisLevels[previousScores[0].level!.level! - 1];
                                    score.code = thisLevels[previousScores[0].level!.level! - 1].startcode;

                                // Als student score hoger dan 90% -> volgende oefening met level normal
                                } else if(scores.total! >= 90) {
                                    if(previousScores[0].level!.level === 1) {
                                        score.level = thisLevels[1];
                                        score.code = thisLevels[1].startcode;
                                    } else if(previousScores[0].level!.level === 2) {
                                        score.level = thisLevels[2];
                                        score.code = thisLevels[2].startcode;
                                    } else if(previousScores[0].level!.level === 3) {
                                        const assignment3 = await assignmentsQuery(this.repository, `category.category-id = '${category.categoryId}' AND assignment.position = ${assignments2[0].position! + 1}`, false, 'levels.level');

                                        // If volgende oefening in deze category
                                        if(assignment3) {
                                            score.level = assignment3.levels![1];
                                            score.code = assignment3.levels![1].startcode;

                                            await this.scoreRepository.save(score);
                                            return await assignmentsQuery(this.repository, `category.category-id = '${category.categoryId}' AND ((user.user-id = '${user.userId}' OR scores.user IS NULL) AND assignment.position >= ${assignment3.position})`, true, 'assignment.position');
                                        } else {
                                            return null;
                                        };
                                    };
                                };
                            };
                            
                            await this.scoreRepository.save(score);
                            return await assignmentsQuery(this.repository, `category.category-id = '${category.categoryId}' AND ((user.user-id = '${user.userId}' OR scores.user IS NULL) AND assignment.position >= ${assignments2[0].position})`, true, 'assignment.position');
                        } else {
                            // Score maken van eerste oefening in category, level is normal
                            const assignment4 = await assignmentsQuery(this.repository, `category.category-id = '${category.categoryId}' AND assignment.position = 1`, false, 'levels.level');
                            
                            if(assignment4) {
                                const score: Score = {
                                    user: user,
                                    code: assignment4.levels![1].startcode,
                                    level: assignment4.levels![1],
                                };

                                await this.scoreRepository.save(score);

                                return await assignmentsQuery(this.repository, `category.category-id = '${category.categoryId}' AND (user.user-id = '${user.userId}' OR scores.user IS NULL) AND assignment.position >= 1`, true, 'assignment.position');
                            };
                        };
                    };
                };
            };

            return null;
        } catch(error: any) {
            console.error(error);
            return null;
        };
    };

    @Authorized()
    @Query(() => [Assignment], { nullable: true })
    async getAssignmentsByCategory(@Arg('categoryId') categoryId: string): Promise<Assignment[] | undefined | null> {
        // TODO: Check if user can see this assignment (if user is joined to class)

        try {
            const category = await this.categoryRepository.findOne({ categoryId: categoryId });

            if(category) {
                return await this.repository.createQueryBuilder('assignment')
                    .leftJoinAndSelect('assignment.category', 'category')
                    .leftJoinAndSelect('assignment.levels', 'levels')
                    .leftJoinAndSelect('levels.scores', 'scores')
                    .leftJoinAndSelect('scores.user', 'user')
                    .where(`category.category-id = '${category.categoryId}'`)
                    .orderBy('levels.level')
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
    async addAssignment(@Arg('data') data: AddAssignmentInput): Promise<Boolean> {
        try {
            // TODO: Check if teacher is joined to class where category is in

            const category = await this.categoryRepository.findOne({ categoryId: data.categoryId });

            if(category) {
                const assignments = await this.repository.createQueryBuilder('assignment')
                    .leftJoinAndSelect('assignment.category', 'category')
                    .where(`category.category-id = '${category.categoryId}'`)
                    .orderBy('assignment.position', 'DESC')
                    .getMany();
                
                let levels: Level[] = [];

                const defaultCode = {
                    html: '',
                };

                for(let i = 1; i <= 3; i++) {
                    const level: Level = {
                        level: i,
                        code: JSON.stringify(defaultCode),
                        startcode: JSON.stringify(defaultCode),
                    };

                    await this.levelRepository.save(level);
                    levels.push(level);
                };

                const assignment: Assignment = {
                    subject: data.subject,
                    position: assignments.length ? assignments[0].position! + 1 : 1,
                    category: category,
                    levels: levels,
                };

                await this.repository.save(assignment);
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
    async updateAssignment(@Arg('data') data: UpdateAssignmentInput): Promise<Boolean> {
        try {
            // TODO: Check if teacher is joined to class where category is in

            const assignment = await this.repository.findOne({ assignmentId: data.assignmentId });

            if(assignment) {
                assignment.subject = data.subject;
                if(data.position) assignment.position = data.position;
                await this.repository.save(assignment);
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
    async deleteAssignment(@Arg('assignmentId') assignmentId: string): Promise<Boolean> {
        try {
            const assignment = await this.repository.findOne({ where: { assignmentId: assignmentId }, relations: ['category', 'levels'] });
            
            if(assignment && assignment.category && !assignment.category.done && assignment.levels) {
                assignment.levels.map(async (level: Level) => {
                    const thisLevel = await this.levelRepository.findOne({ levelId: level.levelId });
                    if(thisLevel) await this.levelRepository.delete(thisLevel);
                });

                const assignments = await this.repository.find({ category: { categoryId: assignment.category.categoryId }, position: MoreThan(assignment.position) });

                if(assignments) {
                    assignments.map(async (as: Assignment) => {
                        as.position! -= 1;
                        await this.repository.save(as);
                    });
                };

                const thisAssignment = await this.repository.findOne({ assignmentId: assignment.assignmentId });
                await this.repository.delete(thisAssignment!);
                return true;
            };

            return false;
        } catch(error: any) {
            console.error(error);
            return false;
        };
    };
};
