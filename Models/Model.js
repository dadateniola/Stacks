const connection = require('./connection');
const conn = connection.promise();
const pluralize = require("pluralize");

class Model {
    constructor(params = {}) {
        Object.assign(this, params);
        return this;
    }

    static get tableName() {
        let name = this.name;

        // Replace uppercase letters with underscore + lowercase
        name = name.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);

        // Split the name into an array of words
        let words = name.split('_');

        // Pluralize each word
        words = words.map(word => pluralize(word));

        // Join the words back together
        let pluralizedName = words.join('_');

        // Remove leading underscore, if any
        return pluralizedName.replace(/^_/, '').toLowerCase();
    }

    static async find(filters = [], table = null, columns = []) {
        let result = [];
        let params = [];
        let val = [];
        let operators = [];
        let sql = `SELECT ${columns.length ? columns.join(', ') : '*'} FROM ${table || this.tableName}`;

        try {
            if (filters.length) {
                if (Array.isArray(filters[0])) {
                    //Check if filters includes OR
                    let includesOr = filters.some(([p]) => p.toLowerCase() === 'or');
                    let includesLike = filters.some(([p]) => p.toLowerCase() === 'like');
                    //Assign the operator (OR/AND)
                    let operator = (includesOr) ? "OR" : "AND";
                    let separator = (includesLike) ? "LIKE" : "=";

                    //Check if filters contains order by
                    if (filters.map(item => item[0].toLowerCase()).includes("order by")) {
                        let orderByIndex = filters.findIndex(item => item[0].toLowerCase() === "order by");
                        operators.push(filters[orderByIndex]);
                        filters.splice(orderByIndex, 1);
                    }
                    //Checks if filters contains limit
                    if (filters.map(item => item[0].toLowerCase()).includes("limit")) {
                        let limitIndex = filters.findIndex(item => item[0].toLowerCase() === "limit");
                        operators.push(filters[limitIndex]);
                        filters.splice(limitIndex, 1);
                    }
                    //Checks if filters contains offset
                    if (filters.map(item => item[0].toLowerCase()).includes("offset")) {
                        let offsetIndex = filters.findIndex(item => item[0].toLowerCase() === "offset");
                        operators.push(filters[offsetIndex]);
                        filters.splice(offsetIndex, 1);
                    }

                    //Filter out the parameters and the values of arrays that have 2 values
                    params = filters.filter(([p, v]) => v !== undefined && v !== null && v !== '').map(([p, v]) => p);
                    val = filters.filter(([p, v]) => v !== undefined && v !== null && v !== '').map(([p, v]) => v);

                    //Pass the extra operators into a string (Order By, Limit, Offset)
                    let operatorsString = operators.map(op => op.join(' ')).join(' ');

                    //Insert the value for clause, basically WHERE clause
                    let clause = "";

                    //Add "where" in case there are still parameters after the operators have been removed
                    if (params.length) clause += ` WHERE`;
                    for (let i = 0; i < params.length; i++) {
                        clause += ` ${params[i]} ${separator} ? ${operator}`;
                    }

                    //Remove the last (and/or)
                    clause = clause.replace(/ (AND|OR)$/, '');

                    //Finally put the parts of the sql together
                    sql += `${clause} ${operatorsString}`;
                } else {
                    params.push(filters[0]);
                    val.push(filters[1]);

                    sql += ` WHERE ${params} = ?`;
                }
            }
            let rows = await this.query(sql, val);
            for (const row of rows) {
                result.push(new this(row));
            }
            return result;
        } catch (err) {
            console.error(`\n-- SQL: ${sql}\n-- Values: ${val}\n-- Filters: ${filters}\n-- ${err}\n`)
            return [];
        }
    }

    async add() {
        const columns = Object.keys(this).join(", ");
        const values = Object.values(this);

        const sql = `INSERT INTO ${this.constructor.tableName} (${columns}) VALUES (${Array(Object.keys(this).length).fill('?').join(', ')})`;
        try {
            const result = await this.constructor.query(sql, values);

            if (result.affectedRows > 0) {
                this.id = result.insertId;
                return result.affectedRows;
            } else {
                return 0;
            }
        } catch (error) {
            console.error(`\n-- SQL: ${sql}\n-- Columns: ${columns}\n-- Values: ${values}\n-- ${error}\n`)
            console.error(error);
            return { no: error.errno, message: error.sqlMessage };
        }
    }

    async multiAdd() {
        if (!this?.columns && !this?.values) return 0;

        const columns = this.columns.join(", ");
        const values = this.values.map(row => {
            return row.map(value => {
                return typeof value === 'string' ? `'${value}'` : value;
            });
        });

        const sql = `INSERT INTO ${this.constructor.tableName} (${columns}) VALUES ${values.map(row => `(${row.join(', ')})`).join(", ")}`;

        try {
            const result = await this.constructor.query(sql);

            if (result.affectedRows > 0) {
                this.id = result.insertId;
                return result.affectedRows;
            } else {
                return 0;
            }
        } catch (error) {
            console.error(`\n-- SQL: ${sql}\n-- Columns: ${columns}\n-- Values: ${values}\n-- ${error}\n`)
            console.error(error);
            return 0;
        }
    }

    async update() {
        try {
            let sql = `UPDATE ${this.constructor.tableName} SET ${Object.keys(this).join(' = ?, ')} = ? WHERE id = ?`;
            let result = await this.constructor.query(sql, [...Object.values(this), this.id]);
            return result.affectedRows;
        } catch (error) {
            console.error(error);
            return 0;
        }
    }

    static async delete(id) {
        try {
            let sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
            await this.query(sql, [id]);
        } catch (error) {
            console.error(`Error deleting record with id ${id}:`, error);
            throw error;  // Rethrow the error to signal the failure
        }
    }

    static async customSql(sql, val = '') {
        try {
            const rows = await this.query(sql, val);

            return (Array.isArray(rows)) ? rows?.map(row => new this(row)) : rows.affectedRows;
        } catch (error) {
            console.error(`Error executing custom SQL query:`, error);
            throw error;  // Rethrow the error to signal the failure
        }
    }

    static async query(sql, params = []) {
        if (sql) {
            let [results] = await conn.execute(sql, params);
            return results;
        }
    }

    static async resetDB() {
        try {
            await this.query('SET FOREIGN_KEY_CHECKS = 0');

            await this.query('DELETE FROM collections');
            await this.query('DELETE FROM collections_resources');
            await this.query('DELETE FROM courses');
            await this.query('DELETE FROM courses_lecturers');
            await this.query('DELETE FROM departments');
            await this.query('DELETE FROM departments_courses');
            await this.query('DELETE FROM histories');
            await this.query('DELETE FROM notifications');
            await this.query('DELETE FROM requests');
            await this.query('DELETE FROM resources');
            await this.query('DELETE FROM users');

            await this.query('SET FOREIGN_KEY_CHECKS = 1');

            //Do not change the order of the below code
            //---------------------------------------------------------------------------------

            //Insert departments
            await this.query(
                `
                    INSERT INTO departments (id, name, years, created_at, updated_at) VALUES
                    (1, 'Software Engineering', 4, '2024-05-06 19:22:16', '2024-05-06 19:22:16'),
                    (2, 'Computer Science', 4, '2024-05-06 19:22:16', '2024-05-06 19:22:16');
                `
            );

            //Insert users
            await this.query(
                `
                    INSERT INTO users (id, name, email, password, phone_number, department_id, pfp, role, created_at, updated_at) VALUES
                    ('123006', 'emmanuel samuel', 'emma@gmail.com', 'pass', '09052513369', NULL, 'avatar-4.png', 'lecturer', '2024-05-06 19:22:16', '2024-05-06 19:22:16'),
                    ('12345678', 'adele michael', 'adele@gmail.com', 'pass', '09010113209', 1, 'avatar-5.png', 'student', '2024-05-06 19:22:16', '2024-05-06 19:22:16'),
                    ('20/0018', 'baiyere fikayo', 'baiyere@gmail.com', 'pass', '09052513369', NULL, 'avatar-2.png', 'admin', '2024-05-06 19:22:16', '2024-05-06 19:22:16'),
                    ('20/0725', 'ajala oluwaferanmi', 'ajala@gmail.com', 'pass', '09052513369', NULL, 'avatar-3.png', 'admin', '2024-05-06 19:22:16', '2024-05-06 19:22:16'),
                    ('20/1554', 'dada teniola', 'dada@gmail.com', 'pass', '09052513369', NULL, 'avatar-1.png', 'admin', '2024-05-06 19:22:16', '2024-05-06 19:22:16');    
                `
            )

            //Insert courses
            await this.query(
                `
                INSERT INTO courses (id, code, name, description, created_at, updated_at) VALUES
                (1, 'GEDS 420', 'Biblical Principles in Personal and Professional Life', NULL, '2024-05-06 19:22:16', '2024-05-06 19:22:16'),
                (2, 'GEDS 400', 'Introduction to Entrepreneurial Skills', NULL, '2024-05-06 19:22:16', '2024-05-06 19:22:16'),
                (3, 'SENG 401', 'Mobile Applications Design and Developments', NULL, '2024-05-06 19:22:16', '2024-05-06 19:22:16'),
                (4, 'SENG 402', 'Human Computer Interaction and Emerging Technologies', NULL, '2024-05-06 19:22:16', '2024-05-06 19:22:16'),
                (5, 'SENG 404', 'Software Project Management', NULL, '2024-05-06 19:22:16', '2024-05-06 19:22:16'),
                (6, 'SENG 406', 'Formal Methods Specifications in Software Engineering', NULL, '2024-05-06 19:22:16', '2024-05-06 19:22:16'),
                (7, 'SENG 407', 'Software Measurement and Metrics', NULL, '2024-05-06 19:22:16', '2024-05-06 19:22:16'),
                (8, 'SENG 409', 'Network Security and Software Development', NULL, '2024-05-06 19:22:16', '2024-05-06 19:22:16'),
                (9, 'SENG 411', 'Open Source Systems Development', NULL, '2024-05-06 19:22:16', '2024-05-06 19:22:16'),
                (10, 'SENG 412', 'Internet Technologies and Web Applications Development', NULL, '2024-05-06 19:22:16', '2024-05-06 19:22:16'),
                (11, 'SENG 490', 'Research Project', NULL, '2024-05-06 19:22:16', '2024-05-06 19:22:16'),
                (12, 'COSC 423', 'Artificial Intelligence and Applications', NULL, '2024-05-06 19:22:16', '2024-05-06 19:22:16');
                `
            );

            //Insert resources
            await this.query(
                `
                    INSERT INTO resources (id, module, year, name, course_id, type, file, description, uploaded_by, created_at, updated_at) VALUES
                    (1, 1, NULL, 'introduction to entrepreneurship skills', 2, 'slide', 'GEDS 400-introduction to entrepreneurship skills-1715068836934.pdf', 'Welcome to Entrepreneurship skills, where we teach you how to be an entrepreneur', '123006', '2024-05-07 09:00:36', '2024-05-07 09:00:36'),
                    (2, 1, NULL, 'Introduction to biblical principles', 1, 'slide', 'GEDS 420-Introduction to biblical principles-1715069319089.pdf', 'Intro to the course', '123006', '2024-05-07 09:08:39', '2024-05-07 09:08:39'),
                    (3, 2, NULL, 'Road to being an entrepreneur', 2, 'slide', 'GEDS 400-Road to being an entrepreneur-1715069369389.pdf', 'Basics steps guiding you to being an entrepreneuer', '123006', '2024-05-07 09:09:29', '2024-05-07 09:09:29'),
                    (4, NULL, '2021 / 2022', 'mid semester exam', 1, 'past question', 'GEDS 420-mid semester exam-1715069466801.pdf', 'Mid seemster examination', '123006', '2024-05-07 09:11:06', '2024-05-07 09:11:06');
                `
            );

            //Insert requests
            await this.query(
                `
                    INSERT INTO requests (id, sender_id, sender_name, receiver, message, extra_info, type, handled_by, status, created_at, updated_at) VALUES
                    (1, '100001', 'john doe', 'admin', 'I tried to login and it denied my details, please grant me access as i am a student', 'example@babcock.edu.ng', 'access', NULL, 'pending', '2024-05-07 09:14:26', '2024-05-07 09:14:26');                
                `
            );

            //Insert notifications
            await this.query(
                `
                    INSERT INTO notifications (id, content_id, user_id, type, status, created_at, updated_at) VALUES
                    (1, 1, '20/0018', 'request', 'pending', '2024-05-07 09:14:26', '2024-05-07 09:14:26'),
                    (2, 1, '20/0725', 'request', 'pending', '2024-05-07 09:14:26', '2024-05-07 09:14:26'),
                    (3, 1, '20/1554', 'request', 'pending', '2024-05-07 09:14:26', '2024-05-07 09:14:26');
                `
            );

            //Insert histories
            await this.query(
                `
                    INSERT INTO histories (id, user_id, course_id, resource_id, created_at, updated_at) VALUES
                    (1, '123006', 2, NULL, '2024-05-06 19:22:53', '2024-05-07 09:10:14'),
                    (2, '123006', 1, NULL, '2024-05-06 19:23:01', '2024-05-07 09:11:35'),
                    (3, '123006', NULL, 3, '2024-05-07 09:09:49', '2024-05-07 09:09:49'),
                    (4, '123006', NULL, 4, '2024-05-07 09:11:30', '2024-05-07 09:11:30');
                `
            );

            //Insert departments_courses
            await this.query(
                `
                    INSERT INTO departments_courses (id, department_id, course_id, level, semester, created_at, updated_at) VALUES
                    (1, 1, 1, 400, 'second', '2024-05-06 19:22:16', '2024-05-06 19:22:16'),
                    (2, 1, 2, 400, 'first', '2024-05-06 19:22:16', '2024-05-06 19:22:16'),
                    (3, 1, 3, 400, 'first', '2024-05-06 19:22:16', '2024-05-06 19:22:16'),
                    (4, 1, 4, 400, 'second', '2024-05-06 19:22:16', '2024-05-06 19:22:16'),
                    (5, 1, 5, 400, 'first', '2024-05-06 19:22:16', '2024-05-06 19:22:16'),
                    (6, 1, 6, 400, 'second', '2024-05-06 19:22:16', '2024-05-06 19:22:16'),
                    (7, 1, 7, 400, 'first', '2024-05-06 19:22:16', '2024-05-06 19:22:16'),
                    (8, 1, 8, 400, 'first', '2024-05-06 19:22:16', '2024-05-06 19:22:16'),
                    (9, 1, 9, 400, 'first', '2024-05-06 19:22:16', '2024-05-06 19:22:16'),
                    (10, 1, 10, 400, 'second', '2024-05-06 19:22:16', '2024-05-06 19:22:16'),
                    (11, 1, 11, 400, 'second', '2024-05-06 19:22:16', '2024-05-06 19:22:16'),
                    (12, 1, 12, 400, 'first', '2024-05-06 19:22:16', '2024-05-06 19:22:16');
                `
            );

            //Insert courses_lecturers
            await this.query(
                `
                    INSERT INTO courses_lecturers (id, course_id, lecturer_id, created_at, updated_at) VALUES
                    (1, 1, '123006', '2024-05-06 19:22:16', '2024-05-06 19:22:16'),
                    (2, 2, '123006', '2024-05-06 19:22:16', '2024-05-06 19:22:16');
                `
            );

            //---------------------------------------------------------------------------------

            console.log("Database reset successful");
        } catch (error) {
            console.error('Error resetting database:', error);
            return null;
        }
    }
}

module.exports = Model;