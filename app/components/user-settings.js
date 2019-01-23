import Component from '@ember/component';
import { typeOf } from '@ember/utils';
import { inject as service } from "@ember/service";

import AlertifyHandler from 'explorviz-frontend/mixins/alertify-handler';

export default Component.extend(AlertifyHandler, {
  // No Ember generated container
  tagName: '',

  store: service(),
  session: service(),

  settings: null,
  // set through hb template, else is set to logged-in user
  user: null,

  didInsertElement() {
    this.initializeSettingsArray();
  },

  initializeSettingsArray() {
    let user = this.get('user');
    if(!user) {
      this.set('user', this.get('session.session.content.authenticated.user'));
      user = this.get('user');
    }

    const usersettings = user.settings;
    this.set('settings', []);
    Object.entries(usersettings.booleanAttributes).forEach(
      ([key, value]) => {
        const type = typeOf(value);
        this.get('settings').push({key, value, type});
      }
    );
    Object.entries(usersettings.numericAttributes).forEach(
      ([key, value]) => {
        const type = typeOf(value);
        this.get('settings').push({key, value, type});
        this.set(`${key}_${this.get('user').id}`, value);
      }
    );
    Object.entries(usersettings.stringAttributes).forEach(
      ([key, value]) => {
        const type = typeOf(value);
        this.get('settings').push({key, value, type});
        this.set(`${key}_${this.get('user').id}`, value);
      }
    );
  },

  actions: {
    // saves the changes made to the actual model and backend
    saveSettings() {
      this.get('settings').forEach(setting => {

        if(setting.type === 'number') {
          // get new setting value
          const settingProperty = this.get(`${setting.key}_${this.get('user').id}`);
          const newVal = Number(settingProperty);

          // newVal might be NaN
          if(newVal) {
            this.set(`user.settings.numericAttributes.${setting.key}`, newVal);
          }
        } else if(setting.type === 'string') {
          // get new setting value
          const settingProperty = this.get(`${setting.key}_${this.get('user').id}`);

          this.set(`user.settings.stringAttributes.${setting.key}`, settingProperty);
        } else if(setting.type === 'boolean') {
          this.set(`user.settings.booleanAttributes.${setting.key}`, setting.value);
        }
      });

      this.get('user').save().then(() => {
        this.showAlertifyMessage('Settings saved.');
      }, reason => {
        const {title, detail} = reason.errors[0];
        this.showAlertifyMessage(`<b>${title}:</b> ${detail}`);
        // reload model rollback the properties
        this.get('user').reload();
      });
    }
  },

  willDestroyElement() {
    this.set('user', null);
    this.set('settings', null);
  }

});
