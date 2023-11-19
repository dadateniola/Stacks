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
        if (type == 'skip') {
            tl.set(this.allLoaders, { opacity: 0 })
                .call(() => disableOverlays());
        }
        if (type == 'load') {
            const load = this.load();
            tl.add(load)
        }

        tl.call(() => disableLinksAndBtns())
    }

    setupParameters() {
        //Loaders
        this.loaderBox = select('.loader-box');
        this.spinnerBox = select('.spinner-box');

        this.allLoaders = selectAll('.spinner-box, .spinner-box');
    }

    //Animations
    load() {
        const tl = gsap.timeline();

        tl
            .to('.loader-box, .spinner-box', { opacity: 0, delay: 0.5 })
            .call(() => disableOverlays())

        return tl;
    }
}

window.onload = () => new Setup({ type: 'skip' });