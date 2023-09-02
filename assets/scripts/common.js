//Setup code common to all pages

//Parameters
const select = (e) => document.querySelector(e);
const selectAll = (e) => document.querySelectorAll(e);
const selectWith = (p, e) => p.querySelector(e);
const selectAllWith = (p, e) => p.querySelectorAll(e);
const create = (e) => document.createElement(e);
const root = (e) => getComputedStyle(select(":root")).getPropertyValue(e);

//Page Setup
class PageSetup {
  constructor(params = {}) {
    Object.assign(this, params);
  }
}
