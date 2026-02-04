<?php
require_once 'config.php';

class Database {
    private static $connection = null;
    
    public static function getConnection() {
        if (self::$connection === null) {
            try {
                self::$connection = new PDO(
                    "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                    DB_USER,
                    DB_PASS,
                    [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::ATTR_EMULATE_PREPARES => false
                    ]
                );
            } catch (PDOException $e) {
                die("Ошибка подключения к базе данных: " . $e->getMessage());
            }
        }
        return self::$connection;
    }
    
    public static function checkApiKey() {
        $headers = getallheaders();
        $apiKey = $headers['X-API-Key'] ?? $_GET['api_key'] ?? '';
        
        if ($apiKey !== API_KEY && $apiKey !== ADMIN_API_KEY) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid API key']);
            exit;
        }
        
        return $apiKey === ADMIN_API_KEY;
    }
}
?>