import { action } from '@ember/object';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

export default class Navbar extends Component {
  @tracked
  navbarActive = true;

  @action
  toggleNavbar(this: Navbar) {
    this.navbarActive = !this.navbarActive;
  }
}
