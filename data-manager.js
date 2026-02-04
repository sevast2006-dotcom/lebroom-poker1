// data-manager.js
// Менеджер данных для LEBROOM Poker Club

class DataManager {
    constructor() {
        this.players = this.loadFromStorage('players') || [];
        this.tournaments = this.loadFromStorage('tournaments') || [];
        
        // Генератор ID
        this.nextPlayerId = this.getNextId('player');
        this.nextTournamentId = this.getNextId('tournament');
    }
    
    // Работа с хранилищем
    loadFromStorage(key) {
        try {
            const data = localStorage.getItem(`lebroom_${key}`);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`Error loading ${key}:`, error);
            return null;
        }
    }
    
    saveToStorage(key, data) {
        try {
            localStorage.setItem(`lebroom_${key}`, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error(`Error saving ${key}:`, error);
            return false;
        }
    }
    
    getNextId(type) {
        if (type === 'player') {
            return this.players.length > 0 ? Math.max(...this.players.map(p => p.id || 0)) + 1 : 1;
        } else {
            return this.tournaments.length > 0 ? Math.max(...this.tournaments.map(t => t.id || 0)) + 1 : 1;
        }
    }
    
    // Управление игроками
    addPlayer(playerData) {
        const newPlayer = {
            id: this.nextPlayerId++,
            telegramId: null,
            points: 0,
            tournaments: 0,
            wins: 0,
            registeredTournaments: [],
            createdAt: new Date().toISOString(),
            ...playerData
        };
        
        this.players.push(newPlayer);
        this.sortPlayersByPoints();
        this.saveToStorage('players', this.players);
        
        return newPlayer;
    }
    
    updatePlayer(playerId, updates) {
        const index = this.players.findIndex(p => p.id === playerId);
        if (index !== -1) {
            this.players[index] = { 
                ...this.players[index], 
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.sortPlayersByPoints();
            this.saveToStorage('players', this.players);
            return this.players[index];
        }
        return null;
    }
    
    deletePlayer(playerId) {
        const playerIndex = this.players.findIndex(p => p.id === playerId);
        if (playerIndex === -1) return false;
        
        // Удаляем игрока из всех турниров
        this.tournaments.forEach(tournament => {
            if (tournament.registeredPlayers) {
                tournament.registeredPlayers = tournament.registeredPlayers.filter(id => id !== playerId);
                tournament.registeredCount = tournament.registeredPlayers.length;
            }
        });
        
        this.players.splice(playerIndex, 1);
        this.saveToStorage('players', this.players);
        this.saveToStorage('tournaments', this.tournaments);
        
        return true;
    }
    
    findPlayerByTelegramId(telegramId) {
        return this.players.find(p => p.telegramId === telegramId);
    }
    
    findPlayerById(playerId) {
        return this.players.find(p => p.id === playerId);
    }
    
    findPlayerByName(name) {
        return this.players.find(p => 
            p.name.toLowerCase().includes(name.toLowerCase())
        );
    }
    
    sortPlayersByPoints() {
        this.players.sort((a, b) => b.points - a.points);
    }
    
    getPlayerRank(playerId) {
        this.sortPlayersByPoints();
        const index = this.players.findIndex(p => p.id === playerId);
        return index !== -1 ? index + 1 : null;
    }
    
    getTotalPlayersCount() {
        return this.players.length;
    }
    
    // Управление турнирами
    addTournament(tournamentData) {
        const newTournament = {
            id: this.nextTournamentId++,
            registeredPlayers: [],
            registeredCount: 0,
            finished: false,
            status: 'upcoming',
            createdAt: new Date().toISOString(),
            ...tournamentData
        };
        
        this.tournaments.push(newTournament);
        this.saveToStorage('tournaments', this.tournaments);
        
        return newTournament;
    }
    
    updateTournament(tournamentId, updates) {
        const index = this.tournaments.findIndex(t => t.id === tournamentId);
        if (index !== -1) {
            this.tournaments[index] = { 
                ...this.tournaments[index], 
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.saveToStorage('tournaments', this.tournaments);
            return this.tournaments[index];
        }
        return null;
    }
    
    deleteTournament(tournamentId) {
        const tournamentIndex = this.tournaments.findIndex(t => t.id === tournamentId);
        if (tournamentIndex === -1) return false;
        
        // Удаляем турнир из записей игроков
        this.players.forEach(player => {
            if (player.registeredTournaments) {
                player.registeredTournaments = player.registeredTournaments.filter(id => id !== tournamentId);
            }
        });
        
        this.tournaments.splice(tournamentIndex, 1);
        this.saveToStorage('tournaments', this.tournaments);
        this.saveToStorage('players', this.players);
        
        return true;
    }
    
    getCurrentTournament() {
        // Возвращаем ближайший активный турнир
        const now = new Date();
        const activeTournaments = this.tournaments.filter(t => 
            t.status === 'active' || t.status === 'upcoming'
        );
        
        if (activeTournaments.length === 0) {
            return null;
        }
        
        // Сортируем по дате (ближайший первый)
        return activeTournaments.sort((a, b) => {
            const dateA = this.parseDate(a.date, a.time);
            const dateB = this.parseDate(b.date, b.time);
            return dateA - dateB;
        })[0];
    }
    
    parseDate(dateStr, timeStr) {
        // Парсим дату в формате "ДД.ММ" и время "ЧЧ:ММ"
        const [day, month] = dateStr.split('.');
        const [hours, minutes] = timeStr.split(':');
        
        const year = new Date().getFullYear();
        return new Date(year, parseInt(month) - 1, parseInt(day), 
                       parseInt(hours), parseInt(minutes));
    }
    
    getActiveTournaments() {
        return this.tournaments.filter(t => t.status === 'active');
    }
    
    getUpcomingTournaments() {
        return this.tournaments.filter(t => t.status === 'upcoming');
    }
    
    getFinishedTournaments() {
        return this.tournaments.filter(t => t.status === 'finished');
    }
    
    getTotalTournamentsCount() {
        return this.tournaments.length;
    }
    
    registerPlayerForTournament(playerId, tournamentId) {
        const tournament = this.tournaments.find(t => t.id === tournamentId);
        const player = this.players.find(p => p.id === playerId);
        
        if (!tournament || !player) {
            return { success: false, message: 'Турнир или игрок не найден' };
        }
        
        if (tournament.finished || tournament.status === 'finished') {
            return { success: false, message: 'Турнир уже завершен' };
        }
        
        if (tournament.registeredCount >= tournament.totalSeats) {
            return { success: false, message: 'Нет свободных мест' };
        }
        
        // Проверка дублирования записи
        if (tournament.registeredPlayers && tournament.registeredPlayers.includes(playerId)) {
            return { success: false, message: 'Вы уже записаны на этот турнир' };
        }
        
        // Обновление турнира
        if (!tournament.registeredPlayers) {
            tournament.registeredPlayers = [];
        }
        tournament.registeredPlayers.push(playerId);
        tournament.registeredCount = tournament.registeredPlayers.length;
        
        // Обновление игрока
        if (!player.registeredTournaments) {
            player.registeredTournaments = [];
        }
        if (!player.registeredTournaments.includes(tournamentId)) {
            player.registeredTournaments.push(tournamentId);
        }
        
        this.saveToStorage('tournaments', this.tournaments);
        this.saveToStorage('players', this.players);
        
        return { 
            success: true, 
            position: tournament.registeredPlayers.length,
            message: `Вы записаны на турнир "${tournament.title}" под номером ${tournament.registeredPlayers.length}`
        };
    }
    
    unregisterPlayerFromTournament(playerId, tournamentId) {
        const tournament = this.tournaments.find(t => t.id === tournamentId);
        const player = this.players.find(p => p.id === playerId);
        
        if (!tournament || !player) return false;
        
        // Удаляем из турнира
        if (tournament.registeredPlayers) {
            tournament.registeredPlayers = tournament.registeredPlayers.filter(id => id !== playerId);
            tournament.registeredCount = tournament.registeredPlayers.length;
        }
        
        // Удаляем из игрока
        if (player.registeredTournaments) {
            player.registeredTournaments = player.registeredTournaments.filter(id => id !== tournamentId);
        }
        
        this.saveToStorage('tournaments', this.tournaments);
        this.saveToStorage('players', this.players);
        
        return true;
    }
    
    // Результаты турнира
    finishTournament(tournamentId, results) {
        // results = [{ playerId, position, pointsEarned, prize }]
        const tournament = this.tournaments.find(t => t.id === tournamentId);
        if (!tournament) return false;
        
        tournament.finished = true;
        tournament.status = 'finished';
        tournament.results = results;
        tournament.finishedAt = new Date().toISOString();
        
        // Обновление статистики игроков
        results.forEach(result => {
            const player = this.players.find(p => p.id === result.playerId);
            if (player) {
                player.points += result.pointsEarned || 0;
                player.tournaments += 1;
                if (result.position === 1) {
                    player.wins += 1;
                }
                
                // Удаляем турнир из списка записанных
                if (player.registeredTournaments) {
                    player.registeredTournaments = player.registeredTournaments.filter(
                        tId => tId !== tournamentId
                    );
                }
            }
        });
        
        this.sortPlayersByPoints();
        this.saveToStorage('tournaments', this.tournaments);
        this.saveToStorage('players', this.players);
        
        return true;
    }
    
    // Экспорт/импорт данных
    exportData() {
        return {
            players: this.players,
            tournaments: this.tournaments,
            exportedAt: new Date().toISOString(),
            version: '1.0'
        };
    }
    
    importData(data) {
        if (!data.players || !data.tournaments) {
            throw new Error('Некорректный формат данных');
        }
        
        this.players = data.players;
        this.tournaments = data.tournaments;
        
        this.nextPlayerId = this.getNextId('player');
        this.nextTournamentId = this.getNextId('tournament');
        
        this.saveToStorage('players', this.players);
        this.saveToStorage('tournaments', this.tournaments);
        
        return true;
    }
    
    resetData() {
        this.players = [];
        this.tournaments = [];
        this.nextPlayerId = 1;
        this.nextTournamentId = 1;
        
        localStorage.removeItem('lebroom_players');
        localStorage.removeItem('lebroom_tournaments');
        
        return true;
    }
    
    // Получение статистики для профиля
    getPlayerStats(playerId) {
        const player = this.findPlayerById(playerId);
        if (!player) return null;
        
        const rank = this.getPlayerRank(playerId);
        const totalPlayers = this.getTotalPlayersCount();
        
        return {
            ...player,
            rank,
            totalPlayers,
            upcomingTournaments: player.registeredTournaments ? 
                this.tournaments.filter(t => 
                    player.registeredTournaments.includes(t.id) && 
                    !t.finished
                ) : []
        };
    }
    
    // Статистика клуба
    getClubStats() {
        return {
            totalPlayers: this.players.length,
            totalTournaments: this.tournaments.length,
            activeTournaments: this.getActiveTournaments().length,
            upcomingTournaments: this.getUpcomingTournaments().length,
            finishedTournaments: this.getFinishedTournaments().length
        };
    }
}

// Глобальный инстанс
const dataManager = new DataManager();