<?php
require_once 'database.php';

try {
    $db = Database::getConnection();
    $isAdmin = Database::checkApiKey();
    
    // Получаем игроков
    $playersStmt = $db->query("SELECT * FROM players ORDER BY points DESC");
    $players = $playersStmt->fetchAll();
    
    // Получаем турниры
    $tournamentsStmt = $db->query("SELECT * FROM tournaments ORDER BY 
        CASE status 
            WHEN 'active' THEN 1
            WHEN 'upcoming' THEN 2
            WHEN 'finished' THEN 3
        END, date, time");
    $tournaments = $tournamentsStmt->fetchAll();
    
    // Получаем записи на турниры
    $registrationsStmt = $db->query("SELECT * FROM tournament_registrations");
    $registrations = $registrationsStmt->fetchAll();
    
    // Формируем ответ
    $response = [
        'success' => true,
        'players' => $players,
        'tournaments' => $tournaments,
        'registrations' => $registrations,
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>