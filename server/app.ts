import express, { Request, Response } from 'express';
import { ConnectionOptions, getConnectionOptions, createConnection, Connection, getConnection } from 'typeorm';
import { createDatabase } from 'typeorm-extension';
import { GraphQLSchema } from 'graphql';
import { buildSchema } from 'type-graphql';
import { ApolloServer } from 'apollo-server-express';
import { ApolloServerLoaderPlugin } from 'type-graphql-dataloader';
import admin from 'firebase-admin';
import serviceAccount from '../serviceAccountKey.json';
import cors from 'cors';
import http from 'http';

import { UserResolver } from './modules/user/User.resolver';
import { ClassroomResolver } from './modules/classroom/Classroom.resolver';
import { customAuthChecker } from './helpers/AuthorizeDecorator';
import { CategoryResolver } from './modules/category/Category.resolver';
import { AssignmentResolver } from './modules/assignment/Assignment.resolver';
import { LevelResolver } from './modules/level/Level.resolver';
import { ScoreResolver } from './modules/score/Score.resolver';
import { TestResolver } from './modules/test/Test.resolver';

(async () => {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as any),
    });

    const connectionOptions: ConnectionOptions = await getConnectionOptions();

    createDatabase({ ifNotExist: true }, connectionOptions)
        .then(() => console.log('Database created successfully!'))
        .then(createConnection)
        .then(async (_: Connection) => {
            const app = express(),
                port = process.env.PORT || 5001;
            
            const schema: GraphQLSchema = await buildSchema({
                resolvers: [UserResolver, ClassroomResolver, CategoryResolver, AssignmentResolver, LevelResolver, ScoreResolver, TestResolver],
                authChecker: customAuthChecker,
            });

            const apolloServer = new ApolloServer({
                schema,
                context: ({ req, res }: any) => ({ req, res }),
                plugins: [
                    ApolloServerLoaderPlugin({
                        typeormGetConnection: getConnection, // For use with TypeORM
                    }),
                ],
                // introspection: process.env.NODE_ENV === 'production' ? false : true,
            });

            app.use(express.json());
            app.use(express.urlencoded());
            app.use(cors());

            await apolloServer.start();

            apolloServer.applyMiddleware({
                app,
                cors: {
                    origin: '*',
                    methods: '*',
                },
            });

            const httpServer = http.createServer(app);

            app.get('/', (_: Request, response: Response) => {
                response.send('Welcome to the api for this research project');
            });

            httpServer.listen(port, () => {
                console.info(`\nServer 👾 \nListening on http://localhost:${port}/`);
            });
        }).catch(error => console.error(error));
})();
