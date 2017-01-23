import DS from 'ember-data';
import BaseEntity from './baseentity';

const { attr } = DS;

export default BaseEntity.extend({

  name: attr('string'),

  width: attr('number'),
  height: attr('number'),
  depth: attr('number'),
  positionX: attr('number'),
  positionY: attr('number'),
  positionZ: attr('number'),
  threeJSModel: attr(),

  kielerGraphReference: null,

  sourcePorts: {},
  targetPorts: {}

});
