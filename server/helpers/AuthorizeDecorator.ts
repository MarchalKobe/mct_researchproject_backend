import { AuthChecker } from 'type-graphql';
import admin from 'firebase-admin';

export const customAuthChecker: AuthChecker = async ({ context }, roles = []) => {
    const bearerHeader = (context as any).req.headers.authorization;

    if(bearerHeader) {
        const token = bearerHeader.split(' ')[1];

        if(token && token !== 'null') {
            const result = await new Promise(resolve => {
                admin.auth().verifyIdToken(token).then((decodedToken) => {
                    if(roles.includes('TEACHER') && decodedToken.type === 1) {
                        resolve(true);
                        return;
                    } else if(roles.length) {
                        resolve(false);
                        return;
                    };
                    
                    resolve(true);
                    return;
                }).catch((error: string) => {
                    console.error(error);
                    resolve(false);
                    return;
                });
            });

            return result as boolean;
        };
    };

    return false;
};
