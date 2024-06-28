<?php
header('Content-Type: application/json');

// Path to the JSON file
$jsonFilePath = __DIR__ . '/../data/units.json';

// Read the contents and output as JSON
if (file_exists($jsonFilePath)) {
    $jsonContent = file_get_contents($jsonFilePath);
    echo $jsonContent;
} else {
    echo json_encode(['error' => 'Training units data file not found']);
}
