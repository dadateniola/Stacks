class PageSetup {
    constructor(params = {}) {
        Object.assign(this, params);
        this.init();
    }

    static forms = {
        login: {
            html: `
            <div class="form-head flex-col">
                <h1>Welcome back</h1>
                <p>Enter your ID and password to access your account.</p>
            </div>
            <form class="form-inputs flex-col" action="/login">
                <div class="form-group">
                    <label for="id">identification number</label>
                    <input type="text" name="id" id="id" placeholder="Enter your identification number">
                </div>
                <div class="form-group">
                    <label for="password">password</label>
                    <input type="password" name="password" id="password" placeholder="Enter your password">
                    <div class="extra">
                        <div class="rem">
                            <input type="checkbox" name="rem" id="rem">
                            <label for="rem">remember me</label>
                        </div>
                        <a href="">forgot password</a>
                    </div>
                </div>
                <div class="form-group">
                    <button type="submit">login</button>
                </div>
            </form>
            `,
            cta: "<button class='null'>Don't have an account?. <span>request library access</span></button>",
        },

        createAcc: {
            html: `
            <div class="form-head flex-col">
                <h1>Request Access</h1>
                <p>Fill your credentials in order to have an account with us.</p>
            </div>
            <form class="form-inputs flex-col" action="/request-access">
                <div class="form-row">
                    <div class="form-group">
                        <label for="id">ID</label>
                        <input type="text" name="id" id="id" placeholder="Enter your ID">
                    </div>
                    <div class="form-group">
                        <label for="name">full name</label>
                        <input type="text" name="name" id="name" placeholder="Enter your full name">
                    </div>
                </div>
                <div class="form-group">
                    <label for="email">email</label>
                    <input type="text" name="email" id="email" placeholder="Enter your email">
                </div>
                <div class="form-group">
                    <label for="message">message</label>
                    <textarea name="message" id="message" cols="30" rows="3" placeholder="Enter your reasons here..."></textarea>
                </div>
                <div class="form-group">
                    <button type="submit">request library access</button>
                </div>
            </form>
            `,
            cta: "<button class='null'>Already have an account?. <span>Login</span></button>",
        }
    }

    init() {
        PageSetup.assignChange();
    }

    static assignChange() {
        select(".form-cta button").addEventListener("click", PageSetup.animate);
    }

    static animate() {
        Methods.disableLinksAndBtns(true);

        const formCont = select(".form-cont");

        const formCTA = selectWith(formCont, ".form-cta");

        var form = selectWith(formCont, ".form");
        var formElements = selectAllWith(form, ".form-head h1, .form-head p, .form-group");

        const formType = formCont?.dataset?.type || 'createAcc';
        const nextForm = PageSetup.forms[formType];

        const tl = gsap.timeline();

        tl
            .to(formElements, { y: -60, opacity: 0, stagger: 0.1, ease: "Expo.easeIn" })
            .to(formCTA, { opacity: 0 }, "<")

            .call(() => {
                const innerTl = gsap.timeline();

                form.remove();
                Methods.insertToDOM({
                    type: "div",
                    text: nextForm.html,
                    parent: formCont,
                    before: formCTA,
                    classes: ["form", "flex-col"],
                    properties: { opacity: 0 }
                })

                formCTA.innerHTML = nextForm.cta;

                form = selectWith(formCont, ".form");
                formElements = selectAllWith(form, ".form-head h1, .form-head p, .form-group");

                formCont.dataset.type = (formType == "login") ? "createAcc" : "login";

                innerTl
                    .set(formElements, { y: 60, opacity: 0 })
                    .set(form, { opacity: 1 })

                    .to(formElements, { y: 0, opacity: 1, stagger: 0.1, ease: "Expo.easeOut" })
                    .to(formCTA, { opacity: 1 }, "<")

                    .call(() => {
                        PageSetup.assignChange();
                        select("form").addEventListener("submit", CommonSetup.handleFormSubmission)
                        Methods.disableLinksAndBtns(false);
                    })
            })
    }
}

new PageSetup();