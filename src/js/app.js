App = {
    webProvider: null,
    contracts: {},
    account: '0x0',
    web3: null,
  
    init: async function() {
        if (window.ethereum) { 
            App.webProvider = window.ethereum;
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            App.account = accounts[0];
            document.getElementById('accountAddress').innerHTML = `Current Account: ${App.account}`;
            App.web3 = new Web3(App.webProvider); 
            App.listenForAccountChanges();
        } else {
            alert('Please install MetaMask!');
            return;
        }
        await App.initContract();
        await App.initializeDropdowns();
    },
  
    listenForAccountChanges: function() {
        window.ethereum.on('accountsChanged', function(accounts) {
            if (accounts.length > 0) {
                App.account = accounts[0];
                document.getElementById('accountAddress').innerHTML = `Current Account: ${App.account}`;
                document.getElementById('scheduleTable').innerHTML = '';
                document.getElementById('trendTable').innerHTML = '';
                const formElement = document.getElementById('registrationForm');
                formElement.reset();
                App.updateRegistrationForm();
                App.checkUserAccess();
            } else {
                document.getElementById('accountAddress').innerHTML = `No Account Connected`;
            }
        });
    },

    initializeDropdowns: async function() {
        await App.populateTimeslotDropdown();
        await App.populateAdminDropdown();
        await App.populateDoctorDropdown();
        await App.populatePatientDropdown();
    },
  
    initContract: async function() {
        const res = await fetch('PatientManagement.json'); 
        const data = await res.json();
        App.contracts.PatientManagement = TruffleContract(data);
        App.contracts.PatientManagement.setProvider(App.webProvider);
    },
  
    checkUserAccess: async function () {
        const instance = await App.contracts.PatientManagement.deployed();
        try {
            const admin = await instance.admins(App.account);
            const patient = await instance.patients(App.account);
            const doctor = await instance.doctors(App.account);
            const isAdmin = admin[0] > 0;
            const isPatient = patient[0] > 0;
            const isDoctor = doctor[0] > 0;
            document.querySelectorAll('.form-section:not(#registrationForm)').forEach(section => {
                section.style.display = 'none';
            });
            document.querySelectorAll('.table-section').forEach(section => {
                section.style.display = 'none';
            });
            if (isAdmin) {
                document.getElementById('updateForm').closest('.form-section').style.display = 'block';
                document.querySelectorAll('.table-section').forEach(section => {
                    section.style.display = 'block';
                });
            } else if (isPatient) {
                document.getElementById('appointmentForm').closest('.form-section').style.display = 'block';
                document.querySelectorAll('.table-section').forEach(section => {
                    section.style.display = 'block';
                });
            } else if (isDoctor) {
                document.querySelectorAll('.table-section').forEach(section => {
                    section.style.display = 'block';
                });
            } else {
                document.getElementById('registrationForm').closest('.form-section').style.display = 'block';
            }
        } catch (err) {
            console.error('Error checking user access:', err);
            alert('Error checking access. Please refresh the page.');
        }
    },
  
    populateTimeslotDropdown: function() {
        const timeSlotDropdown = document.getElementById('timeSlotSelect');
        timeSlotDropdown.innerHTML = ''; // Clear all options
        const noneOption = document.createElement('option');
        noneOption.value = '';
        noneOption.text = 'None';
        timeSlotDropdown.appendChild(noneOption);
        const timeSlots = [
            "4:00 PM - 4:10 PM",
            "4:10 PM - 4:20 PM",
            "4:20 PM - 4:30 PM",
            "4:30 PM - 4:40 PM",
            "4:40 PM - 4:50 PM",
            "4:50 PM - 5:00 PM"
        ];
        timeSlots.forEach(slot => {
            const option = document.createElement('option');
            option.value = slot;
            option.text = slot;
            timeSlotDropdown.appendChild(option);
        });
    },
  
    populateAdminDropdown: async function() {
        const adminDropdown = document.getElementById('adminSelect');
        adminDropdown.innerHTML = '';
        const noneOption = document.createElement('option');
        noneOption.value = '';
        noneOption.text = 'None';
        adminDropdown.appendChild(noneOption);
        try {
            const instance = await App.contracts.PatientManagement.deployed();
            const adminCount = await instance.adminCount();
            for (let i = 0; i < adminCount; i++) {
                const adminAddress = await instance.adminAddresses(i);
                const admin = await instance.admins(adminAddress);
                const option = document.createElement('option');
                option.value = adminAddress;
                option.text = admin[1];
                adminDropdown.appendChild(option);
            }
        } catch (error) {
            console.error("Error populating admin dropdown:", error);
        }
    },
    
    populateDoctorDropdown: async function() {
        const doctorDropdown = document.getElementById('doctorSelect');
        doctorDropdown.innerHTML = '';
        const noneOption = document.createElement('option');
        noneOption.value = '';
        noneOption.text = 'None';
        doctorDropdown.appendChild(noneOption);
        try {
            const instance = await App.contracts.PatientManagement.deployed();
            const doctorCount = await instance.doctorCount();
            for (let i = 0; i < doctorCount; i++) {
                const doctorAddress = await instance.doctorAddresses(i);
                const doctor = await instance.doctors(doctorAddress);
                const option = document.createElement('option');
                option.value = doctorAddress;
                option.text = doctor[1];
                doctorDropdown.appendChild(option);
            }
        } catch (error) {
            console.error("Error populating doctor dropdown:", error);
        }
    },
    
    populatePatientDropdown: async function() {
        const patientDropdown = document.getElementById('patientSelect');
        patientDropdown.innerHTML = '';
        const noneOption = document.createElement('option');
        noneOption.value = '';
        noneOption.text = 'None';
        patientDropdown.appendChild(noneOption);
        try {
            const instance = await App.contracts.PatientManagement.deployed();
            const patientCount = await instance.patientCount();
            for (let i = 0; i < patientCount; i++) {
                const patientAddress = await instance.patientAddresses(i);
                const patient = await instance.patients(patientAddress);
                const option = document.createElement('option');
                option.value = patientAddress;
                option.text = patient[2];
                patientDropdown.appendChild(option);
            }
        } catch (error) {
            console.error("Error populating patient dropdown:", error);
        }
    },
  
    updateRegistrationForm: function() {
        const userType = document.getElementById('userType').value;
        const dynamicFields = document.getElementById('dynamicFields');
        dynamicFields.innerHTML = '';
        if (userType === 'admin') {
            dynamicFields.innerHTML = `
                <label for="name">Name:</label>
                <input type="text" id="name" required>
            `;
        } else if (userType === 'doctor') {
            dynamicFields.innerHTML = `
                <label for="name">Name:</label>
                <input type="text" id="name" required>
            `;
        } else if (userType === 'patient') {
            dynamicFields.innerHTML = `
                <label for="name">Name:</label>
                <input type="text" id="name" required>
                <br>
                <label for="age">Age:</label>
                <input type="number" id="age" required>
                <br>
                <label for="gender">Gender:</label>
                <select id="gender" required>
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                </select>
                <br>
                <label for="district">District:</label>
                <input type="text" id="district" required>
                <br>
                <label for="symptomsDetails">Symptoms:</label>
                <input type="text" id="symptomsDetails" required>
            `;
        }
    },
  
    registerUser: async function(userType, formData, formElement) {
        const instance = await App.contracts.PatientManagement.deployed();
        try {
            if (userType === 'admin') {
                await instance.registerAdmin(formData.name, { from: App.account });
            } else if (userType === 'doctor') {
                await instance.registerDoctor(formData.name, { from: App.account });
            } else if (userType === 'patient') {
                await instance.registerPatient(formData.age, formData.name, formData.gender, formData.district, formData.symptomsDetails, { from: App.account });
            }
            alert(`${userType} registered successfully!`);
            formElement.reset();
            App.updateRegistrationForm();
            App.checkUserAccess();
        } catch (err) {
            console.error(err);
            alert(`Error: ${App.extractErrorMessage(err)}`);
        }
    },
  
    updatePatientData: async function(patientAddress, vaccineStatus, isDeceased) {
        const instance = await App.contracts.PatientManagement.deployed();
        const patient = await instance.patients(patientAddress);
        const patientDeceased = patient[7];
        const isDeceasedBool = isDeceased === 'true';
        const patientDeceasedBool = !!patientDeceased; 
        if (patientDeceasedBool && !isDeceasedBool) {
            alert(`Can't change status of deceased patient`);
        } else {
            try {
                await instance.updatePatientData(patientAddress, vaccineStatus, isDeceased, { from: App.account });
                alert('Patient data updated successfully!');
            } catch (err) {
                console.error(err);
                alert(`Error: ${App.extractErrorMessage(err)}`);
            }
        }
    },
  
    bookAppointment: async function(doctorAddress, adminAddress, timeSlot) {
        const instance = await App.contracts.PatientManagement.deployed();
        const schedule = await instance.viewAppointmentSchedule(doctorAddress, { from: App.account });
        const timeSlots = [
            "4:00 PM - 4:10 PM", "4:10 PM - 4:20 PM", "4:20 PM - 4:30 PM", 
            "4:30 PM - 4:40 PM", "4:40 PM - 4:50 PM", "4:50 PM - 5:00 PM"
        ];
        const index = timeSlots.indexOf(timeSlot);
        if (schedule[index]) {
            alert("Slot already booked");
        } else {
            try {
                await instance.bookAppointment(doctorAddress, adminAddress, timeSlot, { from: App.account, value: '1000000000000000000' });
                alert('Appointment booked successfully!');
                document.getElementById('scheduleTable').innerHTML = '';
                document.getElementById('trendTable').innerHTML = '';
            } catch (err) {
                console.error(err);
                alert(`Error: ${App.extractErrorMessage(err)}`);
            }
        }
    },
  
    viewAllSchedules: async function() {
        const instance = await App.contracts.PatientManagement.deployed();
        try {
            const table = document.getElementById('scheduleTable');
            table.innerHTML = ""; // Clear the table content
            const headerRow = table.insertRow();
            const headerDoctor = headerRow.insertCell(0);
            headerDoctor.innerText = "Doctor Name";
            const timeSlots = [
                "4:00 PM - 4:10 PM", "4:10 PM - 4:20 PM", "4:20 PM - 4:30 PM", 
                "4:30 PM - 4:40 PM", "4:40 PM - 4:50 PM", "4:50 PM - 5:00 PM"
            ];
            timeSlots.forEach(slot => {
                const headerCell = headerRow.insertCell(-1);
                headerCell.innerText = slot;
            });
            const doctorCount = await instance.doctorCount();
            for (let i = 0; i < doctorCount; i++) {
                const doctorAddress = await instance.doctorAddresses(i); 
                const doctor = await instance.doctors(doctorAddress); 
                const schedule = await instance.viewAppointmentSchedule(doctorAddress, { from: App.account });
                const row = table.insertRow();
                const doctorNameCell = row.insertCell(0);
                doctorNameCell.innerText = doctor[1]; 
                schedule.forEach(isBooked => {
                    const cell = row.insertCell(-1);
                    cell.innerText = isBooked ? "Booked" : "Available";
                    cell.style.color = isBooked ? "red" : "green";
                });
            }
        } catch (err) {
            console.error(err);
            alert(`Error: ${App.extractErrorMessage(err)}`);
        }
    },
  
    viewCovidTrends: async function() {
        const instance = await App.contracts.PatientManagement.deployed();
        try {
            const patientCount = await instance.patientCount();
            let patientData = [];
            for (let i = 0; i < patientCount; i++) {
                const patientAddress = await instance.patientAddresses(i);
                const [age, district] = await instance.getCovidTrendData(patientAddress, { from: App.account });
                patientData.push({ age: age, district: district });
            }
            let districtMap = {};
            for (let i = 0; i < patientCount; i++) {
                const patient = patientData[i];
                const district = patient.district;
                const age = patient.age;
                if (!districtMap[district]) {
                    districtMap[district] = {
                        totalPatients: 0,
                        childrenCount: 0,
                        teenageCount: 0,
                        youngCount: 0,
                        elderCount: 0,
                        ages: []
                    };
                }
                districtMap[district].totalPatients++;
                if (age < 13) districtMap[district].childrenCount++;
                else if (age < 20) districtMap[district].teenageCount++;
                else if (age < 50) districtMap[district].youngCount++;
                else districtMap[district].elderCount++;
                districtMap[district].ages.push(age);
            }
            let trends = [];
            for (let district in districtMap) {
                let data = districtMap[district];
                if (data.totalPatients > 0) {
                    data.childrenPercent = (data.childrenCount * 100) / data.totalPatients;
                    data.teenagePercent = (data.teenageCount * 100) / data.totalPatients;
                    data.youngPercent = (data.youngCount * 100) / data.totalPatients;
                    data.elderPercent = (data.elderCount * 100) / data.totalPatients;
                }
                data.ages = data.ages.map(Number).sort((a, b) => a - b);
                if (data.ages.length % 2 === 0) {
                    data.medianAge = (data.ages[data.ages.length / 2 - 1] + data.ages[data.ages.length / 2]) / 2;
                } else {
                    data.medianAge = data.ages[Math.floor(data.ages.length / 2)];
                }
                trends.push({
                    districtName: district,
                    childrenCount: data.childrenCount,
                    teenageCount: data.teenageCount,
                    youngCount: data.youngCount,
                    elderCount: data.elderCount,
                    childrenPercent: data.childrenPercent.toFixed(2),
                    teenagePercent: data.teenagePercent.toFixed(2),
                    youngPercent: data.youngPercent.toFixed(2),
                    elderPercent: data.elderPercent.toFixed(2),
                    totalPatients: data.totalPatients,
                    medianAge: data.medianAge
                });
            }
            let tableHTML = `
                <table class="table table-bordered">
                    <thead>
                        <tr>
                            <th>District</th>
                            <th>Total Patients</th>
                            <th>Children (%)</th>
                            <th>Teenage (%)</th>
                            <th>Young (%)</th>
                            <th>Elder (%)</th>
                            <th>Median Age</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            trends.forEach(trend => {
                tableHTML += `
                    <tr>
                        <td>${trend.districtName}</td>
                        <td>${trend.totalPatients}</td>
                        <td>${trend.childrenPercent}%</td>
                        <td>${trend.teenagePercent}%</td>
                        <td>${trend.youngPercent}%</td>
                        <td>${trend.elderPercent}%</td>
                        <td>${trend.medianAge}</td>
                    </tr>
                `;
            });
            tableHTML += `
                    </tbody>
                </table>
            `;
            document.getElementById('trendTable').innerHTML = tableHTML;
        } catch (err) {
            console.error(err);
            alert(`Error: ${App.extractErrorMessage(err)}`);
        }
    },
  
    extractErrorMessage: function(err) {
        if (err.data) {
            if (err.data.message) {
                return err.data.message; 
            }
            if (err.data.reason) {
                return err.data.reason; 
            }
        }
        if (err.message) {
            return err.message; 
        }
        return 'An unknown error occurred';
    }
};
  
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
  
document.addEventListener('DOMContentLoaded', async function() {
    await App.init();
    await App.updateRegistrationForm();
    console.log('Adding delay before calling checkUserAccess...');
    await delay(100); 
    console.log('Calling checkUserAccess...');
    await App.checkUserAccess();
    document.getElementById('registrationForm').onsubmit = async function(e) {
        e.preventDefault();
        const formElement = e.target;
        const userType = document.getElementById('userType').value;
        const formData = {
            name: document.getElementById('name').value,
            age: parseInt(document.getElementById('age')?.value || 0),
            gender: document.getElementById('gender')?.value || '',
            district: document.getElementById('district')?.value || '',
            symptomsDetails: document.getElementById('symptomsDetails')?.value || ''
        };
        App.registerUser(userType, formData, formElement);
  
    };
    document.getElementById('updateForm').onsubmit = async function(e) {
      e.preventDefault();
      App.updatePatientData(
        document.getElementById('patientSelect').value,
        document.getElementById('vaccineStatus').value,
        document.getElementById('deceased').value 
      );
    };
    document.getElementById('appointmentForm').onsubmit = async function(e) {
        e.preventDefault();
        App.bookAppointment(
            document.getElementById('doctorSelect').value,
            document.getElementById('adminSelect').value,
            document.getElementById('timeSlotSelect').value
        );
    };
  
    document.getElementById('viewAllSchedules').onclick = function() {
        App.viewAllSchedules();
    };
    document.getElementById('viewCovidTrends').onclick = function() {
        App.viewCovidTrends();
    };
  });
