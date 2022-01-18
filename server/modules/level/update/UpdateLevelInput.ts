import { Field, InputType } from 'type-graphql';
import { Length, IsUUID, IsInt } from 'class-validator';

@InputType()
export class UpdateLevelInput {
    @Field()
    @IsUUID()
    levelId: string;

    @Field()
    @Length(1, 10000)
    description: string;

    @Field()
    @IsInt()
    status: number;
};
