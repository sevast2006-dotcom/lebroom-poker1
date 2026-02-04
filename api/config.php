<?php
// Конфигурация базы данных
define('DB_HOST', 'localhost');
define('DB_NAME', 'lebroom_poker');
define('DB_USER', 'ваш_пользователь');
define('DB_PASS', 'ваш_пароль');

// Безопасность
define('API_KEY', 'lebroom_secret_key_2024');
define('ADMIN_API_KEY', 'admin_secret_key_2024');

// Настройки CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key');
header('Content-Type: application/json; charset=utf-8');

// Проверка метода запроса
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}
?>