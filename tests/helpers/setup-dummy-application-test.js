import Application from '../../../dummy/app';
import {
  setupContext,
  setupApplicationContext,
  teardownContext,
  teardownApplicationContext,
  setApplication
} from '@ember/test-helpers';

function setupDummyApplicationTest(hooks){

  hooks.beforeEach(async function(){
    this.owner = Application.create({ autoboot: false });

    //counters = { enter: 0, exit: 0, page: 0, click: 0 };
    //this.owner.register('service:mock-metrics', MockMetrics);
    //this.owner.inject('router', 'metrics', 'service:mock-metrics');
    //this.owner.inject('controller', 'metrics', 'service:mock-metrics');
    //this.owner.inject('component:my-component', 'metrics', 'service:mock-metrics');

    await setApplication(this.owner);
    await setupContext(this);
    await setupApplicationContext(this);
  });

  hooks.afterEach(async function() {
    await teardownApplicationContext(this);
    await teardownContext(this);
  });

}

export {setupDummyApplicationTest};
