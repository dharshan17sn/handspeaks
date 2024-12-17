const watch = new TouchSDK.Watch();

const connectButton = watch.createConnectButton();
document.body.appendChild(connectButton);

const sequenceLength = 130; // Number of samples needed for prediction
let sensorDataBuffer = []; // Buffer to accumulate sensor data
let isCollectingData = false; // Flag to control data collection

// Object to store sensor data
const sensorData = {
    acceleration: [0, 0, 0],
    gravity: [0, 0, 0],
    angularVelocity: [0, 0, 0],
    orientation: [0, 0, 0, 0],
};

// Variable to store the timestamp when the first sample is collected
let startTime = null;

// Create an element to display the prediction result and time taken
const predictionElement = document.createElement('div');
predictionElement.id = 'prediction';
document.body.appendChild(predictionElement);

const timeTakenElement = document.createElement('div');
timeTakenElement.id = 'timeTaken';
document.body.appendChild(timeTakenElement);

// Handle acceleration data
watch.addEventListener('accelerationchanged', (event) => {
    if (isCollectingData) {
        const { x, y, z } = event.detail;
        sensorData.acceleration = [x, y, z];
    }
});

// Handle angular velocity data
watch.addEventListener('angularvelocitychanged', (event) => {
    if (isCollectingData) {
        const { x, y, z } = event.detail;
        sensorData.angularVelocity = [x, y, z];
    }
});

// Handle gravity vector data
watch.addEventListener('gravityvectorchanged', (event) => {
    if (isCollectingData) {
        const { x, y, z } = event.detail;
        sensorData.gravity = [x, y, z];
    }
});

// Handle orientation data
watch.addEventListener('orientationchanged', (event) => {
    if (isCollectingData) {
        const { x, y, z, w } = event.detail;
        sensorData.orientation = [x, y, z, w];
    }
});

// Function to accumulate sensor data
function accumulateSensorData() {
    // Only accumulate data if the flag is set
    if (!isCollectingData) return;

    // Start tracking time when the first sample is added
    if (sensorDataBuffer.length === 0) {
        startTime = Date.now();
    }

    // Combine sensor data into a single array (only x, y, z from orientation)
    const structuredData = [
        ...sensorData.acceleration,
        ...sensorData.gravity,
        ...sensorData.angularVelocity,
        ...sensorData.orientation.slice(0, 3), // Only take x, y, z from orientation
    ];

    // Add new data to the buffer
    sensorDataBuffer.push(structuredData);

    // Log structured data (will stop when isCollectingData is false)
    console.log(structuredData);

    // Check if the buffer has enough data (130 samples)
    if (sensorDataBuffer.length >= sequenceLength) {
        // Stop collecting data
        isCollectingData = false;

        // Calculate time taken to collect 130 samples
        const endTime = Date.now();
        const timeTaken = (endTime - startTime) / 1000; // Time in seconds

        // Display the time taken
        timeTakenElement.innerHTML = `Time taken to collect 130 samples: ${timeTaken.toFixed(2)} seconds`;

        // Slice the buffer to the first 130 samples
        const dataToSend = sensorDataBuffer.slice(0, sequenceLength);

        // Reset the buffer after sending the data and print a reset message
        sensorDataBuffer = [];
        console.log('Buffer reset after sending data');
        displayPrediction('Buffer reset after sending data');

        // Send the data to Flask API
        sendDataToFlask(dataToSend);

        // Wait 1 second (1000 ms) before starting new data accumulation
        setTimeout(() => {
            console.log('Starting new data accumulation after 1 second delay');
            displayPrediction('Starting new data accumulation after 1 second delay');

            // Restart data collection
            isCollectingData = true;
        }, 1000); // 1000 ms = 1 second delay
    }
}

// Function to start data accumulation with a 50 Hz sampling rate (every 20 ms)
function startDataAccumulation() {
    // Clear any existing intervals before starting a new one
    if (window.dataInterval) {
        clearInterval(window.dataInterval);
    }

    // Start accumulating data every 20 ms (50 Hz)
    isCollectingData = true;
    window.dataInterval = setInterval(accumulateSensorData, 20);
}

// Function to send accumulated data to Flask API
async function sendDataToFlask(dataToSend) {
    // Flatten the data to match the expected format (130 * 12 = 1560 values)
    const flattenedData = dataToSend.flat();

    try {
        const response = await fetch('http://127.0.0.1:5000/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sensor_data: flattenedData
            })
        });

        const data = await response.json();
        if (data.prediction) {
            console.log('Predicted Gesture: ' + data.prediction);
            displayPrediction(data.prediction); // Display prediction on the HTML page
        } else {
            console.log('Error: ' + data.error);
            displayPrediction('Error: ' + data.error); // Show error on the page
        }
    } catch (error) {
        console.error('Error sending data to Flask:', error);
        displayPrediction('Error sending data to Flask'); // Show error on the page
    }
}

// Function to update the prediction element on the HTML page
function displayPrediction(prediction) {
    predictionElement.innerHTML = `Predicted Gesture: ${prediction}`;
}

// Start the initial data accumulation
startDataAccumulation();
