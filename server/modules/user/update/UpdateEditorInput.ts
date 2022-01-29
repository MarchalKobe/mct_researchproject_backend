import { Length } from 'class-validator';
import { Field, InputType } from 'type-graphql';

@InputType()
export class UpdateEditorInput {
    @Field()
    @Length(1, 255)
    preferredTheme: string;
};
