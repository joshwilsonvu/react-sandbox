const url = require('url');
const path = require('path');
const async = require('async');
const isHtml = require('is-html');
const puppeteer = require('puppeteer');
const chai = require('chai');
chai.use(require('chai-events'));
chai.config.includeStack = false;
const should = chai.should();

const BrowserSandbox = require('../dist/index');

describe('BrowserSandbox', function () {
  describe('basic', function () {
    let sandbox;

    beforeEach(function () {
      sandbox = new BrowserSandbox();
    });

    describe('constructor', function () {
      it('should set default property values', function () {
        sandbox.should.be.an('object').that.deep.own.includes({
          permissions: [],
          dependencies: [],
          exports: {}
        });
      });

      it('should have #build(), #start(), #stop() methods', function () {
        sandbox.start.should.be.a('function');
        sandbox.stop.should.be.a('function');
        sandbox.build.should.be.a('function');
      });
    });

    describe('#build()', function () {
      const script = `var a = 2; var b = 2; var c = a + b;`;
      const dependencies = ['https://code.jquery.com/jquery-3.3.1.slim.min.js', '/js/foo.js'];

      it('should be valid HTML', function () {
        let html = sandbox.build(script);
        html.should.be.a('string');
        isHtml(html).should.be.true;
      });

      it('should contain the passed script', function () {
        let html = sandbox.build(script);
        html.should.contain(script);
      });

      it('should include dependencies', function () {
        sandbox.dependencies = dependencies;
        let html = sandbox.build(script);
        dependencies.forEach(d => html.should.contain(d));
      });
    });
  });

  describe('with DOM', function () {
    // variables across tests
    let browser, page;

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
      await page.goto(url.pathToFileURL(path.join(__dirname, 'index.html')));
      await page.addScriptTag({content: 'sandbox = null;'});
      await page.evaluate(() => {
        window.sandbox = new BrowserSandbox();
      });
    });

    afterEach(async function () {
      await page.close();
      page = null;
    });

    after(async function () {
      await browser.close();
      browser = null;
    });

    describe('#start()', function () {
      it('should mount one iframe', async function () {
        await page.evaluate(function () {
          sandbox.start('');
        });
        let iframes = await page.$$('iframe');
        iframes.should.have.length(1);
      });

      it('should execute passed code');

      it('should have access to exports');

      it('should be able to call exported functions');

      it('should run exported functions in parent context');

      it('should not be able to read from window.parent', async function () {
        await page.evaluate(() => {
          var div = document.createElement("div");
          div.id = "sensitive";
          div.innerText = "sensitive data";
          document.body.appendChild(div);
        });
        let parent = await page.$eval("#sensitive", div => div && div.innerText);

        await page.evaluate(function () {
          sandbox.start(`window.parent.document.getElementById("sensitive")`);
        });
      });

      it('should not be able to redirect window.top', async function() {
        await page.evaluate(() => {

        })
      });

      it('should prevent breaking out of the script tag', async function () {
        await page.evaluate(function () {
          sandbox.start(`(function(){var a = 2; var b = 2; var c = a + b})()</script><div id="infiltrated"></div>`);
        });
        should.equal(await page.$('#infiltrated'), null);
      });

      it('should not be able to show a modal without permission', function() {
        this.slow(500);
        let p = page.should.not.emit('dialog', { timeout: 400 });
        page.evaluate(function () {
          sandbox.start(`alert("foo")`);
        });
        return p;
      });

      it('should be able to show a modal with permission', async function () {
        let p = page.should.emit('dialog');
        await page.evaluate(function () {
          sandbox.permissions.push('allow-modals');
          sandbox.start(`alert("foo")`);
        });
        return p;
      });

      it('should clean up when restarting', async function() {
        await page.evaluate(function() {
          sandbox.start('console.log(1);');
          sandbox.start('console.log(2);');
        });
        let iframes = await page.$$("iframe");
        iframes.should.have.length(1);
      });
    });

    describe('#stop()', function () {
      it('should be a no-op before calling #start()');

      it('should revert the DOM to its state before calling #start()', async function() {
        const before = await page.evaluate(() => document.body.innerHTML);
        await page.evaluate(() => {
          sandbox.start('console.log(1)'); // adds iframe behind the scenes
          sandbox.stop(); // should remove iframe
        });
        const after = await page.evaluate(() => document.body.innerHTML);
        before.should.equal(after);
      });
    });

    describe('multiple instances', function () {
      it('should mount different iframes');

      it('should have unique ids');
    });
  });
});
