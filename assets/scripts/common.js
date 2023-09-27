//Setup code common to all pages

//Parameters
const select = (e) => document.querySelector(e);
const selectAll = (e) => document.querySelectorAll(e);
const selectWith = (p, e) => p.querySelector(e);
const selectAllWith = (p, e) => p.querySelectorAll(e);
const create = (e) => document.createElement(e);
const root = (e) => getComputedStyle(select(":root")).getPropertyValue(e);
const getStyle = (e, style) => window.getComputedStyle(e)[style];


const preventDefault = (event) => event.preventDefault();

const disableLinksAndBtns = (condition = false) => {
  selectAll('a, button').forEach((element) => {
    if (condition) {
      element.setAttribute('disabled', 'true');

      if (element.tagName === 'A') {
        element.dataset.href = element.href;
        element.addEventListener('click', preventDefault);
      }
    } else {
      selectAll('a, button').forEach((element) => {
        element.removeAttribute('disabled');

        if (element.tagName === 'A') {
          element.setAttribute('href', element.dataset.href);
          element.removeEventListener('click', preventDefault);
        }
      });
    }
  });
}


//Page Setup
class PageSetup {
  constructor(params = {}) {
    Object.assign(this, params);

    this.init();
  }

  init() {
    this.setupParameters();

    // this.setLoader();
  }

  setupParameters() {
    this.loaderBox = select(".loader-box");
    this.loaderCont = select(".loader-cont");

    this.loaderStructure = ['stacks', 'a unique', 'innovative', 'minimalist', 'e-library', 'system']
  }


  //Ignore for now
  setLoader() {
    let length = 0;
    this.loaderStructure.forEach(e => (e.length > length) ? length = e.length : null)

    for (let i = 0; i < length; i++) {
      const div = create("div");

      div.classList.add('loader-column')

      this.loaderCont.append(div)
    }

    const loaderColumns = selectAll(".loader-column");

    this.loaderStructure.forEach(e => {
      const elemLength = e.length;
      const spaces = length - elemLength;
      const skip = Math.floor(spaces / 2);

      loaderColumns.forEach((col, index) => {
        const span = create('span');
        const current = ((index + 1) <= skip) ? " " : e[index - skip];
        const condition = current ? (current == ' ') ? false : true : false;

        span.innerHTML = condition ? current : '*';
        if (!condition) span.classList.add('hidden');

        col.append(span)
      })
    })

    const loaderSpan = select('.loader-cont span');
    this.loaderCont.style.height = getStyle(loaderSpan, 'lineHeight');

    this.loader();
  }

  //Animations
  loader() {
    const loaderColumns = [];
    const height = getStyle(select('.loader-cont span'), 'lineHeight');

    selectAll(".loader-column").forEach(e => loaderColumns.push(e));
    const shuffledColumns = gsap.utils.shuffle(loaderColumns)

    let position = '-' + height;

    const tl = gsap.timeline();

    tl
      .to(shuffledColumns, { y: position, stagger: 0.1, ease: 'Expo.easeOut', delay: 3 })
      .to(this.loaderCont, { height: (parseFloat(height) * 2) })
      .to(shuffledColumns, { y: '-' + (parseFloat(height) * 3), stagger: 0.1, ease: 'Expo.easeOut', delay: 1 })
      .to(this.loaderCont, { height: height }, '<')
      .to(shuffledColumns, { y: '-' + (parseFloat(height) * 4), stagger: 0.1, ease: 'Expo.easeOut', delay: 1 })
      .to(this.loaderCont, { height: (parseFloat(height) * 2) })
      .to(shuffledColumns, { y: 0, stagger: 0.2, ease: 'Expo.easeOut', delay: 1 })
      .to(this.loaderCont, { height: height, onComplete: () => this.loader() }, '<')
  }
}


new PageSetup();