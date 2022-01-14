import { Arg, Ctx, Mutation, Query, Resolver } from 'type-graphql';
import { getRepository } from 'typeorm';
import admin from 'firebase-admin';
import bcrypt from 'bcrypt';
import { User } from '../../entities/user';
import { RegisterInput } from './register/RegisterInput';
import { LoginInput } from './login/LoginInput';
import { redis } from '../../redis';
import { sendEmail } from '../utils/sendEmail';
import { createConfirmationUrl, createPasswordRestoreUrl } from '../utils/createUrl';
import { RestorePasswordInput } from './password/RestorePasswordInput';
import { ForgotPasswordInput } from './password/ForgotPasswordInput';
import { generateFromString } from 'generate-avatar';
import { ContextToUserId } from '../utils/ContextAuthorization';
import { UpdateGeneralInput } from './update/UpdateGeneralInput';
import { UpdateEmailInput } from './update/UpdateEmailInput';
import { UpdatePasswordInput } from './update/UpdatePasswordInput';
import { UpdateEditorInput } from './update/UpdateEditorInput';

@Resolver()
export class UserResolver {
    repository = getRepository(User);

    @Query(() => [User], { nullable: true })
    async getUsers(): Promise<User[] | null> {
        try {
            const users = await this.repository.find();
            console.log(users);
            return users;
        } catch(error: any) {
            console.error(error);
            return null;
        };
    };

    @Mutation(() => User, { nullable: true })
    async register(@Arg('data') data: RegisterInput): Promise<User | null> {
        try {
            const hashedPassword = await bcrypt.hash(data.password, 12);
            
            const newUser: User = {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                password: hashedPassword,
                type: data.type,
                avatar: generateFromString(data.email),
            };
    
            await this.repository.save(newUser);
            await sendEmail(newUser.email!, await createConfirmationUrl(newUser.userId!));
            return newUser;
        } catch(error: any) {
            console.error(error);
            return null;
        };
    };

    @Mutation(() => User, { nullable: true })
    async login(@Arg('data') data: LoginInput): Promise<User | null> {
        try {
            const user: User | undefined = await this.repository.findOne({ email: data.email });
    
            if(user) {
                const result = await bcrypt.compare(data.password, user.password!);

                if(result) {
                    if(!user.confirmed) return null;
    
                    let claims = {
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        type: user.type,
                        avatar: user.avatar,
                        preferredTheme: user.preferredTheme,
                    };
    
                    const customToken = await admin.auth().createCustomToken(user.userId as string, claims).then((token) => token);
    
                    if(customToken) {
                        user.token = customToken;
                        return user;
                    } else {
                        // console.error(`Error creating custom token: ${error}`);
                    };
                } else {
                    // response.status(404).send({ error: 'Password incorrect' });
                };
            } else {
                // response.status(404).send({ error: 'No account' });
            };
    
            return null;
        } catch(error: any) {
            console.error(error);
            return null;
        };
    };

    @Mutation(() => Boolean, { nullable: true })
    async confirm(@Arg('token') token: string): Promise<Boolean | null> {
        try {
            const userId = await redis.get(`confirmemail-${token}`);
    
            if(!userId) return false;
    
            const user = await this.repository.findOne({ userId: userId });
    
            if(user) {
                user.confirmed = true;
                await this.repository.save(user);
                await redis.del(`confirmemail-${token}`);
                return true;
            };
    
            return false;
        } catch(error: any) {
            console.error(error);
            return null;
        };
    };

    @Mutation(() => Boolean, { nullable: true })
    async forgotPassword(@Arg('data') data: ForgotPasswordInput): Promise<Boolean | null> {
        try {
            const user = await this.repository.findOne({ email: data.email });
    
            if(user) {
                await sendEmail(user.email!, await createPasswordRestoreUrl(user.userId!));
                return true;
            };
    
            return false;
        } catch(error: any) {
            console.error(error);
            return null;
        };
    };

    @Mutation(() => Boolean, { nullable: true })
    async restorePassword(@Arg('token') token: string, @Arg('data') data: RestorePasswordInput): Promise<Boolean | null> {
        try {
            const userId = await redis.get(`passwordrestore-${token}`);
    
            if(!userId) return false;
    
            const user = await this.repository.findOne({ userId: userId });
    
            if(user) {
                const hashedPassword = await bcrypt.hash(data.password!, 12);
                user.password = hashedPassword;
                await this.repository.save(user);
                await redis.del(`passwordrestore-${token}`);
                return true;
            };
    
            return false;
        } catch(error: any) {
            console.error(error);
            return null;
        };
    };

    @Mutation(() => Boolean, { nullable: true })
    async updateAccountGeneral(@Ctx() { req }: any, @Arg('data') data: UpdateGeneralInput): Promise<Boolean | null> {
        try {
            const userId = ContextToUserId(req);
    
            const user = await this.repository.findOne({ userId: userId });
    
            if(user) {
                user.firstName = data.firstName;
                user.lastName = data.lastName;
                await this.repository.save(user);
                return true;
            } else {
                return false;
            };
        } catch(error: any) {
            console.error(error);
            return null;
        };
    };

    @Mutation(() => Boolean, { nullable: true })
    async updateAccountEmail(@Ctx() { req }: any, @Arg('data') data: UpdateEmailInput): Promise<Boolean | null> {
        try {
            const userId = ContextToUserId(req);
    
            const user = await this.repository.findOne({ userId: userId });
    
            if(user) {
                user.email = data.email;
                user.avatar = generateFromString(data.email);
                user.confirmed = false;
                await this.repository.save(user);
                await sendEmail(user.email!, await createConfirmationUrl(user.userId!));
                return true;
            } else {
                return false;
            };
        } catch(error: any) {
            console.error(error);
            return null;
        };
    };

    @Mutation(() => Boolean, { nullable: true })
    async updateAccountPassword(@Ctx() { req }: any, @Arg('data') data: UpdatePasswordInput): Promise<Boolean | null> {
        try {
            const userId = ContextToUserId(req);
    
            const user = await this.repository.findOne({ userId: userId });
    
            if(user) {
                if(data.current && data.password) {
                    const result = await bcrypt.compare(data.current, user.password!);
    
                    if(result) {
                        const hashedPassword = await bcrypt.hash(data.password, 12);
                        user.password = hashedPassword;
                    } else {
                        return null;
                    };
                };
                
                this.repository.save(user);
                return true;
            } else {
                return false;
            };
        } catch(error: any) {
            console.error(error);
            return null;
        };
    };

    @Mutation(() => Boolean, { nullable: true })
    async updateAccountEditor(@Ctx() { req }: any, @Arg('data') data: UpdateEditorInput): Promise<Boolean | null> {
        try {
            const userId = ContextToUserId(req);
    
            const user = await this.repository.findOne({ userId: userId });
    
            if(user) {
                user.preferredTheme = data.preferredTheme;
                await this.repository.save(user);
                return true;
            } else {
                return false;
            };
        } catch(error: any) {
            console.error(error);
            return null;
        };
    };
};
