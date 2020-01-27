import Controller from '@ember/controller';
import { action } from '@ember/object';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import VisualizationController from 'explorviz-frontend/controllers/visualization';
import BaseRoute from './base-route';

/**
 * TODO
 *
 * @class Visualization-Route
 * @extends Ember.Route
 */
export default class VisualizationRoute extends BaseRoute.extend(AuthenticatedRouteMixin) {
  // @Override
  setupController(controller: Controller, model: any) {
    // Call _super for default behavior
    super.setupController(controller, model);

    (controller as VisualizationController).initRendering();
  }

  // @Override BaseRoute
  @action
  resetRoute() {
    this.controller.send('resetView');
    (this.controller as VisualizationController).landscapeRepo.set('latestApplication', null);
  }

  // @Override
  @action
  didTransition() {
    (this.controller as VisualizationController).hideVersionbar();
    (this.controller as VisualizationController).showTimeline();
  }
}
