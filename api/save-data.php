<?php
require_once 'database.php';

try {
    $db = Database::getConnection();
    $isAdmin = Database::checkApiKey();
    
    if (!$isAdmin) {
        http_response_code(403);
        echo json_encode(['error' => 'Admin access required']);
        exit;
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        throw new Exception('No data received');
    }
    
    $db->beginTransaction();
    
    // Обновляем игроков
    if (isset($data['players'])) {
        $db->exec("DELETE FROM players");
        $playerStmt = $db->prepare("
            INSERT INTO players (id, name, telegram_id, telegram_username, points, tournaments, wins, registered_tournaments) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        foreach ($data['players'] as $player) {
            $playerStmt->execute([
                $player['id'] ?? null,
                $player['name'] ?? '',
                $player['telegram_id'] ?? null,
                $player['telegram_username'] ?? null,
                $player['points'] ?? 0,
                $player['tournaments'] ?? 0,
                $player['wins'] ?? 0,
                json_encode($player['registered_tournaments'] ?? [], JSON_UNESCAPED_UNICODE)
            ]);
        }
    }
    
    // Обновляем турниры
    if (isset($data['tournaments'])) {
        $db->exec("DELETE FROM tournaments");
        $tournamentStmt = $db->prepare("
            INSERT INTO tournaments (id, title, date, time, total_seats, registered_count, buy_in, prize_pool, description, rules, status, registered_players, finished, results) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        foreach ($data['tournaments'] as $tournament) {
            $tournamentStmt->execute([
                $tournament['id'] ?? null,
                $tournament['title'] ?? '',
                $tournament['date'] ?? '',
                $tournament['time'] ?? '',
                $tournament['total_seats'] ?? 100,
                $tournament['registered_count'] ?? 0,
                $tournament['buy_in'] ?? '',
                $tournament['prize_pool'] ?? '',
                $tournament['description'] ?? '',
                $tournament['rules'] ?? '',
                $tournament['status'] ?? 'upcoming',
                json_encode($tournament['registered_players'] ?? [], JSON_UNESCAPED_UNICODE),
                $tournament['finished'] ?? false ? 1 : 0,
                json_encode($tournament['results'] ?? [], JSON_UNESCAPED_UNICODE)
            ]);
        }
    }
    
    $db->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Data saved successfully'
    ]);
    
} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>