import { Query, Resolver } from 'type-graphql';
import levenshtein from 'fast-levenshtein';


const html1 = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <title>Headers and paragraphs</title>
    </head>
    <body>
        <h1>This is the main heading of the page</h1>
        <input type="text" id="test" name="test" />
        <p>h1 defines the most important heading of the page.</p>
        <h2>This is the first sub-heading</h2>
        <p>h2 describes the first sub-heading of the page.</p>
        <h3>This is the second sub-heading</h3>
        <p>h3 describes the second sub-heading of the page.</p>
        <p>The h1 to h6 tags are used to define HTML headings.</p>
    </body>
    </html>
`;


const html2 = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <title>Headers and paragraphs</title>
    </head>
    <body>
        <h1>This is the main heading of the page</h1>
        <input type="text" name="test" id="test" />
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


const makePercentage = (x: number) => {
    // 0 mistakes = 100%
    // 5 mistakes = 50% 
    return -2 * Math.pow(x, 2) + 0 * x + 100;
};


@Resolver()
export class TestResolver {
    // repository = getRepository(Score);

    @Query(() => Boolean, { nullable: true })
    async test(): Promise<Boolean | undefined | null> {
        try {
            // Check if no errors and valid html file
            const isValid = await isValidHTML(html1);

            if(isValid) {       
                const minify = require('html-minifier').minify;

                const options = {
                    collapseBooleanAttributes: true,
                    collapseWhitespace: true,
                    removeComments: true,
                    sortAttributes: true,
                };

                const result = minify(html1, options);

                const result2 = minify(html2, options);

                console.log('Assignment:', result);
                console.log('Your code:', result2);
                
                const distance = levenshtein.get(result, result2);

                console.log('Levenshtein distance:', distance);
                
                console.log(`Score: ${makePercentage(distance)}%`);

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
