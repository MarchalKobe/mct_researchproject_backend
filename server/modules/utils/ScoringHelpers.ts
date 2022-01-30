import levenshtein from 'fast-levenshtein';
import CodeCategories from '../../types/CodeCategories';
import CodeDistances from '../../types/CodeDistances';
import CodeScores from '../../types/CodeScores';

export const isValidHTML = async (html: string) => {
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

export const divideCategories = (code: string) => {
    const removeAttributes = /<\s*([a-z][a-z0-9]*)\s.*?>/gi;
    const getText = /<\/?[^>]+(>|$)/g;
    const removeTags = /\<\w*|>/g;
    const removeSpaces = / +(?= )/g;

    const result: CodeCategories = {
        code: '',
        tags: '',
        attributes: '',
        text: '',
    };
    
    // Remove attributes
    result.tags = code.replace(removeAttributes, '<$1>');
    result.tags = result.tags.match(getText)!.join('').trim();

    // Get attributes
    result.attributes = code.match(removeAttributes)!.join('').replace(removeTags, '').replace(removeSpaces, '').trim();

    // Get text
    result.text = code.replace(getText, ' ').replace(removeSpaces, '').trim();

    return result;
};

export const calculateLevenshteinDistance = (result1: CodeCategories, result2: CodeCategories) => {
    const distance: CodeDistances = {
        tags: levenshtein.get(result1.tags, result2.tags),
        attributes: levenshtein.get(result1.attributes, result2.attributes),
        text: levenshtein.get(result1.text, result2.text),
    };

    return distance;
};

const calculateNormalDistribution = (sigma: number, x: number) => {
    return 100 * Math.pow(Math.E, -(1 / 2) * (Math.pow((x - 0) / sigma, 2)));
};

export const calculateScores = (distance: CodeDistances) => {
    const scores: CodeScores = {
        tags: Math.round(calculateNormalDistribution(2.6, distance.tags)),
        attributes: Math.round(calculateNormalDistribution(5.4, distance.attributes)),
        text: Math.round(calculateNormalDistribution(16, distance.text)),
    };

    scores.total = Math.round((scores.tags + scores.attributes + scores.text) / 3);

    return scores;
};
