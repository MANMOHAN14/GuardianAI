// requiring the contract
var PatientManagement = artifacts.require("./PatientManagement.sol");

// exporting as module 
 module.exports = function(deployer) {
  deployer.deploy(PatientManagement);
 };

