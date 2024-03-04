const body = document.body;
const select = (e) => document.querySelector(e);
const selectAll = (e) => document.querySelectorAll(e);
const selectWith = (p, e) => p.querySelector(e);
const selectAllWith = (p, e) => p.querySelectorAll(e);
const create = (e) => document.createElement(e);
const root = (e) => getComputedStyle(select(":root")).getPropertyValue(e);
const getStyle = (e, style) => window.getComputedStyle(e)[style];

let resizeTimer;
gsap.registerPlugin(ScrollTrigger);

class Methods {
    constructor(params = {}) {
        Object.assign(this, params);
        return this;
    }

    static preventDefault = (event) => event.preventDefault();
    static disableLinksAndBtns = (condition = false, parent = undefined) => {
        const elements = parent ? selectAllWith(parent, "a, button") : selectAll('a, button');
        elements.forEach((element) => {
            if (condition) {
                element.setAttribute('disabled', 'true');

                if (element.tagName === 'A') {
                    element.dataset.href = element.href;
                    element.addEventListener('click', Methods.preventDefault);
                }
            } else {
                selectAll('a, button').forEach((element) => {
                    element.removeAttribute('disabled');

                    if (element.tagName === 'A') {
                        element.setAttribute('href', element.dataset.href);
                        element.removeEventListener('click', Methods.preventDefault);
                    }
                });
            }
        });
    }

    static formDataToJson = (formData) => {
        const entries = formData.entries();
        const dataObj = Array.from(entries).reduce((data, [key, value]) => {
            data[key] = value;
            return data;
        }, {});

        return JSON.stringify(dataObj);
    };

    static checkDeviceType = () => {
        const mobileThreshold = 768;
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
        const screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;

        if (isTouchDevice && screenWidth <= mobileThreshold) {
            return "mobile";
        } else {
            return "pc";
        }
    }

    static insertToDOM(params = {}) {
        // insertToDOM parameters {
        //     type: Element type
        //     text: innetHTML to be put in the element
        //     append: HTML element to be appended in case we aint using text
        //     parent: Element to hold the created element
        //     before: Element to place the created element before among the children of the parent
        //     classes: Classes of the element being created, can be array or String
        //     properties: CSS properties to be applied to the element, must be an object
        //     attributes: Attributes of the element being created, can be array or String
        // }

        const { type, text, append, parent, before, classes, properties, attributes, no_data } = params;

        if (!type) return null;

        //Insert element contents
        const element = create(type);

        if (text) {
            if (type == "img") element.src = text;
            else element.innerHTML = text;
        }

        //Append an HTML element instead of a text
        if (append) {
            element.appendChild(append);
        }

        //Add classes
        if (classes?.length) {
            if (Array.isArray(classes)) classes.forEach(c => element.classList.add(c));
            else element.classList.add(classes);
        }

        //Change properties
        if (properties) {
            if (Methods.isObject(properties)) {
                for (const property in properties) {
                    element.style[property] = properties[property];
                }
            }
        }

        if (attributes?.length) {
            if (Array.isArray(attributes)) attributes.forEach(([a, v]) => element.setAttribute(`${no_data ? '' : 'data-'}${a}`, v || ''));
            else element.setAttribute(`${no_data ? '' : 'data-'}${attributes}`, '');
        }

        //Append element to parent
        if (parent) {
            if (before) parent.insertBefore(element, before);
            else parent.appendChild(element);
        }

        return element;
    }

    static isObject(value) {
        return (typeof value === 'object' && value !== null && !Array.isArray(value));
    }

    static isEmptyObject(obj) {
        return Object.keys(obj).length === 0;
    }

