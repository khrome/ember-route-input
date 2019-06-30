import EmberRouter from '@ember/routing/router';
import config from './config/environment';

const Router = EmberRouter.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function(){
  this.route('test-controller');
  this.route('test-input');
  this.route('user-input/index', {path:'/user-input/'});
});

export default Router;
