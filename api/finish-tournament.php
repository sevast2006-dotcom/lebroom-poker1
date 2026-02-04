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
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['tournament_id'], $input['results'])) {
        throw new Exception('Missing required fields');
    }
    
    $tournamentId = (int)$input['tournament_id'];
    $results = $input['results'];
    
    $db->beginTransaction();
    
    // Обновляем статус турнира
    $updateStmt = $db->prepare("
        UPDATE tournaments 
        SET status = 'finished', finished = 1, results = ?, updated_at = NOW() 
        WHERE id = ?
    ");
    $updateStmt->execute([
        json_encode($results, JSON_UNESCAPED_UNICODE),
        $tournamentId
    ]);
    
    // Обновляем статистику игроков
    foreach ($results as $result) {
        $playerId = (int)$result['player_id'];
        $points = (int)$result['points_earned'];
        $position = (int)$result['position'];
        
        // Обновляем очки
        $pointsStmt = $db->prepare("
            UPDATE players 
            SET points = points + ?, 
                tournaments = tournaments + 1,
                wins = wins + ?,
                updated_at = NOW()
            WHERE id = ?
        ");
        $pointsStmt->execute([
            $points,
            $position === 1 ? 1 : 0,
            $playerId
        ]);
        
        // Обновляем запись
        $updateRegStmt = $db->prepare("
            UPDATE tournament_registrations 
            SET points_earned = ?, prize = ?
            WHERE player_id = ? AND tournament_id = ?
        ");
        $updateRegStmt->execute([
            $points,
            $result['prize'] ?? '',
            $playerId,
            $tournamentId
        ]);
    }
    
    $db->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Tournament finished successfully'
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