    static sentenceCase(str = '') {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    static assignErrorMsgs(data) {
        Object.entries(data).forEach(([key, value]) => {
            const input = select(`[name=${key}]`);
            const parent = input.parentNode;

            Methods.removeErrorMsgs(input);

            Methods.insertToDOM({
                type: 'span',
                text: this.sentenceCase(value),
                parent,
                classes: 'error'
            })

            input.classList.add('error');
            input.addEventListener("focus", Methods.removeErrorMsgs)
            input.addEventListener("input", Methods.removeErrorMsgs)
        })
    }

    static removeErrorMsgs(e) {
        const input = e instanceof Event ? e.target : e;
        const nextSibling = input.nextElementSibling;

        if (nextSibling && nextSibling.tagName === 'SPAN' && nextSibling.classList.contains('error')) nextSibling.remove();

        input.classList.remove('error');
        input.removeEventListener("focus", Methods.removeErrorMsgs);
        input.removeEventListener("input", Methods.removeErrorMsgs)
    }

    static trimLength(event) {
        const input = (event instanceof Event) ? event.target : event;

        if (input.value.length > 4) input.value = input.value.slice(0, 4);
    }

    static formatDate(str = '') {
        const date = new Date(str);
        return date?.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        }).split(" ").join(" - ");
    }

    static joinedName(data = {}) {
        return (data?.module) ?
            `Module ${data?.module}: ${data?.name}` :
            `${data?.year}: ${data?.name}`
    }
}

class CommonSetup {
    constructor(params = {}) {
        Object.assign(this, params);
        this.init();
        return this;
    }

    init() {
        CommonSetup.updateGrid();
        window.addEventListener('resize', CommonSetup.handleResize);

        select(`a[href='${window.location.pathname}']`)?.classList.add("stacks-active");

        // Change this later
        const info = select(".alert-box [data-info]");
        if (info) {
            const type = selectWith(info, "#type").innerHTML;
            const message = selectWith(info, "#message").innerHTML;

            info.remove();
            select(".alert-box").removeAttribute("data-disabled")

            new Alert({ type, message })
        }

        CommonSetup.initializeTriggers();
        this.initializeRequestBtns();
        this.initializeForms();
        this.initializeFileUpload();
    }

    //Update grid sizes for sections
    static updateGrid() {
        selectAll(".section-grid").forEach(grid => {
            const threshold = 240 + 20;
            const width = grid.clientWidth;
            const columns = Math.floor(width / threshold);

            grid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
        });
    }

