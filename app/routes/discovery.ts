// eslint-disable-next-line import/no-extraneous-dependencies
import { on } from '@ember-decorators/object';
import { action, set } from '@ember/object';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import DiscoveryController from 'explorviz-frontend/controllers/discovery';
import BaseRoute from 'explorviz-frontend/routes/base-route';


export default class DiscoveryRoute extends BaseRoute.extend(AuthenticatedRouteMixin) {
  @action
  resetRoute() {
    this.cleanupController();
  }

  // @Override Ember-Hook
  resetController(_controller: DiscoveryController, isExiting: boolean, transition: any) {
    if (isExiting && transition.targetName !== 'error') {
      this.cleanupController();
    }
  }

  cleanupController() {
    set(this.controller as DiscoveryController, 'procezzForDetailView', null);
    set(this.controller as DiscoveryController, 'agentForDetailView', null);

    // stop first, there might be an old service instance running
    // this.get("agentReload").stopUpdate();
    // this.get("agentReload").startUpdate();
  }

  @on('activate')
  setupProcessView() {
    (this.controllerFor('discovery') as DiscoveryController).setup();
  }
}
