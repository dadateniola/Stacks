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

    static roles = {
        admin: {
            id: '20/1554',
        },
        student: {
            id: '12345678',
        },
        lecturer: {
            id: '123006',
        }
    }

    init() {
        select("[data-role-toggle]").addEventListener("click", PageSetup.toggleRoleChange);
        selectAll(".role-select-options button").forEach(button => button.addEventListener("click", PageSetup.changeRole));

        PageSetup.assignChange();
    }

    static toggleRoleChange(elem) {
        Methods.disableLinksAndBtns(true);

        const button = this instanceof HTMLElement ? this : elem;
        const img = selectWith(button, 'img');

        const roleSelect = select(".role-select");
        const isToggled = roleSelect.dataset?.toggled || false;

        const buttons = selectAll(".role-select-options button");

        const tl = gsap.timeline();

        if (isToggled) {
            tl
                .call(() => {
                    roleSelect.removeAttribute("data-toggled");
                    img.src = '/images/icons/users dark.png'
                })
                .to(buttons, { opacity: 0, xPercent: 0, y: -20, stagger: 0.1, ease: 'Expo.easeOut', clearProps: true })
                // .set(buttons, { dsiplay: 'none' })

                .call(() => Methods.disableLinksAndBtns(false))
        } else {
            tl
                .call(() => {
                    roleSelect.setAttribute("data-toggled", true);
                    img.src = '/images/icons/cancel.png'
                })
                .set(buttons, { opacity: 0, xPercent: -50, y: 0, display: 'block' })

                .to(buttons, { opacity: 1, xPercent: 0, stagger: -0.1, ease: 'Back.easeOut' })

                .call(() => Methods.disableLinksAndBtns(false))
        }
    }

    static changeRole() {
        const role = this.value;
        const data = PageSetup.roles[role];

        if (data) {
            const id_input = select("input[name='id']");
            const password_input = select("input[name='password']");

            if (id_input && password_input) {
                id_input.value = data.id;
                password_input.value = 'pass';
            }
        }

        PageSetup.toggleRoleChange(select('[data-role-toggle]'));
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
        const roleSelect = select('.role-select');

        const tl = gsap.timeline();

        tl
            .to(formElements, { y: -60, opacity: 0, stagger: 0.1, ease: "Expo.easeIn" })
            .to(formCTA, { opacity: 0 }, "<")
            .to(roleSelect, { x: formType == 'login' ? 0 : -80, ease: 'Back.easeInOut' }, '-=0.5')

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