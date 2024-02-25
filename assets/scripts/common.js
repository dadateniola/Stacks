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
    static disableLinksAndBtns = (condition = false) => {
        selectAll('a, button').forEach((element) => {
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
        // }

        const { type, text, append, parent, before, classes, properties, attributes } = params;

        if (!type || !parent) return null;

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
            if (Array.isArray(attributes)) attributes.forEach(a => element.setAttribute(`data-${a}`, ''));
            else element.setAttribute(`data-${attributes}`, '');
        }

        //Append element to parent
        if (before) parent.insertBefore(element, before);
        else parent.appendChild(element);

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
        })
    }

    static removeErrorMsgs(e) {
        const input = e instanceof Event ? e.target : e;
        const nextSibling = input.nextElementSibling;

        if (nextSibling && nextSibling.tagName === 'SPAN' && nextSibling.classList.contains('error')) nextSibling.remove();

        input.classList.remove('error');
        input.removeEventListener("focus", Methods.removeErrorMsgs);
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
        if(info) {
            const type = selectWith(info, "#type").innerHTML;
            const message = selectWith(info, "#message").innerHTML;
            
            info.remove();
            select(".alert-box").removeAttribute("data-disabled")

            new Alert({ type, message })
        }

        this.initializeTriggers()
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

    initializeTriggers() {
        selectAll('[data-trigger]').forEach(trigger => trigger.addEventListener(`${trigger?.dataset?.event || 'click'}`, CommonSetup.openTrigger));
        selectAll('[data-close]').forEach(trigger => trigger.addEventListener('click', CommonSetup.closeTrigger));
    }

    static openTrigger() {
        if (this.hasAttribute('data-animated')) return;
        const currentlyTriggered = select('#overlay [data-triggered]');

        const animate = select(`.${this.dataset?.affect}`) || this;
        const triggered = select(`#${this.dataset?.trigger}`);
        const children = (selectAllWith(triggered, 'section > *').length) ? selectAllWith(triggered, 'section > *') : triggered.children;
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
            })
            .set(children, { opacity: 0 })
            .set(triggered, { opacity: 0 })
            .to(triggered, { opacity: 1, delay: 0.3 })
            .to(children, { opacity: 1, stagger: 0.3 })
    }

    static closeTrigger() {
        const triggered = select('#overlay [data-triggered]');
        const trigger = select(`[data-trigger="${triggered.id}"][data-animated]`);
        const animate = select(`.${trigger.dataset?.affect}`) || trigger;

        const tl = gsap.timeline();

        tl
            .to(triggered, { opacity: 0 })
            .call(() => {
                animate.classList.remove('active');
                select("#overlay").classList.remove(
                    (trigger.dataset?.affect && trigger.dataset?.affect == "search") ? 'active-search' : 'active'
                );

                trigger.removeAttribute('data-animated', '');
                triggered.removeAttribute('data-triggered');
            }, null, '+=0.3')
    }
}

class Items {
    constructor(params = {}) {
        Object.assign(this, params);
        this.init();
    }

    async init() {
        // if (!this?.table || Object.keys(this).length < 2) return console.warn("Couldn't get items because conditions weren't met");

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

            const items = await response.json();

            console.log(items);
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