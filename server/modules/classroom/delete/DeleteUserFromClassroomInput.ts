import { Field, InputType } from 'type-graphql';
import { IsUUID } from 'class-validator';

@InputType()
export class DeleteUserFromClassroomInput {
    @Field()
    @IsUUID()
    userId: string;

    @Field()
    @IsUUID()
    classroomId: string;
};
