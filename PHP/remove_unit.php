<?php
header('Content-Type: application/json');

// Get the POST data
$postData = file_get_contents('php://input');
$request = json_decode($postData, true);

// Validate the request data
if (!isset($request['id'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid unit data']);
    exit;
}

// Path to the JSON file
$jsonFilePath = __DIR__ . '/../data/units.json';

// Read the existing units
if (file_exists($jsonFilePath)) {
    $jsonContent = file_get_contents($jsonFilePath);
    $data = json_decode($jsonContent, true);

    // Check if the unit exists
    $unitIndex = array_search($request['id'], array_column($data['units'], 'id'));
    if ($unitIndex !== false) {
        // Remove the unit
        array_splice($data['units'], $unitIndex, 1);

        // Save the updated units back to the file
        if (file_put_contents($jsonFilePath, json_encode($data, JSON_PRETTY_PRINT))) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error saving data']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Unit not found']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Units data file not found']);
}
?>
