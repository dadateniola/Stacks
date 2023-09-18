window.addEventListener("load", () => {
    const whiteBox = select(".white-box");
    const formCont = selectAll(".form-box h1, .form-box p, .form>*")
    const introImg = select(".intro-img img");
    const logo = select(".logo");

    // const tl = gsap.timeline();

    // tl
    //     .from(whiteBox, { width: '100%', delay: 1, borderRadius: 0, duration: 1.3, ease: 'Power1.easeOut' })
    //     .from(formCont, { opacity: 0, y: 200, stagger: 0.1, ease: 'Back.easeOut' })
    //     .from(introImg, { opacity: 0, yPercent: 100 }, "<")
})

const change = select("#change");

change.addEventListener("click", () => {
    disableLinksAndBtns(true);

    const whiteBox = select(".white-box");
    const formCont = selectAll(".form-box h1, .form-box p, .form>*")
    const introImg = select(".intro-img img");
    const logo = select(".logo");
    const tl = gsap.timeline({ defaults: { duration: 0.6 } });

    const width = getStyle(whiteBox, 'width');
    const borderRadius = () => {
        let depth = 0;
        const radius = getStyle(whiteBox, 'borderRadius').split("px ");
        radius.forEach(e => (e != 0) ? depth = e : null)
        radius.forEach((e, i) => (e != 0) ? radius[i] = '0px' : radius[i] = depth)
        return radius.join(" ");
    };

    tl
        .to(formCont, { opacity: 0, y: -200, stagger: 0.1, ease: 'Back.easeIn' })
        .to(introImg, { opacity: 0, yPercent: 100 }, "<")
        .to(whiteBox, { width: '100%', borderRadius: 0, ease: 'Power1.easeOut' })

        .call(() => {
            select(".intro").classList.add("next")
            introImg.src = '/images/intro/access.png';
        })
        .to(whiteBox, { width, borderRadius: borderRadius(), ease: 'Power1.easeOut', clearProps: 'all' })
        .to(formCont, { opacity: 1, y: 0, stagger: 0.1, ease: 'Back.easeOut' })
        .to(introImg, { opacity: 1, yPercent: 0 })
})