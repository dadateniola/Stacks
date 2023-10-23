class Setup {
    constructor(params = {}) {
        Object.assign(this, params);

        this.init();
    }

    init() {
        this.setupParameters();

        const type = (this?.type) ? this.type.toLowerCase() : null;

        const tl = gsap.timeline({ defaults: { duration: 0.6 } });

        tl.call(() => disableLinksAndBtns(true))

        //Checking conditions
        if (type == 'load') {
            const load = this.load();
            tl.add(load)
        }
        if (type == 'change') {
            const change = this.change();
            tl.add(change)
        }
        if (type == 'more') {
            const more = this.more();
            tl.add(more);
        }

        tl.call(() => disableLinksAndBtns())
    }

    setupParameters() {
        this.intro = select(".intro");
        this.whiteBox = select(".white-box");
        this.formBox = select(".form-box");
        this.formCont = selectAllWith(this.formBox, "h1, p, .form>*")
        this.introImg = select(".intro-img img");
        this.changeState = select("#change");
        this.showMore = select('#more');
        this.moreBtns = selectAll('.more-cont button')

        this.formStructure = {
            login: {
                html: ` <h1>student login</h1>
                        <p>Unlock a world of knowledge in our digital library</p>
                        <div class="form">
                            <input type="text" name="matric" id="matric" placeholder="matric no.">
                            <input type="text" name="password" id="password" placeholder="password">
                            <button>welcome back</button>
                        </div> `,
                btn: 'request library access'
            },

            access: {
                html: ` <h1>get library access</h1>
                        <p>Join our community of avid reader.</p>
                        <div class="form">
                            <input type="text" name="appid" id="appid" placeholder="application id.">
                            <input type="text" name="fullname" id="fullname" placeholder="fullname">
                            <input type="email" name="email" id="email" placeholder="student email">
                            <button>request access</button>
                        </div> `,
                btn: 'welcome back'
            }
        }
    }

    //Global functions
    static setMore = () => {
        const showMore = select('#more');

        showMore.dataset.status = 'collapsed'

        showMore.addEventListener('click', () => new Setup({ type: 'more' }))
    }

    static setChange = () => select("#change").addEventListener("click", () => new Setup({ type: 'change' }));

    static getBorderRadius = (condition) => {
        let depth = 0;
        const radius = getStyle(select(".white-box"), 'borderRadius').split("px ");

        if (condition) return radius.join("px ")

        radius.forEach(e => (parseInt(e) != 0) ? depth = e : null)
        radius.forEach((e, i) => (parseInt(e) != 0) ? radius[i] = '0px' : radius[i] = depth)
        return radius.join(" ");
    };

    //Animations
    load() {
        const tl = gsap.timeline();

        tl
            .to('.loader-box, .spinner-box', { opacity: 0, delay: 1 })
            .call(() => disableOverlays())
            .from(this.whiteBox, { width: '100%', borderRadius: 0, duration: 2, ease: 'Expo.easeInOut', clearProps: 'all' })
            .from(this.formCont, { opacity: 0, y: 200, stagger: 0.1, ease: 'Back.easeOut' })
            .from(this.introImg, { opacity: 0, yPercent: 100 }, "<")

        return tl;
    }

    change() {
        //Change conditions
        const formBoxType = this.formBox.dataset?.type;
        const introType = this.intro.classList.contains('next');
        const condition = (formBoxType == 'login' && introType == true) ? true : (formBoxType == 'access' && introType == false) ? true : null;

        const width = getStyle(this.whiteBox, 'width');
        const borderRadius = Setup.getBorderRadius(condition);

        const spinnerBox = select('.spinner-box')

        const tl = gsap.timeline();

        tl
            .call(() => disableOverlays(spinnerBox))
            .to(spinnerBox, { opacity: 1 })
            .to(this.formCont, { opacity: 0, y: -200, stagger: 0.1, ease: 'Back.easeIn' }, '<')
            .to(this.introImg, { opacity: 0, xPercent: (introType) ? 100 : -100 }, "<")
            .to(this.whiteBox, { width: '100%', borderRadius: 0, ease: 'Expo.easeIn', duration: 1 })

            .call(() => {
                if (introType) {
                    this.intro.classList.remove("next");
                    this.introImg.src = '/images/intro/login.png';
                    this.formBox.dataset.type = 'login';
                    this.formBox.style.opacity = 0;
                    this.formBox.innerHTML = this.formStructure.login.html
                    this.changeState.innerHTML = this.formStructure.login.btn
                } else {
                    this.intro.classList.add("next")
                    this.introImg.src = '/images/intro/access.png';
                    this.formBox.dataset.type = 'access';
                    this.formBox.style.opacity = 0;
                    this.formBox.innerHTML = this.formStructure.access.html
                    this.changeState.innerHTML = this.formStructure.access.btn
                }

                const timeline = gsap.timeline();
                this.formCont = selectAllWith(this.formBox, "h1, p, .form>*");

                timeline
                    .set(this.introImg, { xPercent: (introType) ? -100 : 100 })
                    .set(this.formCont, { opacity: 0, y: -200 })
                    .set(this.formBox, { opacity: 1 })

                    .to(this.whiteBox, { width, borderRadius, ease: 'Expo.easeOut', duration: 1, clearProps: 'all', delay: 0.5})
                    .to(this.formCont, { opacity: 1, y: 0, stagger: 0.1, ease: 'Back.easeOut' })
                    .to(this.introImg, { opacity: 1, xPercent: 0 })
                    .to(spinnerBox, { opacity: 0 })
            })

        return tl;
    }

    more() {
        const icon = selectWith(this.showMore, 'i');
        const status = this.showMore.dataset?.status;
        const tl = gsap.timeline();

        if (status == 'collapsed') {
            tl.set(this.moreBtns, { opacity: 0, y: 0, x: '120%' })
            tl.to(this.moreBtns, { opacity: 1, x: 0, stagger: 0.1, duration: 0.3, ease: 'Back.easeOut' })

            icon.classList.replace("fa-question", 'fa-xmark')
            this.showMore.dataset.status = 'expanded'
        } else {
            tl.to(this.moreBtns, { opacity: 0, y: -60, stagger: 0.15, duration: 0.8, ease: 'Expo.easeOut' })
            tl.set(this.moreBtns, { opacity: 0, y: 0, x: '120%' })

            icon.classList.replace("fa-xmark", 'fa-question')
            this.showMore.dataset.status = 'collapsed'
        }

        return tl;
    }
}


window.addEventListener("load", () => {
    //Hide overlays
    // selectAll('.page-overlay > *').forEach(e => e.classList.add('off'))

    Setup.setChange();
    Setup.setMore();
    new Setup({ type: 'load' })
})