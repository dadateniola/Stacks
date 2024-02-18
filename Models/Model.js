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

    static async find(filters = []) {
        let result = [];
        let params = [];
        let val = [];
        let operators = [];
        let sql = `SELECT * FROM ${this.tableName}`;

        try {
            if (filters.length) {
                if (Array.isArray(filters[0])) {
                    //Check if filters includes OR
                    let includesOr = filters.some(([p]) => p.toLowerCase() === 'or');
                    //Assign the operator (OR/AND)
                    let operator = (includesOr) ? "OR" : "AND";

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

                    //Filter out the parameters and the values of arrays that have 2 values
                    params = filters.filter(([p, v]) => v !== undefined && v !== null && v !== '').map(([p, v]) => p);
                    val = filters.filter(([p, v]) => v !== undefined && v !== null && v !== '').map(([p, v]) => v);

                    //Pass the extra operators into a string (Order By, and Limit)
                    let operatorsString = operators.map(op => op.join(' ')).join(' ');

                    //Insert the value for clause, basically WHERE clause
                    let clause = "";

                    //Add "where" in case there are still parameters after the operators have been removed
                    if (filters.length) clause += ` WHERE`;
                    for (let i = 0; i < params.length; i++) {
                        clause += ` ${params[i]} = ? ${operator}`;
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
            console.log(`SQL: ${sql}\nValues: ${val}\nFilters: ${filters}\n${err}`)
            return [];
        }
    }

    async add() {
        try {
            const columns = Object.keys(this).join(", ");
            const values = Array(Object.keys(this).length).fill('?').join(', ');

            const sql = `INSERT INTO ${this.constructor.tableName} (${columns}) VALUES (${values})`;

            const result = await this.constructor.query(sql, Object.values(this));

            if (result.affectedRows > 0) {
                this.id = result.uid;
                return result.affectedRows;
            } else {
                return 0;
            }
        } catch (error) {
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
            return rows.map(row => new this(row));
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
}

module.exports = Model;