    static handleResize() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(CommonSetup.updateGrid, 500);
    }

    //Trigger overlay for different cases
    static initializeTriggers() {
        //Clear the event from all triggers and close buttons
        selectAll('[data-trigger]').forEach(trigger => trigger.addEventListener(`${trigger?.dataset?.event || 'click'}`, CommonSetup.openTrigger));
        selectAll('[data-close]').forEach(trigger => trigger.addEventListener('click', CommonSetup.closeTrigger));

        //Reassign the event to all triggers and close buttons
        selectAll('[data-trigger]').forEach(trigger => trigger.addEventListener(`${trigger?.dataset?.event || 'click'}`, CommonSetup.openTrigger));
        selectAll('[data-close]').forEach(trigger => trigger.addEventListener('click', CommonSetup.closeTrigger));
    }

    static openTrigger() {
        if (this.hasAttribute('data-animated')) return;
        const currentlyTriggered = select('#overlay [data-triggered]');

        const animate = select(`.${this.dataset?.affect}`) || this;
        const triggered = select(`#${this.dataset?.trigger}`);
        const children = (selectAllWith(triggered, 'section').length) ? selectAllWith(triggered, 'section') : triggered.children;
        const tl = gsap.timeline();

        if (currentlyTriggered) {
            const currentTrigger = select(`[data-trigger="${currentlyTriggered.id}"][data-animated]`);
            tl
                .to(currentlyTriggered, { opacity: 0 })
                .call(() => {
                    currentTrigger.classList.remove("add");

                    currentTrigger.removeAttribute('data-animated', '');
                    currentlyTriggered.removeAttribute('data-triggered');
                })
        }

        tl
            .call(() => {
                animate.classList.add('active');
                select("#overlay").classList.add(
                    (this.dataset?.affect && this.dataset?.affect == "search") ? 'active-search' : 'active'
                );

                this.setAttribute('data-animated', '');
                triggered.setAttribute('data-triggered', '');

                CommonSetup.updateGrid();

                CommonSetup.redirectTriggerHandle(this);
            })
            .set(children, { opacity: 0 })
            .set(triggered, { opacity: 0 })
            .to(triggered, { opacity: 1, delay: 0.3 })
            .to(children, { opacity: 1, stagger: 0.3 })
    }

    static closeTrigger() {
        const triggered = select('#overlay [data-triggered]');
        const trigger = select(`[data-trigger="${triggered.id}"][data-animated]`);
        const animate = select(`.${trigger?.dataset?.affect}`) || trigger;

        const tl = gsap.timeline();

        tl
            .to(triggered, { opacity: 0 })
            .call(() => {
                animate?.classList.remove('active');
                select("#overlay").classList.remove(
                    (trigger?.dataset?.affect && trigger?.dataset?.affect == "search") ? 'active-search' : 'active'
                );

                trigger?.removeAttribute('data-animated', '');
                triggered?.removeAttribute('data-triggered');
            }, null, '+=0.3')
    }

    static async redirectTriggerHandle(elem) {
        if (!(elem instanceof HTMLElement)) {
            new Alert({ message: "Something went wrong, try again", type: 'error' });
            return;
        }

        const trigger = elem.dataset?.trigger;
        const identifier = elem.dataset?.identifier;

        if (trigger == 'resource') await CommonSetup.handleResourceTrigger(identifier)
        if (trigger == 'course-box') await CommonSetup.handleCourseTrigger(identifier)
        
        CommonSetup.initializeTriggers();
    }

    //Insert data and sections into the DOM
    static addItems(data = {}, sections = {}) {
        const parent = (data?.parent instanceof HTMLElement) ? data.parent : null;

        if (!parent) {
            console.warn("Conditions not met to 'addItems'");
            return;
        }

        delete data.parent;

        selectAllWith(parent, "section[data-delete]").forEach(e => e.remove());

        Object.entries(data).forEach(([key, value]) => {
            const elem = selectWith(parent, `[data-resource-${key}]`);
            elem.innerText = value;
        })

        for (const key in sections) {
            const sectionData = sections[key];
            const parent = (sectionData?.parent instanceof HTMLElement) ? sectionData.parent : null;
            const heading = sectionData.heading || 'no heading';

            if (!parent) continue;

            if (!sectionData.data.length) {
                const sectionEmpty = `
                    <div class="section-head">
                        <div class="section-info">
                            <p>${heading}</p>
                            <div class="line"></div>
                        </div>
                    </div>
                    <div class="section-empty">
                        <p>No ${heading} available</p>
                    </div>
                `;
                const section = Methods.insertToDOM({ type: 'section', text: sectionEmpty, parent, attributes: 'delete' });

                continue;
            }

            delete sectionData.parent;
            delete sectionData.heading;

            const sectionHeadHtml = `
                    <div class="section-info">
                        <p>${heading}</p>
                        <div class="line"></div>
                    </div>
                    <div class="section-format">
                        <div class="line"></div>
                        <button class="stacks-active">
                            <img src="/images/icons/row dark.png" alt="icon">
                        </button>
                        <button>
                            <img src="/images/icons/grid dark.png" alt="icon">
                        </button>
                    </div>
            `;
            const sectionHead = Methods.insertToDOM({ type: 'div', text: sectionHeadHtml, classes: 'section-head' });
            const section = Methods.insertToDOM({ type: 'section', append: sectionHead, parent, attributes: 'delete' });

            var tableRow = '';
            sectionData.data.forEach(obj => {
                const data = {
                    name: Methods.joinedName(obj),
                    date_added: Methods.formatDate(obj.created_at),
                    last_updated: Methods.formatDate(obj.updated_at),
                }

                tableRow += `<tr data-trigger="resource" data-identifier="${obj.id}">`;
                Object.entries(data).forEach(([key, value]) => {
                    tableRow += `<td><p>${value}</p></td>`;
                });
                tableRow += '</tr>';
            })

            const sectionTableHtml = `
                    <table>
                        <colgroup>
                            <col>
                            <col span="2" style="width: 140px;">
                        </colgroup>
                        <tbody>
                            <tr>
                                <th>name</th>
                                <th>date added</th>
                                <th>last updated</th>
                            </tr>
                            ${tableRow}
                        </tbody>
                    </table>
            `;

            const section_table = Methods.insertToDOM({ type: 'div', text: sectionTableHtml, classes: 'section-table', parent: section });
        }
    }

    //Load correct data when a resource is triggered
    static async handleResourceTrigger(id = null) {
        if (!id) {
            new Alert({ message: "Missing identifier for resource retrieval, please reload the page and try again", type: 'error' });
            return;
        }

        try {
            const initResources = new Items({ table: 'resources', id })
            const resources = await initResources.find();
            const resource = resources[0];

            const initCourses = new Items({ table: 'courses', id: resource.course_id })
            const courses = await initCourses.find();
            const course = courses[0];

            const initMoreLikeThis = new Items({ table: 'resources', course_id: resource.course_id, 'not id': id })
            const moreLikeThis = await initMoreLikeThis.find();

            const joinedName = Methods.joinedName(resource);

            const data = {
                parent: select('#overlay #resource'),
                joinedName,
                code: course.code,
                description: resource.description,
                type: resource.type,
                added: Methods.formatDate(resource.created_at),
                updated: Methods.formatDate(resource.updated_at)
            }

            const more_like_this = {
                parent: select('#overlay #resource .item-left'),
                heading: 'more like this',
                data: moreLikeThis
            }

            CommonSetup.addItems(data, { more_like_this });

            //Additional adjustments
            select('#overlay #resource [data-resource-code]').setAttribute('data-identifier', course.id);
        } catch (error) {
            console.error('Error in test:', error);
            new Alert({ message: "Error retrieving resource information, please try again", type: 'error' });
        }
    }
    
    //Load correct data when a course is triggered
    static async handleCourseTrigger(id = null) {
        if (!id) {
            new Alert({ message: "Missing identifier for course retrieval, please reload the page and try again", type: 'error' });
            return;
        }

        try {
            const initCourses = new Items({ table: 'courses', id })
            const courses = await initCourses.find();
            const course = courses[0];
    
            const initCourseLecturers = new Items({ table: 'courses_lecturers', course_id: course.id })
            const courseLecturers = await initCourseLecturers.find();
    
            const initSlides = new Items({ table: 'resources', course_id: course.id, type: 'slide' })
            const slides = await initSlides.find();
    
            const initPQs = new Items({ table: 'resources', course_id: course.id, type: 'past question' })
            const pqs = await initPQs.find();
    
            const data = {
                parent: select('#overlay #course-box'),
                code: course.code,
                name: course.name,
            }
    
            const courseSlides = {
                parent: select('#overlay #course-box .item-left'),
                heading: 'course slides',
                data: slides
            }
    
            const coursePQs = {
                parent: select('#overlay #course-box .item-left'),
                heading: 'past questions',
                data: pqs
            }
    
            CommonSetup.addItems(data, { courseSlides, coursePQs });
        } catch (error) {
            console.error('Error in test:', error);
            new Alert({ message: "Error retrieving course information, please try again", type: 'error' });
        }
    }

    //Handle "call to action" for requests
    initializeRequestBtns() {
        selectAll("[data-request-cta] button").forEach(button => {
            button.addEventListener("click", CommonSetup.openRequestCTA);
        })

        select("[data-request-back]")?.addEventListener("click", CommonSetup.closeRequestCTA);
    }

    static openRequestCTA() {
        Methods.disableLinksAndBtns(true, select("[data-request-cta]"));

        const elem = this;

        CommonSetup.attachSpinner({ elem });

        const cta = select(".request-cta-box");
        const open = elem?.dataset.open;
        const requestInputs = select("[data-request-inputs]");
        const toOpen = selectWith(requestInputs, `#${open}`);

        const tl = gsap.timeline();
        tl
            .call(() => toOpen.classList.add("active"))
            .set(cta.children, { opacity: 0 })
            .to(cta, { height: 'auto', ease: 'expo.out' })
            .to(cta.children, { opacity: 1 }, '-=0.31')

        this.setAttribute("data-selected", '')
        select('.request-btns >*:not([data-selected])')?.setAttribute('data-denied', '')
        CommonSetup.detachSpinner({ elem });
    }

    static closeRequestCTA(event) {
        const elem = event.target;

        CommonSetup.attachSpinner({ elem });

        const cta = select(".request-cta-box");
        const canOpen = selectAll("[data-request-inputs] >*");

        const tl = gsap.timeline();

        tl
            .to(cta.children, { opacity: 0 })
            .to(cta, { height: 0, ease: 'expo.out' }, '-=0.31')
            .call(() => {
                canOpen.forEach(e => e.classList.remove("active"))
                Methods.disableLinksAndBtns(false, select("[data-request-cta]"))
            })

        select(".request-btns [data-selected]").removeAttribute("data-selected");
        select(".request-btns [data-denied]").removeAttribute("data-denied");
        CommonSetup.detachSpinner({ elem });
    }

    //Attach spinner to elements
    static attachSpinner(params = {}) {
        const { elem } = params;

        if (!(elem instanceof HTMLElement)) return console.warn('Conditions not met to "attachSpinner"');

        const spinner = selectWith(elem, ".spinner");

        if (spinner) return;

        const width = elem.clientWidth;
        const height = elem.clientHeight;

        elem.style.width = `${width}px`;
        elem.style.height = `${height}px`;

        if (elem.children.length) elem.classList.add("none")
        else {
            elem.dataset.innerText = elem.innerText;
            elem.innerText = '';
        }

        Methods.insertToDOM({
            type: 'div',
            parent: elem,
            append: Methods.insertToDOM({
                type: 'span',
                attributes: 'spinner'
            }),
            classes: 'spinner'
        })
    }

    static detachSpinner(params = {}) {
        const { elem } = params;

        if (!(elem instanceof HTMLElement)) return console.warn('Conditions not met to "detachSpinner"');

        setTimeout(() => {
            const spinner = selectWith(elem, ".spinner");

            if (!spinner) return;

            spinner.remove();

            if (elem.children.length) elem.classList.remove("none")
            else {
                elem.innerText = elem.dataset?.innerText;
                elem.removeAttribute("data-innerText");
            }
        }, 300);
    }

    //Handle form submissions
    initializeForms() {
        select("form").addEventListener("submit", CommonSetup.handleFormSubmission)
    }

    static async handleFormSubmission(event) {
        event.preventDefault();

        const form = event.target;
        if (!(form instanceof HTMLElement)) return new Alert({ message: "Couldn't find form data for submission", type: 'warning' });

        var button = selectWith(form, 'button[type="submit"]');
        if (!button) button = select(`button[type="submit"][form=${form?.id}]`);

        CommonSetup.attachSpinner({ elem: button });

        const formData = new FormData(form);
        const url = form.action;

        formData.delete('pdfFile');

        if (!url) return location.reload();

        try {
            const response = await fetch(url, {
                method: "POST",
                body: Methods.formDataToJson(formData),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.invalidKeys) {
                //If there are invalid inputs display messages
                Methods.assignErrorMsgs(data.invalidKeys);
                CommonSetup.detachSpinner({ elem: button });
            } else {
                if (response.ok) {
                    if (data?.url) return window.location.href = data?.url || "/";
                    else {
                        //If request successful, show alert
                        form?.reset();
                        new Alert(data);

                        const parent = select('label[data-preview="pdfFile"]');
                        CommonSetup.resetFileInput(null, parent)
                        CommonSetup.detachSpinner({ elem: button });
                    }
                } else {
                    //If there was a problem in the backend, display alert
                    new Alert(data);
                    CommonSetup.detachSpinner({ elem: button });
                }
            };
        } catch (error) {
            new Alert({ message: 'Error submitting the form, please try again', type: 'error' });
            console.error('Error:', error);
        }
    }

    //Handle file uploads
    initializeFileUpload() {
        select("input[type='file']")?.addEventListener('change', CommonSetup.handleFileSelect);

        select("select[data-module-select]")?.addEventListener("change", CommonSetup.changeModule)
        select("select[data-type-select]")?.addEventListener("change", CommonSetup.changeType)
    }

    static async changeModule(event) {
        const elem = (event instanceof Event) ? event.target : event;
        const toChange = select('input[name="module"]');

        if (!toChange || !elem.value) return;

        const allItems = new Items({
            custom: `SELECT MAX(module) AS module FROM resources WHERE course_id = ${elem.value}`
        })

        const items = await allItems.find();
        const highest_module = items[0].module;

        toChange.value = highest_module ? highest_module + 1 : 1;
    }

    static async changeYear(event) {
        const input = (event instanceof Event) ? event.target : event;
        const endInput = select('input[name="end_year"]');
        const value = parseInt(input.value);
        const date = new Date();
        const currentYear = date.getFullYear();

        if (value.toString().length >= 4) {
            if (value > currentYear) {
                Methods.assignErrorMsgs({ start_year: `Start year caannot be higher than ${currentYear}` })
            } else {
                endInput.value = value + 1;
            }
        } else {
            endInput.value = null;
        }
    }

    static changeType(event) {
        const html = {
            'past question': `
                    <label>year</label>
                    <div class="form-row">
                        <div class="form-group">
                            <input type="number" name="start_year" id="start_year" placeholder="0000">
                        </div>
                        <div class="form-slash">
                            <div class="slash-box">
                                <div class="slash"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <input type="number" name="end_year" id="end_year" placeholder="0000" readonly>
                        </div>
                    </div>
                `,
            slide: `
                    <label for="module">module</label>
                    <input type="number" name="module" id="module" value="0" readonly>
                    `,
        }

        const elem = event.target;
        const toChange = select('[data-module-year]');
        const value = elem.value;

        if (!html[value]) return;

        toChange.innerHTML = html[value];

        if (value == 'slide') CommonSetup.changeModule(select("select[data-module-select]"));
        if (value == 'past question') {
            const input = select('input[name="start_year"]');
            input?.addEventListener('input', Methods.trimLength);
            input?.addEventListener('input', CommonSetup.changeYear);
        }
    }

    static handleFileSelect(event) {
        const input = event.target;
        const file = input.files[0];

        if (file && file.type === 'application/pdf') {
            CommonSetup.uploadFile({ file, input });
        } else {
            new Alert({ message: 'Please select a valid PDF file', type: 'warning' });
            CommonSetup.resetFileInput(input);
        }
    }

    static uploadFile(params = {}) {
        const { file, input } = params;
        const fileNameExt = selectAll(".form-file-name-ext span");
        const cancelBtn = select(`button[data-target="${input.name}"]`);

        if (!file || !input) {
            new Alert({ message: 'Something went wrong, please try again', type: 'warning' });
            return console.warn("Conditions not met for upload");
        }

        //Change filename and extension in upload information
        fileNameExt.forEach(span => {
            if (span.hasAttribute("data-form-filename")) {
                span.innerHTML = file.name.split(".").slice(0, -1).join('.');
            } else {
                span.innerHTML = "." + file.name.split(".").pop();
            }
        })

        //Reveal form upload information        
        gsap.to('.form-file-info', { paddingTop: 10, height: 30, ease: 'expo.out' })

        const progressBar = select(".form-file-progress-bar");
        const formData = new FormData();
        formData.append('pdfFile', file);

        const xhr = new XMLHttpRequest();

        // Event listener for progress
        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
                const percentComplete = ((event.loaded / event.total) * 100).toFixed(1);
                progressBar.style.width = `${percentComplete}%`;
            }
        });

        // Event listener for cancel button
        cancelBtn.addEventListener('click', abortXHR);

        // Event listener for state change
        xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    const data = JSON.parse(xhr.responseText)
                    displayPreview(data.filename);
                    new Alert({ message: 'File upload complete', type: 'success' });
                    CommonSetup.resetFileInput(input);

                    //Clean up     
                    cancelBtn.removeEventListener("click", abortXHR);
                    gsap.to('.form-file-info', { paddingTop: 0, height: 0, ease: 'expo.out' });

                } else if (xhr.status === 0) {
                    console.log('Upload cancelled by user');
                } else {
                    const data = JSON.parse(xhr.responseText)
                    new Alert(data);
                    CommonSetup.resetFileInput(input);

                    //Clean up     
                    cancelBtn.removeEventListener("click", abortXHR);
                    gsap.to('.form-file-info', { paddingTop: 0, height: 0, ease: 'expo.out' });
                }
            }
        };

        //Abort xhr
        function abortXHR() {
            //Abort the request
            xhr.abort();

            new Alert({ message: 'File upload cancelled', type: 'warning' });
            CommonSetup.resetFileInput(input);

            //Clean up     
            cancelBtn.removeEventListener("click", abortXHR);
            gsap.to('.form-file-info', { paddingTop: 0, height: 0, ease: 'expo.out' });
        }

        //Display document preview
        function displayPreview(filename = '') {
            const parent = select(`label[data-preview="${input.name}"]`);

            if (!(parent instanceof HTMLElement)) return console.warn('Conditions not met to "displayPreview"');

            selectWith(parent, 'iframe')?.remove();

            if (parent.children.length) parent.classList.add("none");

            Methods.insertToDOM({
                type: 'iframe',
                parent,
                attributes: [
                    ['src', `/get-pdf/${filename}/preview`],
                    ['width', '100%'],
                    ['height', '100%']
                ],
                no_data: true
            })
        }

        xhr.open('POST', '/upload', true);
        xhr.send(formData);
    }

    static resetFileInput(input, parent) {
        if (input) {
            input.value = '';
        }

        const progressBar = select(".form-file-progress-bar");
        if(progressBar) progressBar.style.width = 0;

        if (parent) {
            selectWith(parent, 'iframe')?.remove();
            parent.classList.remove("none");
        }
    }
}

