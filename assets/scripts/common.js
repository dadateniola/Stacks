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

  }
}
