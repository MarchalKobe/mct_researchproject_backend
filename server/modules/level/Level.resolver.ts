import { Arg, Authorized, Mutation, Query, Resolver } from 'type-graphql';
import { getRepository } from 'typeorm';
import { Level } from '../../entities/level';
import { UpdateLevelInput } from './update/UpdateLevelInput';

@Resolver()
export class LevelResolver {
    repository = getRepository(Level);

    @Authorized()
    @Query(() => Level, { nullable: true })
    async getLevel(@Arg('levelId') levelId: string): Promise<Level | undefined | null> {
        try {
            return await this.repository.findOne({ where: { levelId: levelId }, relations: ['assignment', 'assignment.category'] });
        } catch(error: any) {
            console.error(error);
            return null;
        };
    };

    @Authorized(['TEACHER'])
    @Mutation(() => Boolean)
    async updateLevel(@Arg('data') data: UpdateLevelInput): Promise<Boolean> {
        try {
            const level = await this.repository.findOne({ levelId: data.levelId });

            if(level) {
                level.description = data.description;
                level.status = data.status;
                level.code = data.code;
                level.startcode = data.startcode;
                await this.repository.save(level);
                return true;
            };

            return false;
        } catch(error: any) {
            console.error(error);
            return false;
        };
    };
};
