import { Query, Resolver } from 'type-graphql';
import levenshtein from 'fast-levenshtein';

const student = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <title>Headers and paragraphs</title>
    </head>
    <body>
        <h1>This is the main heading the page</h1>
        <input type="text" id="test" required="required" />
        <p>h1 defines the most important heading of the page.</p>
        <h2>This is the first sub-heading</h2>
        <p>h2 describes the first sub-heading of the page.</p>
        <h2>This is the second sub-heading</h2>
        <p>h3 describes the second sub-heading of the page.</p>
        <p>The h1 to h6 tags are used to define HTML headings.</p>
    </body>
    </html>
`;

const assignment = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <title>Headers and paragraphs</title>
    </head>
    <body>
        <h1>This is the main heading of the page</h1>
        <input type="text" name="test" id="test" required="required" />
        <p>h1 defines the most important heading of the page.</p>
        <h2>This is the first sub-heading</h2>
        <p>h2 describes the first sub-heading of the page.</p>
        <h3>This is the second sub-heading</h3>
        <p>h3 describes the second sub-heading of the page.</p>
        <p>The h1 to h6 tags are used to define HTML headings.</p>
    </body>
    </html>
`;


const isValidHTML = async (html: string) => {
    const validator = require('html-validator');

    try {
        const result = await validator({ data: html, validator: 'WHATWG' as any });
        console.log(result);
        return result.isValid;
    } catch(error: any) {
        console.error(error);
        return false;
    };
};


interface Categories {
    code: string;
    tags: string;
    attributes: string;
    text: string;
};

interface Distance {
    tags: number;
    attributes: number;
    text: number;
};


const divideCategories = (code: string) => {
    const removeAttributes = /<\s*([a-z][a-z0-9]*)\s.*?>/gi;
    const getText = /<\/?[^>]+(>|$)/g;
    const removeTags = /\<\w*|>/g;
    const removeSpaces = / +(?= )/g;

    const result: Categories = {
        code: '',
        tags: '',
        attributes: '',
        text: '',
    };
    
    // Remove attributes
    result.tags = code.replace(removeAttributes, '<$1>');
    result.tags = result.tags.match(getText)!.join('');

    // Get attributes
    result.attributes = code.match(removeAttributes)!.join('').replace(removeTags, '').replace(removeSpaces, '');

    // Get text
    result.text = code.replace(getText, ' ').replace(removeSpaces, '');

    return result;
};


const calculateLevenshteinDistance = (result1: Categories, result2: Categories) => {
    const distance: Distance = {
        tags: 0,
        attributes: 0,
        text: 0,
    };

    distance.tags = levenshtein.get(result1.tags, result2.tags);
    distance.attributes = levenshtein.get(result1.attributes, result2.attributes);
    distance.text = levenshtein.get(result1.text, result2.text);

    return distance;
};


// const makePercentage = (x: number) => {
//     // 0 mistakes = 100%
//     // 5 mistakes = 50% 
//     return -2 * Math.pow(x, 2) + 0 * x + 100;
// };


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

                const distance = calculateLevenshteinDistance(resultAssignment, resultStudent);

                console.log('Student:', resultStudent);
                console.log('Assignment:', resultAssignment);
                console.log('Levenshtein distance:', distance);
                
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
