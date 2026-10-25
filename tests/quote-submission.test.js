const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'quote.html'), 'utf8');
const start = html.indexOf('    function submitForm(e) {');
const end = html.indexOf('    // ============================================\n    // EVENT LISTENERS', start);
assert.ok(start !== -1 && end !== -1, 'quote submit handler exists');
const submitSource = html.slice(start, end);

function fixture(netlifyResult) {
    const calls = [];
    const alerts = [];
    const steps = [];
    const storage = new Map([['pappasQuoteDraft', 'saved customer draft']]);
    const submitBtn = { disabled: false, textContent: 'Submit Quote Request' };
    const fields = new Map([['submitBtn', submitBtn]]);
    let resets = 0;
    const context = {
        Promise,
        selectedPackage: null,
        validateStep3: () => true,
        capitalizeWords: value => value,
        goToStep: step => steps.push(step),
        document: {
            getElementById(id) {
                if (!fields.has(id)) fields.set(id, { value: '', checked: false, files: [] });
                return fields.get(id);
            },
            querySelectorAll: () => [],
            querySelector: selector => selector === '.progress-bar' ? { style: {} } : null
        },
        FormData: class extends Map {
            constructor() { super([['g-recaptcha-response', 'captcha-token']]); }
        },
        fetch(url, options) {
            calls.push({ url, options });
            return url === '/' ? netlifyResult() : Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        },
        localStorage: {
            getItem: key => storage.get(key),
            removeItem: key => storage.delete(key)
        },
        grecaptcha: {
            ready: callback => callback(),
            execute: () => Promise.resolve('v3-token'),
            reset: () => { resets++; }
        },
        window: {},
        alert: message => alerts.push(message),
        console: { log() {}, error() {}, warn() {} },
        AbortController,
        setTimeout: () => 1,
        clearTimeout() {}
    };
    vm.runInNewContext(submitSource, context, { filename: 'quote.html submitForm' });
    const submit = () => context.submitForm({ preventDefault() {} });
    const settle = async () => {
        for (let i = 0; i < 6; i++) await new Promise(resolve => setImmediate(resolve));
    };
    return { submit, settle, calls, alerts, steps, storage, submitBtn, get resets() { return resets; } };
}

test('CAPTCHA rejection redirect keeps the draft and allows a retry', async () => {
    const form = fixture(() => Promise.resolve({ ok: false, status: 302, type: 'basic', redirected: false }));
    form.submit();
    await form.settle();
    assert.deepEqual(form.steps, []);
    assert.equal(form.storage.get('pappasQuoteDraft'), 'saved customer draft');
    assert.equal(form.calls.length, 1);
    assert.equal(form.calls[0].options.redirect, 'manual');
    assert.equal(form.resets, 1);
    assert.equal(form.submitBtn.disabled, false);
    assert.match(form.alerts[0], /security check again/i);
});

test('a followed redirect with a 200 page still cannot clear the draft', async () => {
    const form = fixture(() => Promise.resolve({ ok: true, status: 200, type: 'basic', redirected: true }));
    form.submit();
    await form.settle();
    assert.deepEqual(form.steps, []);
    assert.equal(form.storage.get('pappasQuoteDraft'), 'saved customer draft');
    assert.equal(form.resets, 1);
});

test('network failure retains draft and re-enables submit', async () => {
    const form = fixture(() => Promise.reject(new Error('offline')));
    form.submit();
    await form.settle();
    assert.deepEqual(form.steps, []);
    assert.equal(form.storage.get('pappasQuoteDraft'), 'saved customer draft');
    assert.equal(form.submitBtn.disabled, false);
    assert.equal(form.resets, 1);
    assert.match(form.alerts[0], /problem submitting/i);
});

test('confirmed Netlify success clears draft and mirrors once', async () => {
    const form = fixture(() => Promise.resolve({ ok: true, status: 200, type: 'basic', redirected: false }));
    form.submit();
    await form.settle();
    assert.deepEqual(form.steps, [4]);
    assert.equal(form.storage.has('pappasQuoteDraft'), false);
    assert.equal(form.calls.length, 2);
    assert.equal(form.calls[0].url, '/');
    assert.equal(form.calls[1].url, 'https://app.pappaslandscaping.com/api/quotes');
    assert.equal(form.resets, 0);
});

test('duplicate submit events while in flight send only one request', async () => {
    let resolveNetlify;
    const form = fixture(() => new Promise(resolve => { resolveNetlify = resolve; }));
    form.submit();
    form.submit();
    await form.settle();
    assert.equal(form.calls.length, 1);
    resolveNetlify({ ok: true, status: 200, type: 'basic', redirected: false });
    await form.settle();
    assert.equal(form.calls.length, 2);
    assert.deepEqual(form.steps, [4]);
});
