const path = require('path');
const fs = require('fs').promises;
const nodemailer = require("nodemailer");

class Methods {
    constructor(params = {}) {
        Object.assign(this, params);
        return this;
    }

    validateData() {
        const validationRules = {
            // id: [
            //     /^\d{6}$/,
            //     /^\d{2}\/\d{4}$/,
            //     /^[a-zA-Z0-9]{8}$/
            // ],
            email: [
                /.+@.*babcock\.edu\.ng$/
            ],
            message: [/\S+/],
            name: [/\S+/],
            password: [/\w{4,}/],
            collection_name: [/\S+/],
            phone_number: [/^\d{11}$/],
            module: [/\S+/],
            course_id: [/\S+/],
            type: [/\S+/],
            description: [/\S+/],
            start_year: [/\S+/],
            end_year: [/\S+/],
            role: [/\S+/],
            department_id: [/\S+/],
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

                if (!isValid && key == 'password') {
                    result.invalidKeys[key] = 'Password cannot be shorter than 4 digits';
                    continue;
                }
                
                if (!isValid && key == 'phone_number') {
                    result.invalidKeys[key] = 'Phone number has to be 11 digits';
                    continue;
                }

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

    static tempFilename(id = null) {
        return id?.split("/").join("-") + '.pdf';
    }

    static formatDate(date = '') {
        return date?.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        }).split(" ").join(" - ");
    }

    static async sendEmail(email, subject, html) {
        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USERNAME,
                    pass: process.env.EMAIL_PASSWORD,
                },
            });

            const mailOptions = {
                from: process.env.EMAIL_USERNAME,
                to: email,
                subject: subject,
                html: html,
            };

            const info = await transporter.sendMail(mailOptions);
            console.log('Email sent:', info.response);
            return info.response;
        } catch (error) {
            console.error('Error sending email:', error.message);
            throw new Error('Failed to send email');
        }
    }

    static joinedName(data = {}) {
        return (data?.module) ?
            `Module ${data?.module}: ${data?.name}` :
            (data?.year) ? `${data?.year}: ${data?.name}` :
                `${data?.code}: ${data?.name}`;
    }

    static isObject(value) {
        return (typeof value === 'object' && value !== null && !Array.isArray(value));
    }

    static isEmptyObject(obj) {
        return Object.keys(obj).length === 0;
    }

    static async getPFP() {
        try {
            const filePath = path.resolve(__dirname, "..", "assets", "images", "avatars");

            const files = await fs.readdir(filePath);

            const avatars = files.filter(file => {
                const extension = path.extname(file).toLowerCase();
                return ['.png', '.jpg', '.jpeg', '.gif'].includes(extension);
            });

            if (avatars.length === 0) {
                throw new Error('No image files found in the directory.');
            }

            const index = Math.floor(Math.random() * avatars.length);
            const avatar = avatars[index];

            return avatar;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Methods;