class Items {
    constructor(params = {}) {
        Object.assign(this, params);
    }

    async find() {
        try {
            const response = await fetch('/get-items', {
                method: 'POST',
                body: JSON.stringify(this),
                headers: {
                    'Content-Type': 'application/json'
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Fetch error:', error.message);
        }
    }
}

class Alert {
    constructor(params = {}) {
        Object.assign(this, params);
        this.init();
    }

    init() {
        Methods.disableLinksAndBtns(true);

        if (!this?.type && !this?.message) return console.warn("Conditions weren't met for Alert");

        const html = `
            <div class="alert-progress"></div>
            <div class="alert-icon">
                <img src="/images/icons/${this.type}.png" alt="icon">
            </div>
            <div class="alert-text">
                <h1>${this.type}</h1>
                <p>${this.message}</p>
            </div>`;

        const newAlert = Methods.insertToDOM({
            type: 'div',
            text: html,
            parent: select(".alert-box"),
            classes: 'alert',
            attributes: this.type,
            properties: { opacity: 0 }
        })
        const prevAlert = newAlert.previousElementSibling;

        this.openAlert(newAlert);

        if (prevAlert) Alert.closeAlert(prevAlert);
        Methods.disableLinksAndBtns();
    }

    openAlert(alert) {
        if (!alert instanceof HTMLElement) return;

        const alertTime = 5;
        const tl = gsap.timeline();

        tl
            .set(alert, { xPercent: 120 })
            .to(alert, { xPercent: 0, opacity: 1, ease: 'back.out(1.7)', })
            .to(selectWith(alert, ".alert-progress"), { duration: alertTime, width: '100%', ease: 'none', onComplete: () => Alert.closeAlert(alert) })
    }

    static closeAlert(alert) {
        if (!alert instanceof HTMLElement) return;

        gsap.to(alert, { x: -80, opacity: 0, delay: 0.5, ease: "expo.out", onComplete: () => alert.remove() })
    }
}

new CommonSetup();