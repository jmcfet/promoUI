/**
 * This class enables applications to have states which they can switch to
 * at will. A state can be as simple as an in-line JavaScript
 * object, or an instance of another JavaScript class. Applications
 * become state-ful by calling the `setStates` method with a
 * hashmap of states.
 *
 * Each of these states would be initialised by calling
 * the `init` method of each state if it's available. Switching
 * between states is achieved by calling the `switchState` method which
 * will passivate the current state and activate the new one.
 *
 * The constructor should be called using the following
 * `$N.apps.core.StateMachine.call(object)` notation which
 * attaches the methods and properties to the passed in object.
 *
 * @class $N.apps.util.StateMachine
 * @requires $N.apps.core.Log
 * @constructor
 */

define('jsfw/apps/util/StateMachine',
	['jsfw/apps/core/Log'],
	function (Log) {
		window.$N = $N || {};
		$N.apps = $N.apps || {};
		$N.apps.util = $N.apps.util || {};

		$N.apps.util.StateMachine = function () {

			var log = new $N.apps.core.Log("util", "StateMachine");

			/**
			 * An associative array of objects containing functions
			 * including `init`, `activate` and `passivate`.
			 * @property {Object} states
			 */
			this.states = {};

			/**
			 * Holds the state prior to the current one.
			 * @property {Object} previousState
			 */
			this.previousState = null;

			/**
			 * The current state.
			 * @property {Object} currentState
			 */
			this.currentState = null;

			/**
			 * Appends the given states passed in as an associative array of objects
			 * to a property called `states`. If any of the states have an `init`
			 * method, then that method is called.
			 *
			 * @method setStates
			 * @param {Object} states the possible state(s) to associate with this state machine. Must not be null or undefined.
			 * @chainable
			 */
			this.setStates = function (states) {
				var i;

				log("setStates", "Enter");

				this.states = states;
				for (i in this.states) {
					if (this.states.hasOwnProperty(i)) {
						this.states[i].stateName = i;
						if (this.states[i].init) {
							log("setStates", "Initialising state " + i);
							this.states[i].init();
						}
					}
				}
				log("setStates", "Exit");
				return this;
			};

			/**
			 * Switches from the current state to the specified one. Updates the `currentState`
			 * and `previousState` properties, and expects a state as it exists in the `states`
			 * property to be passed in as `newState`.
			 * If `passivatingPrevious` is false, then the old state is not passivated
			 * before the switch of state happens. Data can be passed to the `newState`'s activate
			 * method via the `activationContext` parameter.
			 *
			 * @method switchState
			 * @param {Object} newState
			 * @param {Boolean} [passivatingPrevious=true] flag to indicate whether the current state's passivate method
			 * should be called. Defaults to true.
			 * @param {Object} [activationContext=null] object that can be used to pass data to the new state
			 */
			this.switchState = function (newState, passivatingPrevious, activationContext) {
				log("switchState", "to=" + (newState ? newState.stateName : "null") + " from=" + (this.currentState ? this.currentState.stateName : "null"));
				this.previousState = this.currentState;
				this.currentState = newState;

				if (passivatingPrevious !== false) {
					passivatingPrevious = true;
				}
				if (this.previousState && this.previousState.passivate && passivatingPrevious) {
					this.previousState.passivate();
				}
				if (this.currentState && this.currentState.activate) {
					this.currentState.activate(activationContext);
				}
			};
		};
		return $N.apps.util.StateMachine;
	}
);