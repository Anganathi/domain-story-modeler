import {
  getNumbersAndIDs,
  revertChange
} from './util/DSActivityUtil';

/**
 * commandStack Handler for changes at activities
 */

export default function DomainStoryActivityHandler(injector, commandStack, eventBus, canvas) {

  commandStack.registerHandler('activity.directionChange', activity_directionChange);
  commandStack.registerHandler('activity.changed', activity_changed);

  // update the activity from the activity-dialog, either with or without number
  // and change other activites too, to keep the numbers consistent
  function activity_changed(modeling) {

    this.preExecute = function(context) {
      context.oldLabel = context.businessObject.name;

      if (context.oldLabel.length < 1) {
        context.oldLabel = ' ';
      }

      var oldNumbersWithIDs = getNumbersAndIDs(canvas);

      context.oldNumber = context.businessObject.number;
      context.oldNumbersWithIDs = oldNumbersWithIDs;
      modeling.updateLabel(context.businessObject, context.newLabel);
      modeling.updateNumber(context.businessObject, context.newNumber);
    };

    this.execute = function(context) {
      var semantic = context.businessObject;
      var element = context.element;

      if (context.newLabel && context.newLabel.length < 1) {
        context.newLabel = ' ';
      }

      semantic.name = context.newLabel;
      semantic.number = context.newNumber;

      eventBus.fire('element.changed', { element });
    };

    this.revert = function(context) {
      var semantic = context.businessObject;
      var element = context.element;
      semantic.name = context.oldLabel;
      semantic.number = context.oldNumber;

      revertChange(context.oldNumbersWithIDs, canvas, eventBus);

      eventBus.fire('element.changed', { element });
    };
  }

  // change the direction of a single activity without affecting other activities
  function activity_directionChange(modeling) {

    this.preExecute = function(context) {
      context.oldNumber = context.businessObject.number;
      context.oldWaypoints= context.element.waypoints;

      if (!context.oldNumber) {
        context.oldNumber=0;
      }
      modeling.updateNumber(context.businessObject, context.newNumber);
    };

    this.execute = function(context) {
      var semantic = context.businessObject;
      var element = context.element;
      var swapSource = element.source;
      var newWaypoints = [];
      var waypoints = element.waypoints;

      for (var i=waypoints.length-1; i>=0;i--) {
        newWaypoints.push(waypoints[i]);
      }

      element.source = element.target;
      semantic.source = semantic.target;
      element.target = swapSource;
      semantic.target = swapSource.id;

      semantic.number = context.newNumber;
      element.waypoints = newWaypoints;

      eventBus.fire('element.changed', { element });
    };

    this.revert = function(context) {
      var semantic = context.businessObject;
      var element = context.element;
      var swapSource = element.source;

      element.source = element.target;
      semantic.source = semantic.target;
      element.target = swapSource;
      semantic.target = swapSource.id;

      semantic.number = context.oldNumber;
      element.waypoints = context.oldWaypoints;

      eventBus.fire('element.changed', { element });
    };
  }
}

DomainStoryActivityHandler.$inject = [
  'injector',
  'commandStack',
  'eventBus',
  'canvas'
];