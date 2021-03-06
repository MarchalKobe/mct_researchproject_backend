import { Field, InputType } from 'type-graphql';
import { IsUUID, IsInt,  } from 'class-validator';

@InputType()
export class UpdateScoreInput {
    @Field()
    @IsUUID()
    scoreId: string;

    @Field()
    @IsInt()
    status: number;

    @Field()
    code: string;
};
