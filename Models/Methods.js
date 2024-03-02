const fs = require('fs').promises;

class Methods {
    constructor(params = {}) {
        Object.assign(this, params);
        return this;
    }

    validateData() {
        const validationRules = {
            id: [
                /^\d{6}$/,
                /^\d{2}\/\d{4}$/,
                /^[a-zA-Z0-9]{8}$/
            ],
            email: [
                /.+@.*babcock\.edu\.ng$/
            ],
            name: [/\S+/],
            module: [/\S+/],
            course_id: [/\S+/],
            type: [/\S+/],
            description: [/\S+/],
            start_year: [/\S+/],
            end_year: [/\S+/],
        };

        const result = {
            invalidKeys: {},
            unknownKeys: [],
        };

        const entries = Object.entries(this);

        for (let i = 0; i < entries.length; i++) {
            const [key, value] = entries[i];

            if (validationRules.hasOwnProperty(key)) {
                const name = key.split("_").join(" ");

                if (!value.trim().length) {
                    result.invalidKeys[key] = `${name} cannot be left empty`;
                    continue;
                }

                const isValid = validationRules[key].some(rule => rule.test(value));

                if (!isValid) result.invalidKeys[key] = `The format for ${name} is invalid`;
            } else result.unknownKeys.push(key);
        }

        return result;
    }

    // Static methods
    static generateUniqueID() {
        const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const idLength = 8;
        const maxAttempts = 1000000; // Maximum attempts to generate a unique ID

        // Helper function to generate a random character from the specified characters
        const getRandomCharacter = () => characters[Math.floor(Math.random() * characters.length)];

        let attempts = 0;

        // Attempt to generate a unique ID
        while (attempts < maxAttempts) {
            // Generate a random ID using timestamp, random characters, and a counter
            const timestamp = Date.now().toString(36);
            const randomChars = Array.from({ length: idLength - timestamp.length }, getRandomCharacter).join('');
            const uniqueID = timestamp + randomChars;

            // Check if the generated ID matches the required regex
            if (/^[a-zA-Z0-9]{8}$/.test(uniqueID)) {
                return uniqueID;
            }

            attempts++;
        }

        // Return an error if a unique ID couldn't be generated in the specified attempts
        throw new Error('Unable to generate a unique ID within the specified attempts.');
    }

    static capitalize(str = '') {
        const words = str.split(' ');

        const capitalizedWords = words.map(word => word.charAt(0).toUpperCase() + word.slice(1));

        const capitalizedSentence = capitalizedWords.join(' ');

        return capitalizedSentence;
    }

    static sentenceCase(text = '', lowercase = false) {
        const str = text.replace(/\s+/g, ' ').trim();
        return (lowercase) ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : str.charAt(0).toUpperCase() + str.slice(1);
    }

    static async checkFileExistence(params = {}) {
        const { filePath } = params;

        try {
            await fs.stat(filePath);
            return true;
        } catch (err) {
            if (err.code === 'ENOENT') {
                return false;
            } else {
                console.error('Error checking file:', err);
                return false;
            }
        }
    }
}

module.exports = Methods;