import { action } from '@ember/object';
import Route from '@ember/routing/route';
import ApplicationRouteMixin from 'ember-simple-auth/mixins/application-route-mixin';
import ApplicationController from 'explorviz-frontend/controllers/application';
import LandscapeTokenService from 'explorviz-frontend/services/landscape-token';
import { inject as service } from '@ember/service';

/**
 * TODO
 *
 * @class Application-Route
 * @extends Ember.Route
 */
export default class ApplicationRoute extends Route.extend(ApplicationRouteMixin) {
  routeAfterAuthentication = 'landscapes';

  @service('landscape-token')
  landscapeToken!: LandscapeTokenService;

  async beforeModel() {
    await (this.controllerFor('application') as ApplicationController).loadUserAndSettings.perform();
  }

  async sessionAuthenticated() {
    await (this.controllerFor('application') as ApplicationController).loadUserAndSettings.perform();

    super.sessionAuthenticated(...arguments);
  }

  @action
  logout() {
    this.session.invalidate({ message: 'Logout successful' });
  }
}
