class Updater {
    constructor(params = {}) {
        Object.assign(this, params);
        this.init();
    }

    init() {
        this.resources();
    }

    async resources() {
        const initLecturerCourses = new Items({ table: 'courses_lecturers', lecturer_id: this.id, columns: ['course_id']})
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
                stay: true
            };
        }
    
        CommonSetup.addItems(null, courseResources);
    }
}

// new Updater({ id: 123006 });

// CommonSetup.handleRequestTrigger(8)