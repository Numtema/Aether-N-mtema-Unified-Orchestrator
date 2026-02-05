
<?php
/**
 * AETHER NEXUS - SQL BRIDGE BACKEND (V2 - JSON OPTIMIZED)
 * À placer sur Hostinger (srv1425.hstgr.io)
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

// Gestion du Preflight CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

// CONFIGURATION HOSTINGER
$host = "srv1425.hstgr.io";
$dbname = "u822234768_Aether";
$username = "u822234768_aether"; // Vérifie bien que c'est le bon utilisateur dans Hostinger
$password = "6hQ5GY2t2@"; 

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO.ATTR_ERRMODE, PDO.ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die(json_encode(["error" => "Database connection failed: " . $e->getMessage()]));
}

$input = json_decode(file_get_contents("php://input"), true);
if (!$input) die(json_encode(["error" => "Invalid input payload"]));

$action = $input['action'];

switch ($action) {
    case 'fetch':
        $table = preg_replace('/[^a-zA-Z0-0_]/', '', $input['table']);
        $filters = $input['filters'] ?? [];
        $where = [];
        $params = [];
        foreach ($filters as $key => $val) {
            $where[] = "`$key` = ?";
            $params[] = $val;
        }
        $sql = "SELECT * FROM `$table`" . (count($where) > 0 ? " WHERE " . implode(" AND ", $where) : "");
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $results = $stmt->fetchAll(PDO.FETCH_ASSOC);
        
        // Décoder les colonnes JSON pour le Frontend
        foreach ($results as &$row) {
            foreach ($row as $key => $val) {
                if (is_string($val) && (strpos($val, '{') === 0 || strpos($val, '[') === 0)) {
                    $decoded = json_decode($val, true);
                    if (json_last_error() === JSON_ERROR_NONE) {
                        $row[$key] = $decoded;
                    }
                }
            }
        }
        echo json_encode(["result" => $results]);
        break;

    case 'save':
        $table = preg_replace('/[^a-zA-Z0-0_]/', '', $input['table']);
        $data = $input['data'];
        
        // Convertir les objets/tableaux en chaînes JSON pour MySQL
        foreach ($data as $key => $val) {
            if (is_array($val) || is_object($val)) {
                $data[$key] = json_encode($val);
            }
        }
        
        $keys = array_keys($data);
        $fields = implode(", ", array_map(fn($k) => "`$k`", $keys));
        $placeholders = implode(", ", array_fill(0, count($keys), "?"));
        $updates = implode(", ", array_map(fn($k) => "`$k` = VALUES(`$k`)", $keys));

        $sql = "INSERT INTO `$table` ($fields) VALUES ($placeholders) ON DUPLICATE KEY UPDATE $updates";
        $stmt = $pdo->prepare($sql);
        $stmt->execute(array_values($data));
        echo json_encode(["result" => "success"]);
        break;

    case 'delete':
        $table = preg_replace('/[^a-zA-Z0-0_]/', '', $input['table']);
        $id = $input['id'];
        $stmt = $pdo->prepare("DELETE FROM `$table` WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(["result" => "deleted"]);
        break;

    default:
        echo json_encode(["error" => "Action '$action' not supported"]);
}
?>
