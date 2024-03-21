class Updater {
    constructor(params = {}) {
        Object.assign(this, params);
        this.init();
    }

    async init() {
        const type = this?.type;

        if (!type) return console.warn("Failed to update DOM as 'type' isn't defined");

        if (type == 'resource') await this.resources();
        if (type == 'user') await this.users();
    }

    async resources() {
        try {
            if (!this?.id) return console.warn("Failed to update DOM as 'id' isn't defined");

            const initLecturerCourses = new Items({ table: 'courses_lecturers', lecturer_id: this.id, columns: ['course_id'] })
            const lecturerCourses = await initLecturerCourses.find();

            selectAll("main.main-content section").forEach(section => section.remove());

            const courseResources = {};

            for (const course of lecturerCourses) {
                const [key, value] = Object.entries(course)[0];

                const initCourseDesc = new Items({ table: 'courses', id: value, columns: ['code'] });
                const [courseDesc] = await initCourseDesc.find();

                const initResources = new Items({ table: 'resources', course_id: value });
                const resources = await initResources.find();

                resources.forEach(resource => {
                    resource.date_added = Methods.formatDate(resource.created_at);
                    resource.last_updated = Methods.formatDate(resource.updated_at);
                })

                courseResources[courseDesc.code] = {
                    parent: select('main.main-content'),
                    heading: courseDesc.code,
                    data: resources,
                    type: true,
                    stay: true,
                    empty: 'resource'
                };
            }

            CommonSetup.addItems(null, courseResources);
            CommonSetup.initializeTriggers();
        } catch (error) {
            console.error('Error in Updater resources:', error);
            new Alert({
                message: "Error updating the website, please reload",
                type: 'error'
            });
        }
    }

    async users() {
        try {
            const initAllUsers = new Items({ table: 'users', 'order by': 'created_at desc' });
            const allUsers = await initAllUsers.find();

            const roles = {};
            const users = [];

            const parent = select("main.main-content section");
            const table = selectWith(parent, "tr").parentNode;
            parent.setAttribute("is-replaced", true)
            selectAllWith(parent, "tr:not(:first-child)").forEach(tr => tr.remove());

            allUsers.forEach(user => {
                const { role } = user;
                roles[role] = (roles[role] || 0) + 1;

                const info = {
                    id: user.id,
                    role: user.role,
                    name: user.name,
                    email: user.email,
                    phone_number: user.phone_number
                }

                users.push(info);
            });

            users.forEach((user) => {
                const tr = Methods.insertToDOM({
                    type: 'tr',
                    attributes: [['trigger', 'user'], ['identifier', user.id]]
                })

                Object.entries(user).forEach(([key, value]) => {
                    const td = Methods.insertToDOM({
                        type: 'td',
                        parent: tr,
                        text: value || 'NULL',
                        classes: (key == 'email') ? 'no-cap' : null
                    })
                });

                table.append(tr);
            });

            const data = {
                parent,
                all: allUsers.length,
                ...roles,
                stay: true
            }

            CommonSetup.addItems(data);
            CommonSetup.initializeTriggers();
        } catch (error) {
            console.error('Error in Updater users:', error);
            new Alert({
                message: "Error updating the website, please reload",
                type: 'error'
            });
        }
    }
}

class Randomizer {
    constructor(params = {}) {
        Object.assign(this, params);
        this.init();
    }

    init() {
        const form = select(`#${this?.form}`);

        if (!form) {
            new Alert({
                message: "Couldn't find the form to randomize",
                type: 'error'
            })
            console.warn('No "form" was specified for randomizer');
            return;
        };

        const inputs = selectAllWith(form, 'input, select');

        for (const elem of inputs) {
            if (elem.tagName.toLowerCase() === 'input') {
                const name = elem.getAttribute("name");
                var value = null;

                if (name == 'id') value = Methods.generateRandomNumber(6);
                if (name == 'name') value = Methods.generateRandomName();
                if (name == 'email') value = this.generateEmail();
                if (name == 'password') value = 'pass';
                if (name == 'phone_number') value = Methods.generateRandomPhoneNumber();

                elem.value = value;
            } else if (elem.tagName.toLowerCase() === 'select') {
                if (elem.hasAttribute("data-avoid-randomizer")) continue;
                const optionsWithValue = Array.from(elem.options).filter(option => option.value !== '');

                if (optionsWithValue.length > 0) {
                    const randomIndex = Math.floor(Math.random() * optionsWithValue.length);
                    elem.value = optionsWithValue[randomIndex].value;
                }
            }
        }
    }

    generateEmail() {
        const name = Methods.generateRandomName().split(" ").shift().toLowerCase();
        const code = Methods.generateRandomNumber(4);
        const mail = Math.random() < 0.5 ? '@student.babcock.edu.ng' : '@babcock.edu.ng';

        return name + code + mail;
    }
}