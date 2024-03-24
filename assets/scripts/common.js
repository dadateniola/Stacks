const body = document.body;
const select = (e) => document.querySelector(e);
const selectAll = (e) => document.querySelectorAll(e);
const selectWith = (p, e) => p.querySelector(e);
const selectAllWith = (p, e) => p.querySelectorAll(e);
const create = (e) => document.createElement(e);
const root = (e) => getComputedStyle(select(":root")).getPropertyValue(e);
const getStyle = (e, style) => window.getComputedStyle(e)[style];

let resizeTimer;
let tracking = [];
gsap.registerPlugin(ScrollTrigger);

function capitalize(text = '') {
    const splitText = text.split(" ");

    splitText.forEach((word, index) => {
        const hasSpan = (word.indexOf('<span>') == -1) ? null : word.indexOf('<span>');

        //Capitalize letters after space
        splitText[index] = splitText[index].charAt(0).toUpperCase() + splitText[index].slice(1);

        if (hasSpan == null) return;
        if (hasSpan == 0) splitText[index] = "<span>" + splitText[index].charAt(6).toUpperCase() + splitText[index].slice(7)
    })

    return splitText.join(" ")
}

class Methods {
    constructor(params = {}) {
        Object.assign(this, params);
        return this;
    }

    static customAdd(obj = {}, params = {}) {
        const { parent, heading, pfp } = params;

        var row = '<tr>';
        var head = '<tr>';

        Object.entries(obj).forEach(([key, value]) => {
            const isMail = (key == 'email' || key == 'password') ? 'class="no-cap"' : '';
            row += `<td><p ${isMail} data-edit-${key}>` + value + '</p></td>';
            head += '<td>' + key.split('_').join(' ') + '</td>';
        })

        row += '</tr>';
        head += '</tr>';

        const sectionHeadHtml = `
            <div class="section-info">
                <p>${heading}</p>
                <div class="line"></div>
                <div class="user-img flex">
                    ${pfp ? `<img src="/images/avatars/${pfp}" alt="lecturer">` : ''}
                </div>
            </div>
        `;
        const sectionTableHtml = `
            <table>
                <colgroup>
                    
                </colgroup>
                <tbody>
                    ${head}
                    ${row}
                </tbody>
            </table>
        `;


        const sectionHead = Methods.insertToDOM({
            type: 'div',
            text: sectionHeadHtml,
            classes: 'section-head'
        });
        const section = Methods.insertToDOM({
            type: 'section',
            append: heading ? sectionHead : null,
            parent: selectWith(parent, '.item-left'),
            attributes: 'delete'
        });
        const section_table = Methods.insertToDOM({
            type: 'div',
            text: sectionTableHtml,
            classes: 'section-table',
            parent: section
        });
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

                    if (element.tagName === 'A' && element.dataset?.href) {
                        element.setAttribute('href', element.dataset.href);
                        element.removeEventListener('click', Methods.preventDefault);
                    }
                });
            }
        });
    }

    static trackOutsideClick(elem, animation) {
        if (!(elem instanceof HTMLElement)) return console.warn("Cannot track mouse clicks of a non-HTML element");

        const trackingId = Symbol();
        tracking.push({ id: trackingId, elem, animation });

        return trackingId;
    }

    static trackClick(event) {
        if (!tracking.length) return;
    
        const target = (event instanceof Event) ? event.target : event;
    
        const trackingCopy = [...tracking];
    
        trackingCopy.forEach(({ id, elem, animation }) => {
            if (!elem.contains(target)) {
                animation();
                Methods.stopTracking(id);
            }
        });
    }
    

    static stopTracking(trackingId) {
        const index = tracking.findIndex(entry => entry.id === trackingId);
        if (index !== -1) {
            tracking.splice(index, 1);
        }
    }

    static formDataToJson = (formData) => {
        const entries = formData.entries();
        const dataObj = Array.from(entries).reduce((data, [key, value]) => {
            data[key] = value;
            return data;
        }, {});

        return JSON.stringify(dataObj);
    }

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

    static capitalize(str = '') {
        const words = str.split(' ');

        const capitalizedWords = words.map(word => word.charAt(0).toUpperCase() + word.slice(1));

        const capitalizedSentence = capitalizedWords.join(' ');

        return capitalizedSentence;
    }

    static sentenceCase(str = '') {
        return str ? str.charAt(0).toUpperCase() + str.slice(1) : null;
    }

    static assignErrorMsgs(data) {
        const { scope } = data;

        delete data.scope;

        Object.entries(data).forEach(([key, value]) => {
            const input = scope ? select(`${scope} [name=${key}]`) : select(`[name=${key}]`);
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
            (data?.year) ? `${data?.year}: ${data?.name}` :
                `${data?.code}: ${data?.name}`;
    }

    static generateRandomName() {
        const firstNames = ['Adam', 'Alice', 'Bob', 'Carol', 'David', 'Emma', 'Frank', 'Grace', 'Hannah', 'Isaac', 'Jade', 'Kevin', 'Linda', 'Michael', 'Nancy', 'Oliver', 'Pamela', 'Quinn', 'Rachel', 'Samuel', 'Tina', 'Ursula', 'Victor', 'Wendy', 'Xavier', 'Yvonne', 'Zack'];
        const lastNamePrefixes = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Rodriguez', 'Wilson', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Hernandez', 'Moore', 'Martin', 'Jackson', 'Thompson', 'White'];

        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastNamePrefix = lastNamePrefixes[Math.floor(Math.random() * lastNamePrefixes.length)];

        return firstName + ' ' + lastNamePrefix;
    }

    static generateRandomNumber(numDigits) {
        const min = Math.pow(10, numDigits - 1); // Minimum value based on the number of digits
        const max = Math.pow(10, numDigits) - 1; // Maximum value based on the number of digits
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static generateRandomPhoneNumber() {
        const prefixes = ["090", "080", "070"];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const remainingDigits = Math.random().toString().substring(3, 11); // Generate 8 random digits

        return prefix + remainingDigits;
    }
}

class CommonSetup {
    constructor(params = {}) {
        Object.assign(this, params);
        this.init();
        return this;
    }

    async init() {
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

        document.body.addEventListener('click', Methods.trackClick);
        select("[data-delete-no]")?.addEventListener("click", () => Methods.trackClick(document.body));
        select("[data-edit-cancel]")?.addEventListener("click", () => Methods.trackClick(document.body));
        select("[data-sidebar-btn]")?.addEventListener("click", CommonSetup.sidebar);
        select("[data-sidebar-toggle]")?.addEventListener("click", CommonSetup.toggleSidebar);

        CommonSetup.initializeTriggers();
        this.initializeRandomizer();
        this.initializeSearch();
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
        selectAll('[data-trigger]').forEach(trigger => trigger.removeEventListener(`${trigger?.dataset?.event || 'click'}`, CommonSetup.openTrigger));
        selectAll('[data-close]').forEach(trigger => trigger.removeEventListener('click', CommonSetup.closeTrigger));

        //Other buttons
        selectAll('[data-share]').forEach(share => share.removeEventListener("click", CommonSetup.share));
        selectAll('[data-collection]').forEach(share => share.removeEventListener("click", CommonSetup.collection));
        selectAll('[data-delete-btn]').forEach(del => del.removeEventListener("click", CommonSetup.delete));
        selectAll('[data-edit-btn]').forEach(edit => edit.removeEventListener("click", CommonSetup.edit));

        //---------------------------------------------------------------------------------

        //Reassign the event to all triggers and close buttons
        selectAll('[data-trigger]').forEach(trigger => trigger.addEventListener(`${trigger?.dataset?.event || 'click'}`, CommonSetup.openTrigger));
        selectAll('[data-close]').forEach(trigger => trigger.addEventListener('click', CommonSetup.closeTrigger));

        //Other buttons
        selectAll('[data-share]').forEach(share => share.addEventListener("click", CommonSetup.share));
        selectAll('[data-collection]').forEach(share => share.addEventListener("click", CommonSetup.collection));
        selectAll('[data-delete-btn]').forEach(del => del.addEventListener("click", CommonSetup.delete));
        selectAll('[data-edit-btn]').forEach(edit => edit.addEventListener("click", CommonSetup.edit));
    }

    initializeRandomizer() {
        selectAll("button[data-random]").forEach(button => {
            const form = button.dataset?.random;
            button.addEventListener("click", () => {
                CommonSetup.attachSpinner({ elem: button });
                new Randomizer({ form });
                CommonSetup.detachSpinner({ elem: button });
            });
        })
    }

    static openTrigger() {
        if (this.hasAttribute('data-animated')) return;
        const currentlyTriggered = select('#overlay [data-triggered]');

        const animate = select(`.${this.dataset?.affect}`) || this;
        const triggered = select(`#${this.dataset?.trigger}`);

        if (!triggered) {
            new Alert({
                message: "The page you're requesting for isn't available",
                type: 'warning'
            })
            console.warn(`No triggerable element found, Searching "#${this.dataset?.trigger}"`);
            return;
        }

        const children = (selectAllWith(triggered, 'section').length) ? selectAllWith(triggered, 'section') : triggered.children;
        const tl = gsap.timeline();

        if (currentlyTriggered) {
            const currentTrigger = select(`[data-trigger="${currentlyTriggered.id}"][data-animated]`);
            tl
                .to(currentlyTriggered, { opacity: 0 })
                .call(() => {
                    currentTrigger?.classList.remove("add");

                    CommonSetup.clearTriggered();

                    currentTrigger?.removeAttribute('data-animated', '');
                    currentlyTriggered?.removeAttribute('data-triggered');
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

                CommonSetup.clearTriggered();

                trigger?.removeAttribute('data-animated', '');
                triggered?.removeAttribute('data-triggered');
            }, null, '+=0.3')
    }

    static clearTriggered() {
        selectAll("[data-resource-inserted]").forEach(elem => {
            elem.innerHTML = '-';
            elem.removeAttribute('data-resource-inserted');
        });
        selectAll('[data-delete]').forEach(elem => elem.remove());
        select("#delete-overlay input[name='id']").value = '';
        select("#delete-overlay input[name='type']").value = '';
    }

    static async redirectTriggerHandle(elem) {
        if (!(elem instanceof HTMLElement)) {
            new Alert({ message: "Something went wrong, try again", type: 'error' });
            return;
        }

        const trigger = elem.dataset?.trigger;
        const identifier = elem.dataset?.identifier;

        if (getStyle(select("#sidebar-overlay"), "display") == "block") {
            Methods.trackClick(document.body);
        }

        CommonSetup.handleHistory(identifier, trigger);

        if (trigger == 'resource') await CommonSetup.handleResourceTrigger(identifier)
        if (trigger == 'course-box') await CommonSetup.handleCourseTrigger(identifier)
        if (trigger == 'request') await CommonSetup.handleRequestTrigger(identifier)
        if (trigger == 'collection') await CommonSetup.handleCollectionInfoTrigger(identifier);
        if (trigger == 'user') await CommonSetup.handleUserTrigger(identifier);
        if (trigger == 'search-box') CommonSetup.handleSearchTrigger(elem);

        if (trigger == 'user' || trigger == 'resource' || trigger == 'course-box' || trigger == 'collection') {
            select("#delete-overlay input[name='type']").value = trigger;
            select("#delete-overlay input[name='id']").value = identifier;

            const editOverlay = select("#edit-overlay");

            editOverlay.setAttribute("data-edit-type", trigger);
            editOverlay.setAttribute("data-edit-identifier", identifier);

            selectWith(editOverlay, "input[type='hidden'][name='type']").value = trigger;
            selectWith(editOverlay, "input[type='hidden'][name='id']").value = identifier;
        }

        CommonSetup.initializeTriggers();
    }

    static async share() {
        const url = window.location.href;

        this.innerHTML = 'link copied';
        this.classList.add("active")

        setTimeout(() => {
            this.innerHTML = 'share';
            this.classList.remove("active")
        }, 5000);

        try {
            await navigator.clipboard.writeText(url);
            new Alert({
                message: 'Link copied to clipboard',
                type: 'success'
            })
        } catch (err) {
            console.error('Unable to copy to clipboard', err);
            new Alert({
                message: 'Unable to copy link to clipboard',
                type: 'error'
            })
        }
    }

    static collection() {
        if (!(this instanceof HTMLElement)) return console.warn("Clicked element is not an HTML Element");

        const button = this;
        const cont = button.closest('.item-cont');

        if (!cont) return console.warn("Element not found");

        const overlay = select(".add-to-collection-box");
        const popup = select(".add-to-collection-cont");

        CommonSetup.openPopup({ button, cont, overlay, popup, run: [CommonSetup.handleCollectionTrigger] });
    }

    static delete() {
        if (!(this instanceof HTMLElement)) return console.warn("Clicked element is not an HTML Element");

        const button = this;
        const cont = button.closest('.item-cont');

        if (!cont) return console.warn("Element not found");

        const overlay = select("#delete-overlay");
        const popup = selectWith(overlay, '.pop-up-cont');

        CommonSetup.openPopup({ button, cont, overlay, popup });
    }

    static edit() {
        if (!(this instanceof HTMLElement)) return console.warn("Clicked element is not an HTML Element");

        const button = this;
        const cont = button.closest('.item-cont');

        if (!cont) return console.warn("Element not found");

        const overlay = select("#edit-overlay");
        const popup = selectWith(overlay, '.pop-up-cont');

        CommonSetup.openPopup({ button, cont, overlay, popup, run: [CommonSetup.handleEditTrigger] });
    }

    static sidebar() {
        if (!(this instanceof HTMLElement)) return console.warn("Clicked element is not an HTML Element");

        const button = this;
        const loader = selectWith(this, '.cta');
        const overlay = select("#sidebar-overlay");
        const popup = selectWith(overlay, ".sidebar-cont");
        const background = select(".content")

        const tl = gsap.timeline();

        tl
            .call(() => {
                CommonSetup.attachSpinner({ elem: loader, color: 'red' });
            })
            .set(popup, { opacity: 0, x: -50 })
            .set(overlay, { display: 'block' })
            .to(background, { opacity: 0.5 })
            .to(popup, { opacity: 1, x: 0, ease: 'Back.easeOut' }, '<')
            .call(() => {
                Methods.trackOutsideClick(popup, () => CommonSetup.closeSidebar({ popup, overlay, background, loader }))
            })

    }

    static closeSidebar(params = {}) {
        const { popup, overlay, background, loader } = params;

        const tl = gsap.timeline();

        tl
            .to(popup, { opacity: 0, x: 50, ease: 'Back.easeOut' })
            .to(background, { opacity: 1 }, '<')
            .set(overlay, { display: 'none' })
            .call(() => {
                CommonSetup.detachSpinner({ elem: loader });
            })

    }

    static toggleSidebar() {
        const sidebar = select(".sidebar");
        const content = select(".content");

        const tl = gsap.timeline();

        if (sidebar.hasAttribute("data-sidebar-open")) {
            tl
                .to(sidebar, { x: '-100%', ease: 'Expo.easeOut', clearProps: true })
                .to(content, { opacity: 1 }, '<')
                .call(() => {
                    sidebar.removeAttribute("data-sidebar-open");
                })
        } else {
            tl
                .to(sidebar, { x: 0, ease: 'Expo.easeOut' })
                .to(content, { opacity: 0.5 }, '<')
                .call(() => {
                    sidebar.setAttribute("data-sidebar-open", '');
                    Methods.trackOutsideClick(sidebar, () => CommonSetup.toggleSidebar())
                })
        }
    }

    static openPopup(params = {}) {
        const { button, cont, overlay, popup, run } = params;

        if (!(button instanceof HTMLElement)) return console.warn("Button isn't an HTML Element");
        if (!(cont instanceof HTMLElement)) return console.warn("Cont isn't an HTML Element");
        if (!(overlay instanceof HTMLElement)) return console.warn("Overlay isn't an HTML Element");
        if (!(popup instanceof HTMLElement)) return console.warn("Popup isn't an HTML Element");

        const tl = gsap.timeline();

        tl
            .call(() => {
                button.classList.add("active");
                CommonSetup.attachSpinner({ elem: button });
                run?.forEach(func => func());

                cont.setAttribute('cont-is-waiting', '');
                button.setAttribute('btn-is-waiting', '');
            })

            .set(popup, { opacity: 0, yPercent: 100 })
            .set(overlay, { display: 'block' })
            .to(cont, { scale: 0.9, opacity: 0.5, ease: 'expo.inOut', duration: 2 })
            .to(popup, { opacity: 1, yPercent: 0, ease: 'expo.out' }, "-=1")
            .call(() => {
                Methods.trackOutsideClick(popup, () => CommonSetup.closePopup({ button, cont, overlay, popup }))
            })
    }

    static closePopup(params = {}) {
        const { button, cont, overlay, popup } = params;

        if (!(button instanceof HTMLElement)) return console.warn("Button isn't an HTML Element");
        if (!(cont instanceof HTMLElement)) return console.warn("Cont isn't an HTML Element");
        if (!(overlay instanceof HTMLElement)) return console.warn("Overlay isn't an HTML Element");
        if (!(popup instanceof HTMLElement)) return console.warn("Popup isn't an HTML Element");

        const tl = gsap.timeline();

        tl
            .to(popup, { opacity: 0, yPercent: 100 })
            .to(cont, { scale: 1, opacity: 1, ease: 'expo.inOut', duration: 2 }, "<")
            .set(overlay, { display: 'none' })
            .call(() => {
                CommonSetup.detachSpinner({ elem: button });
                button?.classList.remove("active");

                cont.removeAttribute('cont-is-waiting');
                button.removeAttribute('btn-is-waiting');
            })
    }

    //Insert data and sections into the DOM
    static addItems(data = {}, sections = {}, extra_data = []) {
        const parent = (data?.parent instanceof HTMLElement) ? data.parent : null;
        const dataStay = data?.stay;

        if (parent) {
            delete data.parent;
            delete data.stay;

            selectAllWith(parent, "section[data-delete]").forEach(e => e.remove());

            for (const [key, value] of Object.entries(data)) {
                const elem = selectWith(parent, `[data-resource-${key}]`);

                if (!elem) continue;

                elem.innerText = value;
                dataStay ? '' : elem.setAttribute("data-resource-inserted", "");
            }
        }

        for (const key in sections) {
            const sectionData = sections[key];
            const parent = (sectionData?.parent instanceof HTMLElement) ? sectionData.parent : null;

            const heading = sectionData.heading || null;
            const code = sectionData?.code;
            const empty = sectionData?.empty;

            const type = sectionData?.type;
            const stay = sectionData?.stay;
            const added = (sectionData.hasOwnProperty('added')) ? sectionData.added : true;
            const updated = (sectionData.hasOwnProperty('updated')) ? sectionData.updated : true;

            if (!parent) continue;

            if (!sectionData.data.length) {
                const sectionEmpty = `
                    ${heading ?
                        `
                    <div class="section-head">
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
                    </div>
                    ` : ''
                    }
                    <div class="section-empty">
                        <p>No ${empty || heading || 'results'} available</p>
                    </div>
                `;
                const section = Methods.insertToDOM({ type: 'section', text: sectionEmpty, parent, attributes: stay ? 'stay' : 'delete' });

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
            const section = Methods.insertToDOM({ type: 'section', append: heading ? sectionHead : null, parent, attributes: stay ? 'stay' : 'delete' });

            var tableRow = '';
            sectionData.data.forEach(obj => {
                const data = {};
                const trigger = (obj?.code) ? 'course-box' : 'resource';

                const extra_data_obj = extra_data.find(extra_obj => {
                    const condition = obj?.course_id || obj?.id;

                    return extra_obj.id == condition;
                })

                if (code) data.code = extra_data_obj?.code;
                if (type) data.type = obj?.type || 'course';

                data.name = Methods.joinedName(obj);

                if (added) data.date_added = Methods.formatDate(obj.created_at);
                if (updated) data.last_updated = Methods.formatDate(obj.updated_at);

                tableRow += `<tr data-trigger=${trigger} data-identifier="${obj.id}">`;
                Object.entries(data).forEach(([key, value]) => {
                    tableRow += `<td><p>${value}</p></td>`;
                });
                tableRow += '</tr>';
            })

            const sectionTableHtml = `
                    <table>
                        <colgroup>
                            ${code ? '<col style="width: 100px;">' : ''}
                            ${type ? '<col style="width: 140px;">' : ''}
                            <col>
                            ${added ? '<col style="width: 140px;">' : ''}
                            ${updated ? '<col style="width: 140px;">' : ''}
                        </colgroup>
                        <tbody>
                            <tr>
                                ${code ? '<th>code</th>' : ''}
                                ${type ? '<th>type</th>' : ''}
                                <th>name</th>
                                ${added ? '<th>date added</th>' : ''}
                                ${updated ? '<th>last updated</th>' : ''}
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
            const [resource] = await initResources.find();

            const initCourses = new Items({ table: 'courses', id: resource.course_id })
            const [course] = await initCourses.find();

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
            select('#overlay #resource [data-resource-read]').setAttribute('href', `/get-pdf/${resource.file}`)
            select('#overlay #resource .add-to-collection-box').setAttribute('data-identifier', id)
            select("input[name='resource_id']").value = id;
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
                description: course.description,
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
            console.error('Error in handleCourseTrigger:', error);
            new Alert({ message: "Error retrieving course information, please try again", type: 'error' });
        }
    }

    //Load correct data when a request is triggered
    static async handleRequestTrigger(id = null) {
        CommonSetup.closeRequestCTA();

        if (!id) {
            new Alert({ message: "Missing identifier for request retrieval, please reload the page and try again", type: 'error' });
            return;
        }

        try {
            const initRequests = new Items({ table: 'requests', id });
            const requests = await initRequests.find();
            const request = requests[0];

            var handled_by = null;

            if (!request) return new Alert({ message: "Request not found", type: "warning" })

            if (request.handled_by) {
                const initUsers = new Items({ table: 'users', id: request.handled_by });
                const [user] = await initUsers.find();

                handled_by = `Request handled by ${Methods.capitalize(user.name)}`;

                select(".request-box")?.classList.add("handled");
            } else {
                select(".request-box")?.classList.remove("handled");
            }

            const data = {
                parent: select("#overlay #request"),
                type: `${request.type} request`,
                title: `Received an ${request.type} request from ${Methods.capitalize(request.sender_name)}`,
                message: request.message,
                sender_id: request.sender_id,
                extra_info: request.extra_info,
                handled_by
            }

            const hiddenInput = select("#request-id");
            const buttonsCTA = selectAll("[data-request-cta] button");
            var open = (request.type == 'access') ? ['message', 'select'] : ['message', 'message'];

            hiddenInput.value = id;

            buttonsCTA.forEach((button, index) => {
                if (button.nextElementSibling instanceof HTMLElement) {
                    button.setAttribute('data-response', 'decline');
                } else {
                    button.setAttribute('data-response', 'accept');
                }
                button.setAttribute('data-open', open[index]);
            })

            CommonSetup.addItems(data);
        } catch (error) {
            console.error('Error in handleRequestTrigger:', error);
            new Alert({ message: "Error retrieving request information, please try again", type: 'error' });
        }
    }

    //Load correct data when a user is triggered
    static async handleUserTrigger(id = null) {
        if (!id) {
            new Alert({ message: "Missing identifier for course retrieval, please reload the page and try again", type: 'error' });
            return;
        }

        try {
            const initUsers = new Items({ table: 'users', id });
            const [user] = await initUsers.find();

            const parent = select("#overlay #user");

            delete user.created_at;
            delete user.updated_at;

            const info = {
                id: user.id,
                name: user.name,
                role: user.role
            }

            const extra_info = {
                email: user.email,
                password: user.password,
                phone_number: user.phone_number,
            }

            const data = {
                parent,
                name: user.name
            }

            CommonSetup.addItems(data);

            Methods.customAdd(info, { parent, heading: 'user infromation', pfp: user.pfp });
            Methods.customAdd(extra_info, { parent });

            CommonSetup.initializeTriggers();
        } catch (error) {
            console.error('Error in *:', error);
            new Alert({
                message: "Error retrieving user information, please try again",
                type: 'error'
            });
        }
    }

    //Load correct data when search is triggered
    static handleSearchTrigger(input) {
        const value = input?.value || "";

        CommonSetup.search(value);
    }

    //Load correct data when collection is triggered (when opening a collections information)
    static async handleCollectionInfoTrigger(id = null) {
        if (!id) {
            new Alert({ message: "Missing identifier for collection retrieval, please reload the page and try again", type: 'error' });
            return;
        }

        try {
            const initCollections = new Items({ table: 'collections', id })
            const [collection] = await initCollections.find();

            const initSlides = new Items({
                custom: `
                        SELECT * FROM resources
                        WHERE id IN (
                            SELECT resource_id FROM collections_resources
                            WHERE collection_id = ${collection.id}
                        ) AND type = 'slide';
                        `
            });
            const slides = await initSlides.find();

            const initPQs = new Items({
                custom: `
                        SELECT * FROM resources
                        WHERE id IN (
                            SELECT resource_id FROM collections_resources
                            WHERE collection_id = ${collection.id}
                        ) AND type = 'past question';
                        `
            });
            const pqs = await initPQs.find();

            const initCourses = new Items({ custom: 'SELECT code, id FROM courses' })
            const courses = await initCourses.find();

            const data = {
                parent: select('#overlay #collection'),
                name: Methods.sentenceCase(collection.collection_name),
                description: Methods.sentenceCase(collection.description) || 'No description',
                slides: slides.length,
                pqs: pqs.length
            }

            const courseSlides = {
                parent: select('#overlay #collection .item-left'),
                heading: 'slides',
                data: slides,
                code: true,
                updated: false
            }

            const coursePQs = {
                parent: select('#overlay #collection .item-left'),
                heading: 'past questions',
                data: pqs,
                code: true,
                updated: false
            }

            CommonSetup.addItems(data, { courseSlides, coursePQs }, courses);
        } catch (error) {
            console.error('Error in handleCollectionInfoTrigger:', error);
            new Alert({ message: "Error retrieving collection information, please try again", type: 'error' });
        }
    }

    //Load correct data when collection is triggered (when attempting to add a resources to a collection)
    static async handleCollectionTrigger() {
        const existingCollections = select(".item-box#resource .existing-collections");
        const resource_id = select(".add-to-collection-box")?.dataset?.identifier;

        try {
            const response = await fetch('/get-user-collections', {
                method: 'POST'
            })

            if (!response.ok) throw new Error('Unable to fetch user collections')

            const data = await response.json();

            if (!data.length) {
                existingCollections.innerHTML = `
                <div class="section-empty">
                    <p>No user collections available</p>
                </div>
            `;

                return;
            }

            existingCollections.innerHTML = '';

            for (const collection of data) {
                const initHasResource = new Items({ table: 'collections_resources', collection_id: collection.id, resource_id })
                const hasResource = await initHasResource.find();

                const disable = (hasResource.length) ? true : false;

                const html = `
                        <p>${collection.collection_name}</p>
                        <div class="collection-cta">
                            <img src="/images/icons/${disable ? 'accepted.png' : 'arrow right.png'}" alt="icon">
                        </div>
                    `;

                Methods.insertToDOM({
                    type: 'button',
                    parent: existingCollections,
                    text: html,
                    classes: 'collection',
                    attributes: [['identifier', collection.id]]
                })
            }

            selectAllWith(existingCollections, 'button').forEach(button => {
                button.addEventListener('click', (e) => {
                    const button = e.target;
                    const identifier = button.dataset?.identifier;

                    CommonSetup.attachSpinner({ elem: selectWith(button, '.collection-cta'), color: 'var(--faint-gray)' })

                    CommonSetup.handleCollectionResource(identifier, button);
                })
            })
        } catch (error) {
            console.error('Error fetching user collections:', error);
            existingCollections.innerHTML = `
                <div class="section-empty">
                    <p class="error">Couldn't get user collections</p>
                </div>
        `;
        }
    }

    static async handleCollectionResource(collection_id = null, button) {
        try {
            const resource_id = select(".add-to-collection-box")?.dataset?.identifier;

            if (!collection_id || !resource_id) {
                new Alert({ message: "Missing identifier for adding resource to collection, please reload the page and try again", type: 'error' });
                return;
            }

            const response = await fetch('/add-collection-resource', {
                method: 'POST',
                body: JSON.stringify({
                    resource_id,
                    collection_id
                }),
                headers: {
                    'Content-Type': 'application/json'
                },
            })

            const data = await response.json();

            if (!response.ok) {
                new Alert(data);

                CommonSetup.detachSpinner({ elem: selectWith(button, '.collection-cta') });

                return;
            }

            const imgPath = '/images/icons/accepted.png';
            const img = selectWith(button, '.collection-cta img');

            img.setAttribute("src", imgPath);

            new Alert(data);

            CommonSetup.detachSpinner({ elem: selectWith(button, '.collection-cta') })
            setTimeout(() => {
                Methods.trackClick(document.body);
            }, 500);
        } catch (error) {
            console.error('Error adding resource to collection:', error);

            new Alert({
                message: "Couldn't add resource to the collection, please try again",
                type: 'error'
            });

            CommonSetup.detachSpinner({ elem: selectWith(button, '.collection-cta') });
        }
    }

    static handleEditTrigger() {
        const editOverlay = select("#edit-overlay");
        const type = editOverlay.getAttribute("data-edit-type");
        const id = editOverlay.getAttribute("data-edit-identifier");

        selectAll('[data-edit-delete]').forEach(elem => elem.remove());

        const editForm = select("#edit-overlay form");
        const before = selectWith(editForm, '.form-row');
        const inputs = selectAll(`#overlay .hidden#hidden [data-edit-trigger="${type}"] .form-group`);
        inputs.forEach(elem => {
            const clone = elem.cloneNode(true);
            clone.setAttribute("data-edit-delete", '')

            editForm.insertBefore(clone, before);
        })

        CommonSetup.fixJoinedNames(type);

        const formInputs = selectAllWith(editForm, "input, textarea");
        for (const elem of formInputs) {
            const name = elem.getAttribute("name");
            const info = selectAll(`#${type} [data-edit-${name}]`);

            if (!info.length) continue;
            const value = info[0].innerText;

            elem.value = value;
            elem.addEventListener("focus", function (event) {
                info.forEach(e => e.innerHTML = '<mark>' + event.target.value + '</mark>')
            })
            elem.addEventListener("blur", function (event) {
                info.forEach(e => e.innerHTML = event.target.value)
            })
            elem.addEventListener("input", function (event) {
                event.target.value = Methods.sentenceCase(event.target.value);
                info.forEach(e => e.innerHTML = '<mark>' + event.target.value + '</mark>')
            })
        }
    }

    static fixJoinedNames(type) {
        const joinedName = select(`#${type} [data-edit-joinedName]`);

        if (!joinedName) return;

        const splitJoined = joinedName.innerText.split(":");
        const span = '<span data-edit-name>' + splitJoined.pop() + '</span>';

        joinedName.innerHTML = splitJoined.shift() + ': ' + span;
    }

    //Stores viewed resource into history
    static async handleHistory(id = null, trigger) {
        if (!id) return;

        const type = trigger.includes("course") ? 'course' : trigger;
        const column = (type == 'course') ? 'course_id' : (type == 'resource') ? 'resource_id' : null;

        if (!column) return;

        try {
            const response = await fetch('/add-history', {
                method: 'POST',
                body: JSON.stringify({ id, type }),
                headers: {
                    'Content-Type': 'application/json'
                },
            });

            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        } catch (error) {
            console.error('Fetch error:', error.message);
            new Alert({
                message: "Couldn't update user history",
                type: 'error'
            })
        }
    }

    initializeSearch() {
        const inputElement = select("input[data-trigger='search-box']");
        const loader = inputElement?.nextElementSibling;
        let timeout;

        inputElement?.addEventListener("input", function () {
            const input = this;
            const value = input.value;
            const sectionTable = select(".search-box section [data-delete]");

            if (sectionTable) gsap.to(sectionTable, { opacity: 0, duration: 0.3 })

            CommonSetup.attachSpinner({ elem: loader });

            clearTimeout(timeout);

            timeout = setTimeout(() => {

                CommonSetup.search(value, loader)
            }, 500);
        });
    }

    static async search(str = '', loader = '') {
        const initCourses = new Items({ table: 'courses', name: `%${str}%`, code: `%${str}%`, like: null, or: null })
        const courses = await initCourses.find();

        const initSlides = new Items({ table: 'resources', name: `%${str}%`, module: `%${str}%`, like: null, or: null })
        const unfilteredSlides = await initSlides.find();
        const slides = unfilteredSlides.filter(item => item.type !== 'past question');

        const initPQs = new Items({ table: 'resources', name: `%${str}%`, year: `%${str}%`, like: null, or: null })
        const unfilteredPqs = await initPQs.find();
        const pqs = unfilteredPqs.filter(item => item.type !== 'slide');

        const initResourceCourses = new Items({ custom: 'SELECT code, id FROM courses' })
        const resourceCourses = await initResourceCourses.find();

        const data = {
            parent: select('#overlay #search-box'),
            all: slides.length + pqs.length + courses.length,
            courses: courses.length,
            slides: slides.length,
            pqs: pqs.length,
        }

        const all = courses.concat(slides, pqs);

        // Randomize the order (using Fisher-Yates shuffle algorithm)
        for (let i = all.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [all[i], all[j]] = [all[j], all[i]];
        }

        const allSearch = {
            parent: select('#overlay #search-box section'),
            data: all,
            type: true,
            code: true,
            updated: false
        }

        CommonSetup.addItems(data, { allSearch }, resourceCourses);
        CommonSetup.initializeTriggers();

        const names = selectAll('#overlay #search-box section table tr td:nth-child(3) p')

        if (str.length) {
            names.forEach(elem => {
                var text = elem.innerText.toLowerCase().split(str);
                text = text.join(`<span>${str}</span>`);

                elem.style.textTransform = 'none';
                elem.innerHTML = capitalize(text);
                selectAllWith(elem, 'span').forEach(e => e.classList.add('highlight'));
            })
        }

        if (loader instanceof HTMLElement) CommonSetup.detachSpinner({ elem: loader, auto: true })
    }

    //Handle "call to action" for requests
    initializeRequestBtns() {
        selectAll("[data-request-cta] button").forEach(button => {
            button.addEventListener("click", CommonSetup.openRequestCTA);
        })

        select("[data-request-back]")?.addEventListener("click", CommonSetup.closeRequestCTA);
    }

    static getRequestInputs(open = '') {
        const hidden = select("#overlay .hidden#hidden");
        const inputs = selectWith(hidden, `#${open}`);
        const requestInputs = select("[data-request-inputs]");

        if (!inputs) return false;

        selectAll("[data-request-inputs] >*").forEach(e => e.remove());

        requestInputs.append(inputs.cloneNode(true));
        selectAll("[data-request-inputs] >*").forEach(elem => {
            elem.setAttribute("id", `${open}-clone`);
            elem.setAttribute("data-request-parent", "");
        })

        return true;
    }

    static openRequestCTA() {
        Methods.disableLinksAndBtns(true, select("[data-request-cta]"));

        const elem = this;
        const response = this.dataset?.response;

        if (!response) return new Alert({ message: 'Something went wrong, please try again', type: 'error' })

        select("form.request-cta").setAttribute('action', `${response}-request`)

        CommonSetup.attachSpinner({ elem });

        const cta = select(".request-cta-box");
        const open = elem?.dataset.open;

        if (!CommonSetup.getRequestInputs(open)) {
            new Alert({
                message: "Couldn't process the request, please try again",
                type: 'error'
            })
            Methods.disableLinksAndBtns(false, select("[data-request-cta]"))
            CommonSetup.detachSpinner({ elem });
            return;
        }

        const requestInputs = select("[data-request-inputs]");
        const toOpen = selectWith(requestInputs, `#${open}-clone`);

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
        const elem = (event instanceof Event) ? event.target : event;

        if (elem) CommonSetup.attachSpinner({ elem });

        const cta = select(".request-cta-box");
        const canOpen = selectAll("[data-request-inputs] >*");

        const tl = gsap.timeline();

        tl
            .to(cta.children, { opacity: 0 })
            .to(cta, { height: 0, ease: 'expo.out' }, '-=0.31')
            .call(() => {
                canOpen.forEach(e => e.remove())
                Methods.disableLinksAndBtns(false, select("[data-request-cta]"))
            })

        select(".request-btns [data-selected]")?.removeAttribute("data-selected");
        select(".request-btns [data-denied]")?.removeAttribute("data-denied");
        if (elem) CommonSetup.detachSpinner({ elem });
    }

    static async cleanUpRequest(id = null) {
        CommonSetup.closeRequestCTA();

        if (!id) {
            new Alert({ message: "Missing identifier for complete clean up, please reload the page", type: 'error' });
            return;
        }

        try {
            const img = select(`main.main-content .section-table [data-trigger="request"][data-identifier="${id}"] img`);
            const initRequests = new Items({ table: 'requests', id });
            const [request] = await initRequests.find();
            const { status } = request;

            var handled_by = null;

            img.src = `/images/icons/${(status == 'pending') ? 'arrow right' : status}.png`;

            if (request.handled_by) {
                const initUsers = new Items({ table: 'users', id: request.handled_by });
                const [user] = await initUsers.find();

                handled_by = `Request handled by ${Methods.capitalize(user.name)}`;

                const data = {
                    parent: select("#overlay #request"),
                    handled_by
                }

                CommonSetup.addItems(data);

                select(".request-box")?.classList.add("handled");
            } else {
                select(".request-box")?.classList.remove("handled");
            }
        } catch (error) {
            console.error('Error in cleanUpRequest:', error);
            new Alert({ message: "There was a problem during cleanup, please reload the page", type: 'error' });
        }
    }

    //Attach spinner to elements
    static attachSpinner(params = {}) {
        const { elem, color } = params;

        if (!(elem instanceof HTMLElement)) return console.warn('No element specified to "attachSpinner"');

        const spinner = selectWith(elem, ".spinner");

        if (spinner) return;

        const width = elem.clientWidth;
        const height = elem.clientHeight;

        elem.style.width = `${width}px`;
        elem.style.height = `${height}px`;

        if (elem.children.length) elem.classList.add("none")
        else {
            elem.setAttribute('data-inner-text', elem.innerText)
            elem.innerText = '';
        }

        Methods.insertToDOM({
            type: 'div',
            parent: elem,
            append: Methods.insertToDOM({
                type: 'span',
                attributes: 'spinner',
                properties: { border: `3px solid ${color || 'white'}` },
            }),
            classes: 'spinner'
        })
    }

    static detachSpinner(params = {}) {
        const { elem, auto } = params;

        if (!(elem instanceof HTMLElement)) return console.warn('No element specified to "detachSpinner"');

        setTimeout(() => {
            const spinner = selectWith(elem, ".spinner");

            if (!spinner) return;

            spinner.remove();

            if (!auto) {
                elem.style.width = 'auto';
                elem.style.height = 'auto';
            }

            if (elem.children.length) elem.classList.remove("none")
            else {
                elem.innerText = elem.dataset?.innerText;
                elem.removeAttribute("data-inner-text");
            }
        }, 300);
    }

    //Handle form submissions
    initializeForms() {
        selectAll("form").forEach(form => form.addEventListener("submit", CommonSetup.handleFormSubmission))
    }

    static async handleFormSubmission(event) {
        event.preventDefault();

        const form = event.target;
        if (!(form instanceof HTMLElement)) return new Alert({ message: "Couldn't find form data for submission", type: 'warning' });

        var button = selectWith(form, 'button[type="submit"]');
        if (!button) button = select(`button[type="submit"][form=${form.getAttribute("id")}]`);

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

                        if (data?.clean_up) {
                            if (data.clean_up == 'request') await CommonSetup.cleanUpRequest(data.request_id);
                            if (data.clean_up == 'create-collection' || data.clean_up == 'delete') Methods.trackClick(document.body);
                            if (data.clean_up == 'add-resource') new Updater({ id: data.lecturer_id, type: 'resource' });
                            if (data.clean_up == 'add-user') new Updater({ type: 'user' });
                            if (data.clean_up == 'delete-user') {
                                Methods.trackClick(document.body);
                                new Updater({ type: 'user' });
                            }
                        }

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
            CommonSetup.detachSpinner({ elem: button });
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
            return console.warn("Both a file and its input are required to 'uploadFile'");
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

            if (!(parent instanceof HTMLElement)) return console.warn('A parent is required to "displayPreview"');

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
        if (progressBar) progressBar.style.width = 0;

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

        if (!this?.type && !this?.message) return console.warn("Both type and message are required for 'Alert'");

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

function test(elem) {
    const value = elem.value;
    const parent = elem.closest("[data-request-parent]");
    const toChange = selectWith(parent, `[data-request="${value}"]`);

    selectAllWith(parent, ".form-group").forEach(e => e.classList.remove("active"))
    selectAllWith(parent, ".form-group:not([data-request-select]) select, .form-group[data-request-triggerable] select").forEach(e => e.disabled = true)

    if (toChange) {
        toChange.classList.add("active");
        selectWith(toChange, 'select').disabled = false;
    }
}

// CommonSetup.handleCourseTrigger(5)