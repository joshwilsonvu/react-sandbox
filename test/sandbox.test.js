const path = require('path');
const puppeteer = require('puppeteer');
const chai = require('chai');
const chaiEvents = require('chai-events');
const sinonChai = require('sinon-chai');
const StaticServer = require('static-server');

const server = new StaticServer({
  rootPath: path.join(__dirname, '..'),
  port: 8080,
});

chai.use(chaiEvents);
chai.use(sinonChai);
chai.config.includeStack = false;
const expect = chai.expect;

describe('BrowserSandbox', function () {
  // variables across tests
  let browser;
  let page;

  this.timeout(4000);
  this.slow(150);

  before(async function () {
    const opts = {
      headless: false
    };
    browser = await puppeteer.launch(opts);
    server.start();
  });

  beforeEach(async function () {
    page = await browser.newPage();
    //url.pathToFileURL(path.join(_dirname,index.html));
    await page.goto(`http://localhost:8080/test/index.html`);
    await page.evaluate(`() => {
      window.sandbox = new BrowserSandbox();
    }`);
  });

  afterEach(async function () {
    if (this.currentTest.state === 'passed') {
      await page.close();
    }
  });

  after(async function () {
    // initial about:blank page will exist even if all tests pass
    if ((await browser.pages()).length <= 1) {
      await browser.close();
    } else {
      await browser.disconnect();
    }
    server.stop();
  });

  describe('#build()', function () {
    const script = `var a = 2; var b = 2; var c = a + b;`;
    const dependencies = ['https://code.jquery.com/jquery-3.3.1.slim.min.js', '/js/foo.js'];

    it('should contain the passed script', async function () {
      let html = await page.evaluate(`() => sandbox.build('${script}')`);
      expect(html).to.be.a('string');
      expect(html).to.contain(script);
    });

    it('should include dependencies', async function () {
      let html = await page.evaluate(`() => {
          sandbox.dependencies = ${dependencies};
          return sandbox.build('${script}');
        }`);
      dependencies.forEach(d => expect(html).to.contain(d));
    });
  });

  describe('#start()', function () {
    it('should mount one iframe', async function () {
      await page.evaluate(`() => {
          return sandbox.start('');
        }`);
      let iframes = await page.$$('iframe');
      expect(iframes).to.have.length(1);
    });

    it('should execute passed code');

    it('should have access to exports');

    it('should be able to call exported functions');

    it('should run exported functions in parent context');

    it('should not be able to read from window.parent', async function () {
      let handle = await page.evaluate(`() => {
          var div = document.createElement("div");
          div.id = "sensitive";
          div.innerHTML = "sensitive data";
          document.body.appendChild(div);
          return '' + document.getElementById("sensitive").innerHTML;
        }`);
      console.log(handle);
      let parent = await page.evaluate(`div => div && div.innerHTML`, handle);

      let child = await page.evaluate(`() => {
          return sandbox.start('return window.parent.document.getElementById("sensitive")');
        }`);
      expect(child).not.to.equal(parent);
      expect(child).to.equal(null);
      await handle.dispose();
    });

    it('should not be able to redirect window.top', async function () {
      await page.evaluate(`() => {

        }`)
    });

    it('should prevent breaking out of the script tag', async function () {
      await page.evaluate(`() => {
          sandbox.start('(function(){var a = 2; var b = 2; var c = a + b})()</script><div id="infiltrated"></div>');
        }`);
      expect(await page.$('#infiltrated')).to.be.equal(null);
    });

    it('should not be able to show a modal without permission', function () {
      this.slow(500);
      //@ts-ignore
      let p = expect(page).not.to.emit('dialog', {timeout: 400});
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

    it('should clean up when restarting', async function () {
      await page.evaluate(`() => {
          sandbox.start('console.log(1);');
          sandbox.start('console.log(2);');
        }`);
      let iframes = await page.$$('iframe');
      expect(iframes).to.have.length(1);
    });
  });

  describe('#stop()', function () {
    it('should be a no-op before calling #start()');

    it('should revert the DOM to its state before calling #start()', async function () {
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
  });
});
