import Component from '@ember/component';
import Plotly from 'plotly.js-dist';
import debugLogger from 'ember-debug-logger';
import Timestamp from 'explorviz-frontend/models/timestamp';
import { get, set } from '@ember/object';

export default class PlotlyTimeline extends Component.extend({
  // anything which *must* be merged to prototype here
}) {

  debug = debugLogger();

  initDone = false;

  slidingWindowLowerBoundInMinutes = 4;
  slidingWindowUpperBoundInMinutes = 4;

  oldPlotlySlidingWindow = {};
  userSlidingWindow = null;

  timestamps : Timestamp[] = [];

  defaultMarkerColor = "#1f77b4";

  // BEGIN Ember Div Events
  mouseEnter() {
    const plotlyDiv : any = document.getElementById("plotlyDiv");

    // if user hovers over plotly, save his 
    // sliding window, so that updating the 
    // plot won't modify his current viewport
    if(plotlyDiv && plotlyDiv.layout) {
      set(this, "userSlidingWindow", plotlyDiv.layout);
    }
  }

  mouseLeave() {
    set(this, "userSlidingWindow", null);
  }
  // END Ember Div Events


  // @Override
  didRender() {
    this._super(...arguments);

    if(this.initDone) {
      this.extendPlotlyTimelineChart(get(this, "timestamps"));
    } else {
      this.setupPlotlyTimelineChart(get(this, "timestamps"));
      if(get(this, "initDone")) {
        this.setupPlotlyListener();
      }      
    }
  };

  setupPlotlyListener() {
    const plotlyDiv : any = document.getElementById("plotlyDiv");
    const dragLayer : any = document.getElementsByClassName('nsewdrag')[0];

    if(plotlyDiv && plotlyDiv.layout) {

      const self : any = this;

      // singe click
      plotlyDiv.on('plotly_click', function(data : any){
        const clickedTimestamp = new Date(data.points[0].x);

        // https://plot.ly/javascript/reference/#scatter-marker

        const pn = data.points[0].pointNumber;
        const tn = data.points[0].curveNumber;

        const numberOfPoints = data.points[0].fullData.x.length;       

        const colors = Array(numberOfPoints).fill(get(self, "defaultMarkerColor"));
        colors[pn] = 'red';
       
        const sizes = Array(numberOfPoints).fill(8);
        sizes[pn] = 12;

        //const symbols = Array(numberOfPoints).fill("circle");
        //symbols[pn] = "circle-open";

        var update = {'marker':{color: colors, size: sizes}};
        Plotly.restyle('plotlyDiv', update, [tn]);

        // closure action
        self.clicked(clickedTimestamp.getTime());
      });

      // double click
      plotlyDiv.on('plotly_doubleclick', function() {
        const min = get(self, "oldPlotlySlidingWindow.min");
        const max = get(self, "oldPlotlySlidingWindow.max");
        const update = self.getPlotlySlidingWindowUpdateObject(min, max);
        Plotly.relayout('plotlyDiv', update);
      });

      // Show cursor when hovering data point
      if(dragLayer) {
        plotlyDiv.on('plotly_hover', function(){
          dragLayer.style.cursor = 'pointer';
        });
        
        plotlyDiv.on('plotly_unhover', function(){
          dragLayer.style.cursor = '';
        });
      }
    }    
  };

  // BEGIN Plot Logic

  setupPlotlyTimelineChart(timestamps : Timestamp[]) {

    if(!timestamps || timestamps.length == 0) {
      return;
    }

    const x : Date[] = [];
    const y : number[] = [];

    for(const timestamp of timestamps) {
      x.push(new Date(timestamp.get('timestamp')));
      y.push(timestamp.get('totalRequests'));
    }

    const latestTimestamp : any = timestamps.lastObject;
    const latestTimestampValue = new Date(get(latestTimestamp, 'timestamp'));

    const windowInterval = this.getSlidingWindowInterval(latestTimestampValue, get(this, "slidingWindowLowerBoundInMinutes"), get(this, "slidingWindowUpperBoundInMinutes"));

    const layout = this.getPlotlyLayoutObject(windowInterval.min, windowInterval.max);

    set(this, "oldPlotlySlidingWindow", windowInterval)

    Plotly.newPlot(
      'plotlyDiv',
      this.getPlotlyDataObject(x,y), 
      layout,
      this.getPlotlyOptionsObject()
    );

    this.initDone = true;

  };


  extendPlotlyTimelineChart(timestamps : Timestamp[]) {

    if(!timestamps || timestamps.length == 0) {
      return;
    }

    const x : Date[] = [];
    const y : number[] = [];

    for(const timestamp of timestamps) {
      x.push(new Date(get(timestamp, 'timestamp')));
      y.push(get(timestamp, 'totalRequests'));
    }    

    const latestTimestamp : any = timestamps.lastObject;
    const latestTimestampValue = new Date(get(latestTimestamp, 'timestamp'));

    const windowInterval = this.getSlidingWindowInterval(latestTimestampValue, get(this, "slidingWindowLowerBoundInMinutes"), get(this, "slidingWindowUpperBoundInMinutes"));    

    const layout = get(this, "userSlidingWindow") ? get(this, "userSlidingWindow") : this.getPlotlyLayoutObject(windowInterval.min, windowInterval.max);

    set(this, "oldPlotlySlidingWindow", windowInterval);

    Plotly.react(
      'plotlyDiv',
      this.getPlotlyDataObject(x,y),
      layout,
      this.getPlotlyOptionsObject()
    );
  };

  // END Plot Logic

  // BEGIN Helper functions

  getPlotlySlidingWindowUpdateObject(minTimestamp : number, maxTimestamp : number) : {xaxis : {type: 'date', range: number[], title: {}} } {
    return {
      xaxis: {
        type: 'date',
        range: [minTimestamp,maxTimestamp],
        title: {
          text: 'Time',
          font: {
            size: 16,
            color: '#7f7f7f'
          }
        }
      }        
    };
  };

  hoverText(x : Date[] ,y : number[]) {
    return x.map((xi, i) => `<b>Time</b>: ${xi}<br><b>Total Requests</b>: ${y[i]}<br>`);
  };

  getSlidingWindowInterval(t : Date, lowerBound : number, upperBound : number) : {"min" : number, "max" : number} {
    const minTimestamp = t.setMinutes(t.getMinutes() - lowerBound);
    const maxTimestamp = t.setMinutes(t.getMinutes() + upperBound);

    return {"min" : minTimestamp, "max": maxTimestamp};
  };

  getPlotlyLayoutObject(minRange:number, maxRange:number) : {} {
    return {
      dragmode: 'pan',
      hovermode: 'closest',
      hoverdistance: 10,
      yaxis: { 
        fixedrange: true,
        title: {
          text: 'Requests',
          font: {
            size: 16,
            color: '#7f7f7f'
          }
        }
      },
      xaxis: {
        type: 'date',
        range: [minRange,maxRange],
        title: {
          text: 'Time',
          font: {
            size: 16,
            color: '#7f7f7f'
          }
        }
      },
      margin: {
        b: 40,
        t: 20,
        pad: 4
      }
    };
  };

  getPlotlyDataObject(dates : Date[], requests : number[]) : [{}] {

    const colors = Array(dates.length).fill(get(this, "defaultMarkerColor"));

    return [
      {
        hoverinfo: 'text',
        type: 'scattergl',
        mode:'lines+markers',
        //fill: 'tozeroy',
        marker: {color: colors, size: 8},
        x: dates,
        y: requests, 
        hoverlabel: {
          align: "left"
        },
        text: this.hoverText(dates, requests) 
      }
    ];
  };

  getPlotlyOptionsObject() : {} {
    return {
      displayModeBar: false,
      scrollZoom: true,
      responsive: true,
      doubleClick: false
    };
  };

  getColorUpdateObjectForPointIndex(pointIndex : number) {
    const markerIndex = `marker.color[${pointIndex}]`;
    const update : any = {};
    update[markerIndex] = "red";

    return update;
  }

  getColorResetObject() {
    return { "marker.color" : "black" };
  }

  // END Helper functions

};
