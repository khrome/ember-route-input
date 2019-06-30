import {
  module,
  test,
  //skip
} from 'ember-qunit';
import {
  visit,
  currentURL,
  triggerKeyEvent
} from '@ember/test-helpers';
import { setupDummyApplicationTest } from '../helpers/setup-dummy-application-test';
var newMonitor = function(){
  var modCallCounts = {};
  window.setRouteModMonitor(modCallCounts);
  return modCallCounts;
}

module('Acceptance | hooks registered', function(hooks) {
  setupDummyApplicationTest(hooks);

  test('it responds to hooks installed on an unused route', async function(assert){
    var modCallCounts = newMonitor();
    await visit('/test-controller');
    assert.equal(currentURL(), '/test-controller');
    assert.equal(modCallCounts.renderTemplate > 0, true);
  });

  test('it responds to keys installed on a used route', async function(assert){
    var modCallCounts = {};
    window.pushLeftSeen = 0;
    window.setRouteModMonitor(modCallCounts);
    await visit('/test-input');
    assert.equal(currentURL(), '/test-input');
    assert.equal(modCallCounts.renderTemplate > 0, true);
    await triggerKeyEvent('h2', 'keypress', 37); //left-arrow
    assert.equal(window.pushLeftSeen > 0, true);
  });

  test('it stops responding to keys after route change', async function(assert){
    var modCallCounts = newMonitor();
    window.pushLeftSeen = 0;
    await visit('/test-input');
    assert.equal(currentURL(), '/test-input');
    assert.equal(modCallCounts.renderTemplate > 0, true);
    await triggerKeyEvent('h2', 'keypress', 37); //left-arrow
    assert.equal(window.pushLeftSeen > 0, true);
    var lastPushCount = window.pushLeftSeen;
    await visit('/test-controller');
    assert.equal(currentURL(), '/test-controller');
    await triggerKeyEvent('h2', 'keypress', 37); //left-arrow
    assert.equal(window.pushLeftSeen, lastPushCount);
  });

});

module('Acceptance | interface', function(hooks) {
  setupDummyApplicationTest(hooks);

  test('user-input route exists', async function(assert) {
    await visit('/user-input');
    assert.equal(currentURL(), '/user-input');
  });

});
