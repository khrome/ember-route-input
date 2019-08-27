import EmberRouter from '@ember/routing/router';
import config from './config/environment';
import Route from '@ember/routing/route';

const Router = EmberRouter.extend({
  location: config.locationType,
  rootURL: config.rootURL
});
console.log('ROUTER RUN')
Route.addInputSource(document.body, 'keypress');

Router.map(function(){
  this.route('test-controller');
  this.route('test-input');
  this.route('user-input/index', {path:'/user-input/'});
});

export default Router;
