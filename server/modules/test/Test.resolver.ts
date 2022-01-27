import { Query, Resolver } from 'type-graphql';
import { calculateLevenshteinDistance, calculateScores, divideCategories, isValidHTML } from '../utils/ScoringHelpers';

const student = `
<!DOCTYPE html>\n<html lang="en">\n<head>\n    <title>Headers and paragraphs</title>\n</head>\n<body>\n    <h1>This is the main heading of the page</h1>\n    <p>h1 defines the most important heading of the page.</p>\n    <p>This is the first sub-heading</p>\n    <p>h2 describes the first sub-heading of the page.</p>\n    <p>The h1 to h6 tags are used to define HTML headings.</p>\n</body>\n</html>\n
`;

const assignment = `
<!DOCTYPE html>\n<html lang="en">\n<head>\n    <title>Headers and paragraphs</title>\n</head>\n<body>\n    <h1>This is the main heading of the page</h1>\n    <p>h1 defines the most important heading of the page.</p>\n    <h2>This is the first sub-heading</h2>\n    <p>h2 describes the first sub-heading of the page.</p>\n    <p>The h1 to h6 tags are used to define HTML headings.</p>\n</body>\n</html>\n
`;

@Resolver()
export class TestResolver {
    // repository = getRepository(Score);

    @Query(() => Boolean, { nullable: true })
    async test(): Promise<Boolean | undefined | null> {
        try {
            // Check if no errors and valid html file
            const isValid = await isValidHTML(student);

            if(isValid) {
                const minify = require('html-minifier').minify;

                const options = {
                    collapseBooleanAttributes: true,
                    collapseWhitespace: true,
                    removeComments: true,
                    sortAttributes: true,
                };

                const assignmentMinify = minify(assignment, options);
                const studentMinify = minify(student, options);

                const resultAssignment = divideCategories(assignmentMinify);
                const resultStudent = divideCategories(studentMinify);

                resultAssignment.code = assignment;
                resultStudent.code = student;

                const distances = calculateLevenshteinDistance(resultAssignment, resultStudent);

                const scores = calculateScores(distances);

                console.log('Student:', resultStudent);
                console.log('Assignment:', resultAssignment);
                console.log('Levenshtein distance:', distances);
                console.log('Scores:', scores);
                console.log('Total:', scores.total);
                
                return true;
            } else {
                // Give 0 score
                return false;
            };
        } catch(error: any) {
            console.error(error);
            return null;
        };
    };
};
