import DS from 'ember-data';
import BaseEntity from './baseentity';
import ClazzCommunication from './clazzcommunication';
import Trace from './trace';

const { attr, belongsTo } = DS;

/**
 * Ember model for a step in a trace.
 *
 * @class TraceStep-Model
 * @extends BaseEntity-Model
 *
 * @module explorviz
 * @submodule model.meta
 */
export default class TraceStep extends BaseEntity {
  @attr('number') tracePosition!: number;

  @attr('number') requests!: number;

  @attr('number') currentTraceDuration!: number;

  @attr('number') averageResponseTime!: number;

  @attr('boolean', { defaultValue: false }) highlighted!: boolean;

  @belongsTo('trace', { inverse: 'traceSteps' })
  parentTrace!: DS.PromiseObject<Trace> & Trace;

  @belongsTo('clazzcommunication', { inverse: null })
  clazzCommunication!: DS.PromiseObject<ClazzCommunication> & ClazzCommunication;
}

declare module 'ember-data/types/registries/model' {
  // tslint:disable-next-line: interface-name
  export default interface ModelRegistry {
    'tracestep': TraceStep;
  }
}
