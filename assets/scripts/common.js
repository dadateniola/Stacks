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

        const { type, text, append, parent, before, classes, properties } = params;

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
            if (Slider.isObject(properties)) {
                for (const property in properties) {
                    element.style[property] = properties[property];
                }
            }
        }

        //Append element to parent
        if (before) parent.insertBefore(element, before);
        else parent.appendChild(element);

        return element;
    }

    static isObject(value) {
        return (typeof value === 'object' && value !== null && !Array.isArray(value));
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
    }

    static updateGrid() {
        selectAll(".section-grid").forEach(grid => {
            const threshold = 250 + 20;
            const width = grid.clientWidth;
            const columns = Math.floor(width / threshold);

            grid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
        });
    }

    static handleResize() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(CommonSetup.updateGrid, 500);
    }
}

new CommonSetup()

select('.search input').addEventListener("focus", function () {
    const input = this;
    const search = this.parentNode;
    const triggered = select(`.${search.dataset?.trigger}`);
    const children = selectAllWith(triggered, 'section > *');

    const tl = gsap.timeline();

    tl
        .call(() => {
            search.classList.add('active');
            select("#overlay").classList.add("active");

            triggered.setAttribute('data-triggered', '');
        })
        .set(triggered, { opacity: 1 })
        .set(children, { opacity: 0 })
        .to(children, { opacity: 1, stagger: 0.3, delay: 0.3 })


})

select('[data-close]').addEventListener("click", function () {
    const close = this;
    const toTrigger = select('#overlay [data-triggered]');
    const search = select(`[data-trigger="${toTrigger.id}"]`);

    const tl = gsap.timeline();

    tl
        .to(toTrigger, { opacity: 0 })
        .call(() => {
            search.classList.remove('active');
            select("#overlay").classList.remove("active");

            triggered.removeAttribute('data-triggered');
        })
})