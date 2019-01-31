//import {default as BrowserSandbox} from "../dist/index";
import * as url from 'url';
import * as path from 'path';
import * as puppeteer from 'puppeteer';
import * as chai from 'chai';
import chaiEvents from 'chai-events';
import * as sinonChai from 'sinon-chai';
import * as BSNamespace from "../src/index";
const BrowserSandbox = BSNamespace.default;

chai.use(chaiEvents);
chai.use(sinonChai);
chai.config.includeStack = false;
const expect = chai.expect;

describe('BrowserSandbox', function () {
  describe('node', function () {
    let sandbox: BSNamespace.default;

    beforeEach(function () {
      sandbox = new BrowserSandbox();
    });

    describe('constructor', function () {
      it('should set default property values', function () {
        expect(sandbox).to.be.an('object').that.deep.include({
          permissions: [],
          dependencies: [],
          exports: {}
        });
      });

      it('should have #build(), #start(), #stop() methods', () => {
        expect(sandbox.start).to.be.a('function');
        expect(sandbox.stop).to.be.a('function');
        expect(sandbox.build).to.be.a('function');
      });
    });

    describe('#build()', function () {
      const script = `var a = 2; var b = 2; var c = a + b;`;
      const dependencies = ['https://code.jquery.com/jquery-3.3.1.slim.min.js', '/js/foo.js'];

      it('should contain the passed script', () => {
        let html = sandbox.build(script);
        expect(html).to.contain(script);
      });

      it('should include dependencies', () => {
        sandbox.dependencies = dependencies;
        let html = sandbox.build(script);
        dependencies.forEach(d => expect(html).to.contain(d));
      });
    });
  });

  describe('with DOM', function () {
    // variables across tests
    let browser: puppeteer.Browser;
    let page: puppeteer.Page;

    this.timeout(4000);
    this.slow(150);

    before(async function () {
      const opts = {
        headless: true
      };
      browser = await puppeteer.launch(opts);
    });

    beforeEach(async function () {
      page = await browser.newPage();
      // go to index.html in this directory with file:// scheme instead of http://
      await page.goto(url.pathToFileURL(path.join(__dirname, 'index.html')).href);
      await page.addScriptTag({content: 'sandbox = null;'});
      await page.evaluate(`() => {
        window.sandbox = new BrowserSandbox();
      }`);
    });

    afterEach(async function () {
      await page.close();
    });

    after(async function () {
      await browser.close();
    });

    describe('#start()', function () {
      it('should mount one iframe', async function () {
        await page.evaluate(`() => {
          sandbox.start('');
        }`);
        let iframes = await page.$$('iframe');
        expect(iframes).to.have.length(1);
      });

      it('should execute passed code');

      it('should have access to exports');

      it('should be able to call exported functions');

      it('should run exported functions in parent context');

      it('should not be able to read from window.parent', async function () {
        await page.evaluate(`() => {
          var div = document.createElement("div");
          div.id = "sensitive";
          div.innerText = "sensitive data";
          document.body.appendChild(div);
        }`);
        let parent = await page.$eval("#sensitive", div => div && (div as HTMLDivElement).innerText);

        await page.evaluate(`() => {
          sandbox.start('window.parent.document.getElementById("sensitive")');
        }`);
      });

      it('should not be able to redirect window.top', async function() {
        await page.evaluate(`() => {

        }`)
      });

      it('should prevent breaking out of the script tag', async function () {
        await page.evaluate(`() => {
          sandbox.start('(function(){var a = 2; var b = 2; var c = a + b})()</script><div id="infiltrated"></div>');
        }`);
        expect(await page.$('#infiltrated')).to.be.equal(null);
      });

      it('should not be able to show a modal without permission', function() {
        this.slow(500);
        //@ts-ignore
        let p = expect(page).not.to.emit('dialog', { timeout: 400 });
        page.evaluate(`() => {
          sandbox.start('alert("foo")');
        }`);
        return p;
      });

      it('should be able to show a modal with permission', async function () {
        //@ts-ignore
        let p = expect(page).to.emit('dialog');
        await page.evaluate(`() => {
          sandbox.permissions.push('allow-modals');
          sandbox.start('alert("foo")');
        }`);
        return p;
      });

      it('should clean up when restarting', async function() {
        await page.evaluate(`() => {
          sandbox.start('console.log(1);');
          sandbox.start('console.log(2);');
        }`);
        let iframes = await page.$$("iframe");
        expect(iframes).to.have.length(1);
      });
    });

    describe('#stop()', function () {
      it('should be a no-op before calling #start()');

      it('should revert the DOM to its state before calling #start()', async function() {
        const before = await page.evaluate(`() => document.body.innerHTML`);
        await page.evaluate(`() => {
          sandbox.start('console.log(1)'); // adds iframe behind the scenes
          sandbox.stop(); // should remove iframe
        }`);
        const after = await page.evaluate(`() => document.body.innerHTML`);
        expect(before).to.equal(after);
      });
    });

    describe('multiple instances', function () {
      it('should mount different iframes');

      it('should have unique ids');
    });
  });
});
