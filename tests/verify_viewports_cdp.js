/**
 * Automated Viewport & Overflow Verification using Headless Chrome & Native CDP
 * Viewports: 320px, 375px, 390px, 430px, 768px, 1024px, 1440px
 */

const { spawn, execSync } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const VIEWPORTS = [320, 375, 390, 430, 768, 1024, 1440];

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
      });
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.msgId = 0;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const cb = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) cb.reject(msg.error);
          else cb.resolve(msg.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.msgId;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(JSON.stringify(res.exceptionDetails));
    }
    return res.result.value;
  }

  close() {
    this.ws.close();
  }
}

async function main() {
  console.log('====================================================');
  console.log('📱 DARWIN CITY HOSPITAL - COMPREHENSIVE VIEWPORT AUDIT');
  console.log('====================================================');

  const userDataDir = path.join(__dirname, 'chrome_test_profile');
  if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir, { recursive: true });

  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    'http://localhost:3000'
  ], { detached: true });

  console.log('⏳ Launched Headless Chrome with remote debugging on port 9222...');
  await sleep(3000);

  let tabs;
  for (let i = 0; i < 10; i++) {
    try {
      tabs = await getJson('http://localhost:9222/json');
      if (tabs && tabs.length > 0) break;
    } catch (e) {
      await sleep(500);
    }
  }

  if (!tabs || tabs.length === 0) {
    console.error('❌ Could not connect to Chrome debugging port.');
    process.exit(1);
  }

  const tab = tabs.find(t => t.type === 'page') || tabs[0];
  const client = new CDPClient(tab.webSocketDebuggerUrl);
  await client.connect();

  await client.send('Page.enable');
  await client.send('DOM.enable');

  let auditFailed = false;

  for (const width of VIEWPORTS) {
    const height = width >= 1024 ? 900 : 700;
    console.log(`\n--- Viewport: ${width}px × ${height}px ---`);

    await client.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 1024
    });
    await sleep(500);

    const metrics = await client.eval(`
      (() => {
        const docWidth = document.documentElement.scrollWidth;
        const winWidth = window.innerWidth;
        const overflow = docWidth > winWidth;
        
        // Find elements sticking out of the viewport
        const overflowingElements = [];
        document.querySelectorAll('*').forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.right > winWidth + 2 && !el.closest('.mobile-nav-drawer') && !el.closest('.modal-overlay')) {
            const id = el.id ? '#' + el.id : '';
            const cls = el.className && typeof el.className === 'string' ? '.' + el.className.split(' ').join('.') : '';
            overflowingElements.push({
              tag: el.tagName.toLowerCase() + id + cls,
              right: Math.round(rect.right),
              excess: Math.round(rect.right - winWidth)
            });
          }
        });

        const navVisible = window.getComputedStyle(document.querySelector('.main-nav')).display !== 'none';
        const hamburgerVisible = window.getComputedStyle(document.getElementById('mobileMenuBtn')).display !== 'none';
        const bookBtnVisible = window.getComputedStyle(document.getElementById('headerBookBtn')).display !== 'none';

        return {
          docWidth,
          winWidth,
          overflow,
          overflowingElements: overflowingElements.slice(0, 5),
          navVisible,
          hamburgerVisible,
          bookBtnVisible
        };
      })()
    `);

    if (metrics.overflow) {
      console.error(` ❌ Overflow detected at ${width}px: docWidth=${metrics.docWidth}px > winWidth=${metrics.winWidth}px`);
      console.error('    Overflowing elements:', metrics.overflowingElements);
      auditFailed = true;
    } else {
      console.log(` ✅ PASS: Zero horizontal overflow (docWidth=${metrics.docWidth}px <= winWidth=${metrics.winWidth}px)`);
    }

    if (width < 1024) {
      if (metrics.hamburgerVisible && !metrics.navVisible) {
        console.log(` ✅ PASS: Navigation converts to accessible hamburger menu (Desktop nav cleanly hidden)`);
      } else {
        console.error(` ❌ FAIL: Hamburger/nav visibility error at ${width}px`);
        auditFailed = true;
      }
    } else {
      if (metrics.navVisible && !metrics.hamburgerVisible) {
        console.log(` ✅ PASS: Desktop navigation bar visible, hamburger hidden`);
      } else {
        console.error(` ❌ FAIL: Desktop nav visibility error at ${width}px`);
        auditFailed = true;
      }
    }

    if (metrics.bookBtnVisible) {
      console.log(` ✅ PASS: Book Appointment button is always accessible`);
    } else {
      console.error(` ❌ FAIL: Book Appointment button hidden at ${width}px`);
      auditFailed = true;
    }

    // On mobile (< 1024), test mobile drawer interaction
    if (width <= 430) {
      const drawerTest = await client.eval(`
        (() => {
          App.openMobileDrawer();
          const isOpen = document.getElementById('mobileNavDrawer').classList.contains('open');
          const isBackdropOpen = document.getElementById('mobileNavBackdrop').classList.contains('open');
          App.closeMobileDrawer();
          const isClosed = !document.getElementById('mobileNavDrawer').classList.contains('open');
          return { isOpen, isBackdropOpen, isClosed };
        })()
      `);
      if (drawerTest.isOpen && drawerTest.isBackdropOpen && drawerTest.isClosed) {
        console.log(` ✅ PASS: Mobile drawer opens smoothly with dark backdrop and closes correctly`);
      } else {
        console.error(` ❌ FAIL: Mobile drawer open/close test failed`, drawerTest);
        auditFailed = true;
      }

      // Test Booking Wizard modal at this viewport
      const modalTest = await client.eval(`
        (() => {
          BookingWizard.open();
          const modalBox = document.querySelector('#bookingModal .modal-box');
          const boxRect = modalBox ? modalBox.getBoundingClientRect() : { right: 0, width: 0 };
          const stepper = document.querySelector('.booking-stepper');
          const fits = boxRect.right <= window.innerWidth + 2;
          BookingWizard.close();
          return { fits, boxWidth: Math.round(boxRect.width) };
        })()
      `);
      if (modalTest.fits) {
        console.log(` ✅ PASS: 7-Step Booking Wizard modal fits screen perfectly (Box: ${modalTest.boxWidth}px <= ${width}px)`);
      } else {
        console.error(` ❌ FAIL: Booking Wizard modal overflows viewport at ${width}px`, modalTest);
        auditFailed = true;
      }
    }
  }

  client.close();
  try {
    process.kill(chromeProc.pid);
  } catch (e) {}

  console.log('\n====================================================');
  if (!auditFailed) {
    console.log('🎉 ALL 7 VIEWPORTS (320px, 375px, 390px, 430px, 768px, 1024px, 1440px) PASSED AUDIT WITH 100% SUCCESS!');
  } else {
    console.log('❌ SOME VIEWPORT AUDIT CHECKS FAILED');
    process.exit(1);
  }
  console.log('====================================================');
}

main().catch(e => {
  console.error('Fatal audit error:', e);
  process.exit(1);
});
