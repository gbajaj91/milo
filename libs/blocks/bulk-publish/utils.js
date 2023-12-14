import { getMiloUrl } from './services.js';

const FORM_MODES = ['full', 'half'];
const PROCESS_MAX = 1000;
const PREFS_KEY = 'bulk-pub-prefs';
const DEFAULT_PREFS = { height: 0, mode: FORM_MODES[0] };
const PROCESS_TYPES = [
  'preview',
  'publish',
  'unpublish',
  'delete',
  'index',
];

const wait = (delay = 5000) => new Promise((resolve) => {
  setTimeout(() => resolve(), delay);
});

const userPrefs = () => {
  const store = localStorage.getItem(PREFS_KEY);
  const prefs = store ? JSON.parse(store) : DEFAULT_PREFS;
  return {
    get: (key) => (prefs[key] ?? DEFAULT_PREFS[key]),
    set: (key, value) => {
      prefs[key] = value;
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    },
  };
};

const validMiloURL = (str) => {
  let url;
  try {
    url = new URL(str);
  } catch (_) {
    return false;
  }
  const [ref, repo, owner] = getMiloUrl(url);
  return url.protocol === 'https:' && ref && repo && owner;
};

const editEntry = (elem, str) => {
  if (elem?.value) {
    const { offsetTop, value, scrollHeight, clientHeight } = elem;
    const start = value.indexOf(str);
    const end = start + str.length;
    const position = offsetTop + (scrollHeight - clientHeight) * (start / value.length);
    elem.setSelectionRange(start, end);
    elem.focus();
    elem.scrollTop = position;
  }
};

const selectOverage = (elem, paths) => {
  if (elem?.value) {
    const { value } = elem;
    const overage = paths.length - PROCESS_MAX;
    const selectable = paths.slice(-[overage]);
    const start = value.indexOf(selectable[0]);
    const end = value.indexOf(selectable[selectable.length]);
    elem.setSelectionRange(start, end);
    elem.focus();
  }
};

const getJobErrorText = (errors, process) => {
  const [message] = errors.messages;
  let text = message;
  if (['unpublish', 'delete'].includes(process) && message === 'Forbidden') {
    text = `Failed to ${process} - has the SharePoint document been deleted?`;
  }
  return text;
};

const getErrorText = (code) => {
  const codes = [400, 401, 403, 404, 503];
  const errorText = [
    'Invalid URL',
    'Unauthorized',
    'Forbidden',
    'Not Found',
    'Timed Out',
  ];
  return errorText[codes.indexOf(code)];
};

const jobStatus = (status, state, count) => {
  let code = status;
  let text = 'Working';
  let color = text.toLowerCase();
  if (state === 'queued') {
    text = `${count}/3 Retry`;
    code = null;
  }
  if (state === 'stopped') {
    const success = status === 200 || status === 204;
    text = success ? 'Completed' : getErrorText(code);
    color = success ? 'success' : 'error';
  }
  return { code, text, color };
};

export {
  editEntry,
  FORM_MODES,
  getErrorText,
  getJobErrorText,
  PROCESS_MAX,
  PROCESS_TYPES,
  selectOverage,
  jobStatus,
  userPrefs,
  validMiloURL,
  wait,
};