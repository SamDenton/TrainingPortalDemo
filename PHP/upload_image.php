<?php
header('Content-Type: application/json');

$targetDir = __DIR__ . '/../media/';
$uploadStatus = [
    'success' => false,
    'message' => '',
    'fileName' => ''
];

if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
    $fileTmpPath = $_FILES['image']['tmp_name'];
    $fileName = $_FILES['image']['name'];
    $fileSize = $_FILES['image']['size'];
    $fileType = $_FILES['image']['type'];
    $fileNameCmps = explode(".", $fileName);
    $fileExtension = strtolower(end($fileNameCmps));

    // Sanitize the file name
    $newFileName = md5(time() . $fileName) . '.' . $fileExtension;

    // Check if the file extension is valid
    $allowedfileExtensions = array('jpg', 'gif', 'png', 'jpeg');
    if (in_array($fileExtension, $allowedfileExtensions)) {
        $dest_path = $targetDir . $newFileName;

        if (move_uploaded_file($fileTmpPath, $dest_path)) {
            $uploadStatus['success'] = true;
            $uploadStatus['fileName'] = $newFileName;
        } else {
            $uploadStatus['message'] = 'There was an error moving the uploaded file.';
        }
    } else {
        $uploadStatus['message'] = 'Upload failed. Allowed file types: ' . implode(',', $allowedfileExtensions);
    }
} else {
    $uploadStatus['message'] = 'There is no file uploaded or there was an error uploading the file.';
}

echo json_encode($uploadStatus);
?>
