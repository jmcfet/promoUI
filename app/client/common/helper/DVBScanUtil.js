/**
 * This class will contain logic to set the scanning parameters according to the tuner type (DVBC/DVBS)
 * @class $N.app.DVBScanUtil
 * @static
 * @requires $N.apps.core.Log
 * @requires $N.platform.system.Scan
 */
(function ($N) {
	"use strict";
	$N.app = $N.app || {};
	$N.app.DVBScanUtil = (function () {
		var log = new $N.apps.core.Log("Helper", "DVBScanUtil"),
			isDVBCTuner,
			DVBC_PROFILE_PATH =  '/network/siconfig/networkClasses/CableEITPFOnly/transponders/0/dvbc',
			scanTypeOptions = [{
				option: "auto"
			}, {
				option: "manual"
			}],
			polarisationValues = [{
				option: "horizontal",
				value: $N.platform.system.Scan.DVBS_Polarization.LINEAR_HORIZONTAL
			}, {
				option: "vertical",
				value: $N.platform.system.Scan.DVBS_Polarization.LINEAR_VERTICAL
			}],
			symbolRatesForDVBS = [{
				option: "symbolRate1",
				value: "1725"
			}, {
				option: "symbolRate2",
				value: "3450"
			}, {
				option: "symbolRate3",
				value: "6000"
			}, {
				option: "symbolRate4",
				value: "6875"
			}, {
				option: "symbolRate5",
				value: "6900"
			}, {
				option: "symbolRate6",
				value: "22000"
			}, {
				option: "symbolRate7",
				value: "27000"
			}, {
				option: "symbolRate8",
				value: "27500"
			}, {
				option: "symbolRate28888",
				value: "28888"
			}, {
				option: "symbolRate45000",
				value: "45000"
			}],
			symbolRatesForDVBC = [{
				option: "symbolRate1",
				value: "1725"
			}, {
				option: "symbolRate2",
				value: "3450"
			}, {
				option: "symbolRate3",
				value: "6000"
			}, {
				option: "symbolRate4",
				value: "6875"
			}, {
				option: "symbolRate5",
				value: "6900"
			}],
			fecInnerValuesForDVBS = [{
				option: "fecOption1",
				value: $N.platform.system.Scan.DVBS_InnerFEC._1_2
			}, {
				option: "fecOption2",
				value: $N.platform.system.Scan.DVBS_InnerFEC._2_3
			}, {
				option: "fecOption3",
				value: $N.platform.system.Scan.DVBS_InnerFEC._3_4
			}, {
				option: "fecOption4",
				value: $N.platform.system.Scan.DVBS_InnerFEC._5_6
			}, {
				option: "fecOption5",
				value: $N.platform.system.Scan.DVBS_InnerFEC._7_8
			}, {
				option: "fecOptionAuto",
				value: $N.platform.system.Scan.DVBS_InnerFEC.NONE
			}],
			fecInnerValuesForDVBC = [{
				option: "fecOption1",
				value: $N.platform.system.Scan.DVBS_InnerFEC._1_2
			}, {
				option: "fecOption2",
				value: $N.platform.system.Scan.DVBS_InnerFEC._2_3
			}, {
				option: "fecOption3",
				value: $N.platform.system.Scan.DVBS_InnerFEC._3_4
			}, {
				option: "fecOption4",
				value: $N.platform.system.Scan.DVBS_InnerFEC._5_6
			}, {
				option: "fecOption5",
				value: $N.platform.system.Scan.DVBS_InnerFEC._7_8
			}, {
				option: "fecOption6",
				value: $N.platform.system.Scan.DVBS_InnerFEC._8_9
			}, {
				option: "fecOption7",
				value: $N.platform.system.Scan.DVBS_InnerFEC._3_5
			}, {
				option: "fecOption8",
				value: $N.platform.system.Scan.DVBS_InnerFEC._4_5
			}, {
				option: "fecOption9",
				value: $N.platform.system.Scan.DVBS_InnerFEC._9_10
			}, {
				option: "fecOptionAuto",
				value: $N.platform.system.Scan.DVBS_InnerFEC.NONE
			}],
			fecOuterValuesForDVBC = [{
				option: "fecOuterOptionAuto",
				value: $N.platform.system.Scan.DVBC_OuterFEC.NONE
			}, {
				option: "fecOuterOptionReed",
				value: $N.platform.system.Scan.DVBC_OuterFEC.REED
			}],
			modulationValues = [{
				option: "modulationOption16",
				value: $N.platform.system.Scan.DVBC_Modulation.QAM16
			}, {
				option: "modulationOption32",
				value: $N.platform.system.Scan.DVBC_Modulation.QAM32
			}, {
				option: "modulationOption64",
				value: $N.platform.system.Scan.DVBC_Modulation.QAM64
			}, {
				option: "modulationOption128",
				value: $N.platform.system.Scan.DVBC_Modulation.QAM128
			}, {
				option: "modulationOption256",
				value: $N.platform.system.Scan.DVBC_Modulation.QAM256
			}],
			lnbPowerValues = [{
				option: "lnbPowerOn",
				value: true
			}, {
				option: "lnbPowerOff",
				value: false
			}];

		/* Public API */
		return {
			/**
			 * initialise the DVBScanUtil
			 * @method initialise
			 */
			initialise: function () {
				log("initialise", "Enter");
				//check the tuner type and set the flag
				switch ($N.app.Config.getConfigValue($N.app.constants.CONFIG_STB_TUNER_TYPE)) {
				case "DVBS":
					isDVBCTuner = false;
					break;
				case "DVBC":
					isDVBCTuner = true;
					break;
				default:
					isDVBCTuner = false;
				}
				log("initialise", "Exit");
			},

			/**
			 * Returns the isDVBCTuner
			 * @method getIsDVBCTuner
			 * @return {boolean} isDVBCTuner value
			 */
			getIsDVBCTuner: function () {
				log("getIsDVBCTuner", "Enter & Exit");
				return isDVBCTuner;
			},

			/**
			 * Returns the scanTypeOptions
			 * @method getScanTypeOptions
			 * @return {array} The scan options in array
			 */
			getScanTypeOptions: function () {
				log("getScanTypeOptions", "Enter & Exit");
				return scanTypeOptions;
			},

			/**
			 * Returns the polarisationValues
			 * @method getPolarisationValues
			 * @return {array} The polarisation values in array
			 */
			getPolarisationValues: function () {
				log("getPolarisationValues", "Enter & Exit");
				return polarisationValues;
			},

			/**
			 * Returns the symbolRate array according to the Tuner Type
			 * @method getSymbolRates
			 * @return {array} The symbolRate values in array
			 */
			getSymbolRates: function () {
				log("getSymbolRates", "Enter & Exit");
				return isDVBCTuner ? symbolRatesForDVBC : symbolRatesForDVBS;
			},

			/**
			 * Returns the fecValues array according to the Tuner Type
			 * @method getFecValues
			 * @return {array} The fec inner values in array
			 */
			getFecInnerValues: function () {
				log("getSymbolRates", "Enter & Exit");
				return isDVBCTuner ? fecInnerValuesForDVBC : fecInnerValuesForDVBS;
			},

			/**
			 * Returns the fecOuterValues array
			 * @method getFecOuterValues
			 * @return {array} The fec outer values in array
			 */
			getFecOuterValues: function () {
				log("getFecOuterValues", "Enter & Exit");
				return fecOuterValuesForDVBC;
			},

			/**
			 * Returns the modulationValues
			 * @method getModulationValues
			 * @return {array} The modulation values in array
			 */
			getModulationValues: function () {
				log("getModulationValues", "Enter & Exit");
				return modulationValues;
			},

			/**
			 * Returns the lnbPowerValues
			 * @method getLnbPowerValues
			 * @return {array} The lnbPower Values in array
			 */
			getLnbPowerValues: function () {
				log("getLnbPowerValues", "Enter & Exit");
				return lnbPowerValues;
			},

			/**
			 * Returns the DVBC_PROFILE_PATH
			 * @method getDVBCProfilePath
			 * @return {string} DVBC_PROFILE_PATH value
			 */
			getDVBCProfilePath: function () {
				log("getDVBCProfilePath", "Enter & Exit");
				return DVBC_PROFILE_PATH;
			},

			/**
			 * Returns the Modulation type
			 * @method getModulationType
			 * @return {string} ModulationType value
			 */
			getModulationType: function (value) {
				log("getModulationType", "Enter & Exit");
				var modulationType;
				switch (value) {
				case 1:
					modulationType = "16 QAM";
					break;
				case 2:
					modulationType = "32 QAM";
					break;
				case 3:
					modulationType = "64 QAM";
					break;
				case 4:
					modulationType = "128 QAM";
					break;
				case 5:
					modulationType = "256 QAM";
					break;
				default:
					break;
				}
				return modulationType;
			}
		};
	}());

}($N || {}));