/* eslint-disable prefer-destructuring */
import { decorateButtons, decorateBlockHrs } from '../../utils/decorate.js';
import { loadStyle, getConfig, createTag } from '../../utils/utils.js';
import { addFooter } from '../card/cardUtils.js';
import { decorateLinkAnalytics } from '../../martech/attributes.js';
import { replaceKey } from '../../features/placeholders.js';
import '../../deps/commerce.js';
import '../../deps/commerce-web-components.js';

const { miloLibs, codeRoot } = getConfig();
const base = miloLibs || codeRoot;

loadStyle(`${base}/deps/commerce-web-components.css`);

const wordNumbers = ['one', 'two', 'three', 'four'];

const cardTypes = ['segment', 'special-offer', 'plans'];

const getPodType = (styles) => styles?.find((style) => cardTypes.includes(style));

const checkBoxLabel = (el, altCtaMetaData) => {
  const altCtaRegex = /href=".*"/;
  if (!altCtaRegex.test(altCtaMetaData[1]?.innerHTML)) return null;
  const cardFooterRow = el.querySelector('.consonant-CardFooter-row');
  const originalCtaButton = cardFooterRow.querySelector('.consonant-CardFooter-cell--right');
  const altCtaButtonData = altCtaMetaData[1];
  decorateButtons(altCtaButtonData);
  const altCtaButton = createTag('div', { class: [...originalCtaButton.classList, 'altCta'] }, altCtaButtonData.innerHTML);
  altCtaButton.classList.add('button--inactive');
  cardFooterRow.append(altCtaButton);
  altCtaMetaData[0].parentNode.remove();
  return altCtaButtonData;
};

const addInner = (el, altCta, cardType, merchCard) => {
  const innerElements = [...el.querySelectorAll('h1, h2, h3, h4, h5, h6, p, ul')];
  const styles = [...el.classList];
  const merch = styles.includes('merch-card');
  const pElement = merch && el.querySelector(':scope > div > div > p:last-of-type');
  const links = pElement ? pElement.querySelectorAll('a') : el.querySelectorAll('a');
  const inner = el.querySelector(':scope > div:not([class])');
  let titleNumber = 0;
  const body = createTag('div', { slot: 'body' });
  innerElements.forEach((element) => {
    if (element.tagName.match(/^H[1-6]$/)) {
      merchCard.append(createTag(element.tagName, { slot: `${titleNumber !== 0 ? `heading-${wordNumbers[titleNumber]}` : 'heading'}` }, element.textContent));
      titleNumber += 1;
    }
    if (element.tagName.match(/^P$/)) {
      body.append(element);
    }
    if (element.tagName.match(/^UL$/)) {
      const list = el.querySelector('ul');
      list.querySelectorAll('li');
      merchCard.append(list);
    }
    merchCard.append(body);
  });

  addFooter(links, inner, merchCard);
  merchCard.append(inner);
};

const returnRibbonStyle = (ribbonMetadata) => {
  const ribbonStyleRegex = /^#[0-9a-fA-F]+, #[0-9a-fA-F]+$/;
  if (!ribbonStyleRegex.test(ribbonMetadata[0]?.innerText)) return null;
  const style = ribbonMetadata[0].innerText;
  const ribbonWrapper = ribbonMetadata[0].parentNode;
  const value = ribbonMetadata[1].innerText;
  ribbonWrapper.remove();
  return { style, value };
};

const init = (el) => {
  const headings = el.querySelectorAll('h1, h2, h3, h4, h5, h6');
  decorateLinkAnalytics(el, headings);
  const images = el.querySelectorAll('picture');
  let image;
  const icons = [];
  const rows = el.querySelectorAll(':scope > *');
  const ribbonMetadata = rows[0].children?.length === 2 ? rows[0].children : null;
  const row = rows[ribbonMetadata === null ? 0 : 1];
  const altCta = rows[rows.length - 1].children?.length === 2
    ? rows[rows.length - 1].children : null;
  const allPElems = row.querySelectorAll('p');
  const ctas = allPElems[allPElems.length - 1];
  const styles = [...el.classList];
  const cardType = getPodType(styles);
  decorateBlockHrs(el);
  images.forEach((img) => {
    const imgNode = img.querySelector('img');
    const { width, height } = imgNode;
    const isSquare = Math.abs(width - height) <= 10;
    if (img) {
      if (isSquare) {
        icons.push(img);
      } else {
        image = img;
      }
    }
  });
  if (ctas) decorateButtons(ctas);
  const merchCard = createTag('merch-card', { class: el.className, variant: cardType });

  if (ribbonMetadata !== null) {
    const badge = returnRibbonStyle(ribbonMetadata);
    if (badge !== null) {
      merchCard.setAttribute('badge', JSON.stringify(badge));
    }
  }
  if (image !== undefined) {
    merchCard.setAttribute('image', image.querySelector('img').src);
    image?.parentElement.remove();
  }
  if (!icons || icons.length > 0) {
    merchCard.setAttribute('icons', JSON.stringify(Array.from(icons).map((icon) => icon.querySelector('img').src)));
    icons.forEach((icon) => icon.parentElement.remove());
  }
  if (styles.includes('secure')) {
    replaceKey('secure-transaction', getConfig())
      .then((key) => merchCard.setAttribute('secure-label', key));
  }
  if (altCta) {
    const checkboxLabel = checkBoxLabel(el, altCta);
    if (checkboxLabel !== null) merchCard.setAttribute('checkbox-label', checkboxLabel);
  }
  const footer = createTag('div', { slot: 'footer' });
  footer.appendChild(ctas);
  addInner(el, altCta, cardType, merchCard);
  merchCard.appendChild(footer);
  el.replaceWith(merchCard);
};

export default init;
