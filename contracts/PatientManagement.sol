// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


contract PatientManagement {


    struct Admin {
        uint id;
        string name;
    }

    struct Patient {
        uint id;
        uint age;
        string name;
        string gender;
        string district;
        string vaccineStatus;
        string symptomsDetails;
        bool isDead;
        address patientAddress;
    }

    struct Doctor {
        uint id;
        string name;
        mapping(string => address) appointments; 
    }

    struct DistrictData {
        string districtName;   
        uint childrenCount;    
        uint teenageCount;     
        uint youngCount;       
        uint elderCount;       
        uint childrenPercent;  
        uint teenagePercent;   
        uint youngPercent;     
        uint elderPercent;     
        uint totalPatients;    
        uint medianAge;        
    }

    uint public adminCount;
    uint public patientCount;
    uint public doctorCount;

    mapping(address => Admin) public admins;
    mapping(address => Patient) public patients;
    mapping(address => Doctor) public doctors;

    address[] public patientAddresses;
    address[] public doctorAddresses;
    address[] public adminAddresses;

    mapping(address => bool) private registeredUsers;

    string[] public timeSlots = [
        "4:00 PM - 4:10 PM", "4:10 PM - 4:20 PM", "4:20 PM - 4:30 PM", "4:30 PM - 4:40 PM",
        "4:40 PM - 4:50 PM", "4:50 PM - 5:00 PM"
    ];

    modifier onlyAdmin() {
        require(admins[msg.sender].id > 0, "Only admins can perform this action");
        _;
    }

    modifier onlyPatient() {
        require(patients[msg.sender].id > 0, "Only patients can perform this action");
        _;
    }

    modifier onlyRegisteredUser() {
        require(registeredUsers[msg.sender], "You must be registered");
        _;
    }

constructor() {
        address hardcodedAdmin = 0x0D2f38cD0F5CB5E52e8701e0378Dfa958AA43cf5;
        adminCount++;
        admins[hardcodedAdmin] = Admin({ id: adminCount, name: "Contract Deployer" });
        registeredUsers[hardcodedAdmin] = true;
        adminAddresses.push(hardcodedAdmin);
    }

    function registerAdmin(string memory name) public {
        require(!registeredUsers[msg.sender], "You are already registered");
        adminCount++;
        admins[msg.sender] = Admin({ id: adminCount, name: name });
        registeredUsers[msg.sender] = true;
        adminAddresses.push(msg.sender);
    }

    function registerPatient(
        uint age,
        string memory name,
        string memory gender,
        string memory district,
        string memory symptomsDetails
    ) public {
        require(!registeredUsers[msg.sender], "You are already registered");
        patientCount++;
        patients[msg.sender] = Patient({
            id: patientCount,
            name: name,
            age: age,
            gender: gender,
            district: district,
            vaccineStatus: "not_vaccinated",
            symptomsDetails: symptomsDetails,
            isDead: false,
            patientAddress: msg.sender
        });
        registeredUsers[msg.sender] = true;
        patientAddresses.push(msg.sender);
    }

    function registerDoctor(
        string memory name
    ) public {
        require(!registeredUsers[msg.sender], "You are already registered");
        doctorCount++;
        doctors[msg.sender].id = doctorCount;
        doctors[msg.sender].name = name;

        registeredUsers[msg.sender] = true;
        doctorAddresses.push(msg.sender);
    }

    function updatePatientData(
        address patientAddress,
        string memory vaccineStatus,
        bool isDead
    ) public onlyAdmin {
        require(patients[patientAddress].id > 0, "Patient not registered");
        require(
            keccak256(abi.encodePacked(vaccineStatus)) == keccak256(abi.encodePacked("not_vaccinated")) ||
            keccak256(abi.encodePacked(vaccineStatus)) == keccak256(abi.encodePacked("one_dose")) ||
            keccak256(abi.encodePacked(vaccineStatus)) == keccak256(abi.encodePacked("two_dose")),
            "Invalid vaccine status"
        );
        require(
            !(patients[patientAddress].isDead && isDead == false),
            "Dead patient cannot be marked as alive"
        );

        patients[patientAddress].vaccineStatus = vaccineStatus;
        if (!patients[patientAddress].isDead) {
            patients[patientAddress].isDead = isDead;
        }
    }

    function bookAppointment(address doctorAddress, address adminAddress, string memory timeSlot) public payable onlyPatient {
        require(doctors[doctorAddress].id > 0, "Not a valid doctor");
        require(admins[adminAddress].id > 0, "Not a valid admin");
        require(msg.value >= 0.01 ether, "Appointment has to be atleast 0.01 Ether");

        bool validSlot = false;
        for (uint i = 0; i < timeSlots.length; i++) {
            if (keccak256(bytes(timeSlots[i])) == keccak256(bytes(timeSlot))) {
                validSlot = true;
                break;
            }
        }
        require(validSlot, "Invalid time slot");

        require(doctors[doctorAddress].appointments[timeSlot] == address(0), "Time slot already booked");

        doctors[doctorAddress].appointments[timeSlot] = msg.sender;

        payable(adminAddress).transfer(msg.value);
    }


    function viewAppointmentSchedule(address doctorAddress) public view onlyRegisteredUser returns (bool[] memory) {
        require(doctors[doctorAddress].id > 0, "Not a valid doctor");

        bool[] memory schedule = new bool[](timeSlots.length);

        for (uint i = 0; i < timeSlots.length; i++) {
            schedule[i] = (doctors[doctorAddress].appointments[timeSlots[i]] != address(0));
        }

        return schedule;
    }


    function getCovidTrendData(
        address patientAddress
    ) public view onlyRegisteredUser returns (uint, string memory) {

        uint age;
        string memory district;

        Patient memory patient = patients[patientAddress];
        age = patient.age;
        district = patient.district;

        return (age, district);
    }

}

