import TextItem from 'explorviz-frontend/utils/menus/items/text-item';
import { module, test } from 'qunit';

module('Unit | Utility | menus/items/text-item', function(/* hooks */) {

  test('it exists', function(assert) {
    let result = new TextItem('text', 'id', '#ffffff', {x: 0, y: 0}, 10);
    assert.ok(result);
  });
});
