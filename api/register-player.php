<?php
require_once 'database.php';

try {
    $db = Database::getConnection();
    Database::checkApiKey();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['player_id'], $input['tournament_id'])) {
        throw new Exception('Missing required fields');
    }
    
    $playerId = (int)$input['player_id'];
    $tournamentId = (int)$input['tournament_id'];
    
    // Проверяем существует ли запись
    $checkStmt = $db->prepare("
        SELECT COUNT(*) as count FROM tournament_registrations 
        WHERE player_id = ? AND tournament_id = ?
    ");
    $checkStmt->execute([$playerId, $tournamentId]);
    $exists = $checkStmt->fetch()['count'] > 0;
    
    if ($exists) {
        throw new Exception('Player already registered for this tournament');
    }
    
    // Получаем информацию о турнире
    $tournamentStmt = $db->prepare("SELECT * FROM tournaments WHERE id = ?");
    $tournamentStmt->execute([$tournamentId]);
    $tournament = $tournamentStmt->fetch();
    
    if (!$tournament) {
        throw new Exception('Tournament not found');
    }
    
    if ($tournament['finished']) {
        throw new Exception('Tournament is finished');
    }
    
    // Получаем текущее количество записей
    $countStmt = $db->prepare("
        SELECT COUNT(*) as count FROM tournament_registrations 
        WHERE tournament_id = ?
    ");
    $countStmt->execute([$tournamentId]);
    $currentCount = $countStmt->fetch()['count'];
    
    if ($currentCount >= $tournament['total_seats']) {
        throw new Exception('No available seats');
    }
    
    // Добавляем запись
    $position = $currentCount + 1;
    $registerStmt = $db->prepare("
        INSERT INTO tournament_registrations (player_id, tournament_id, position) 
        VALUES (?, ?, ?)
    ");
    $registerStmt->execute([$playerId, $tournamentId, $position]);
    
    // Обновляем счетчик в турнире
    $updateStmt = $db->prepare("
        UPDATE tournaments SET registered_count = ? WHERE id = ?
    ");
    $updateStmt->execute([$position, $tournamentId]);
    
    // Обновляем registered_players
    $playersStmt = $db->prepare("
        SELECT GROUP_CONCAT(player_id) as player_ids 
        FROM tournament_registrations 
        WHERE tournament_id = ?
    ");
    $playersStmt->execute([$tournamentId]);
    $playerIds = $playersStmt->fetch()['player_ids'] ?? '';
    
    $updatePlayersStmt = $db->prepare("
        UPDATE tournaments SET registered_players = ? WHERE id = ?
    ");
    $updatePlayersStmt->execute([$playerIds, $tournamentId]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Player registered successfully',
        'position' => $position,
        'registered_count' => $position
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>