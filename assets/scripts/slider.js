// Slider parameters {
//     slider: Element to hold the slider
//     motion: The level of counter movement between the slides children
//     gap: Space between the slides
//     delay: time before each animation starts
//     duration: time for each animation
// }

class Slider {
    constructor(params = {}) {
        Object.assign(this, params);
        this.init();
    }

    conditions() {
        if (!this?.gap) this.gap = 0;
        if (!this?.motion) this.motion = 30;
        if (!this?.delay) this.delay = 0.8;
        if (!this?.duration) this.duration = 4;

        if (!this?.slider) return false;

        this.amount = 0;
        this.toFixed = 3;

        if (this.slider instanceof HTMLElement) {
            this.slides = selectAllWith(this.slider, "*");
            this.amount = this.slides.length + 1;

            this.slider.dataset.type = "slider";

            if(!this.slides.length) return false;

            return true;
        } else return false;
    }

    init() {
        if (!this.conditions()) return console.log("Basic slider conditions not met");

        this.setupSlides();

        this.imagesLoaded = 0;
        this.images = selectAll(".slider img");
        this.images.forEach(image => {
            if (image.complete) {
                this.checkLoadedImages();
            } else {
                image.onload = () => this.checkLoadedImages();
            }
        })
    }

    //Slider methods
    setupSlides() {
        //Don't edit the code under this function
        this.fullWidth = 100 * this.amount;
        this.slideWidth = parseFloat((100 / this.amount).toFixed(this.toFixed));

        Slider.insertToDOM({
            type: "div",
            parent: this.slider,
            classes: 'slider',
            properties: { width: `calc(${this.fullWidth}% + ${this.gap * this.amount}px)` }
        });

        this.slides.forEach((elem, i) => {
            Slider.insertToDOM({
                type: "div",
                append: elem.cloneNode(true),
                parent: select(".slider"),
                classes: (i == 0) ? ['slide', 'active'] : 'slide',
                properties: { width: `calc(${this.slideWidth}% - ${this.gap}px)`, marginLeft: (i > 0) ? `${this.gap}px` : 0 }
            });

            elem.remove();
        })

        //Replicate the first slide after the last slide
        Slider.insertToDOM({
            type: "div",
            append: this.slides[0].cloneNode(true),
            parent: select(".slider"),
            classes: ['slide', 'end'],
            properties: { width: `calc(${this.slideWidth}% - ${this.gap}px)`, marginLeft: `${this.gap}px` }
        });
    }

    animate() {
        const tl = gsap.timeline({ defaults: { duration: this.duration, ease: "Expo.easeInOut" } });

        const activeSlide = select(".slide.active");
        const activeImg = selectWith(activeSlide, "*");
        const nextSlide = activeSlide?.nextElementSibling;
        const nextImg = selectWith(nextSlide, "*");

        const slider = select(".slider");
        const width = parseFloat(slider.dataset?.width) || this.slideWidth;

        tl
            .set(nextImg, { xPercent: -this.motion })
            .to(slider, { xPercent: -width, delay: this?.delay })
            .to(activeImg, { xPercent: this.motion, clearProps: "transform" }, "<")
            .to(nextImg, { xPercent: 0 }, "<")
            .call(() => {
                if (nextSlide.classList.contains("end")) {
                    gsap.set(slider, { xPercent: 0 });

                    slider.dataset.width = this.slideWidth;
                    activeSlide.classList?.remove("active");
                    selectAll(".slide")[0].classList.add("active");
                } else {
                    slider.dataset.width = (width + this.slideWidth).toFixed(this.toFixed);

                    activeSlide.classList?.remove("active");
                    nextSlide.classList?.add("active");
                }

                this.animate();
            });
    }

    checkLoadedImages() {
        this.imagesLoaded++;
        if (this.imagesLoaded === this.images.length) {
            console.log("All images loaded");

            gsap.to(".slider", {
                opacity: 1, delay: 1, onComplete: () => {
                    this.slider.classList.add("stop");
                    this.animate();
                }
            });
        }
    }

    //Static Methods
    static insertToDOM(params = {}) {
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

new Slider({ slider: select(".form-slider"), gap: 10 });