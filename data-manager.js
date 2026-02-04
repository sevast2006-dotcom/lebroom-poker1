// data-manager.js
// Менеджер данных для LEBROOM Poker Club

class DataManager {
    constructor() {
        this.players = this.loadFromStorage('players') || [
            {
                id: 1,
                name: "Иван Петров",
                telegramId: null,
                points: 2540,
                tournaments: 15,
                wins: 3,
                registeredTournaments: []
            }
        ];
        
        this.tournaments = this.loadFromStorage('tournaments') || [
            {
                id: 1,
                title: "LEBROOM HIGH ROLLER",
                date: "22.01",
                time: "19:00",
                totalSeats: 100,
                registeredCount: 72,
                buyIn: "5 000 ₽",
                prizePool: "500 000 ₽",
                description: "Еженедельный турнир с гарантированным призовым фондом",
                rules: "Texas Hold'em, 15,000 фишек, 20-минутные уровни",
                status: "active",
                registeredPlayers: [1],
                finished: false
            }
        ];
        
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
            return Math.max(...this.players.map(p => p.id), 0) + 1;
        } else {
            return Math.max(...this.tournaments.map(t => t.id), 0) + 1;
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
            this.players[index] = { ...this.players[index], ...updates };
            this.sortPlayersByPoints();
            this.saveToStorage('players', this.players);
            return true;
        }
        return false;
    }
    
    deletePlayer(playerId) {
        this.players = this.players.filter(p => p.id !== playerId);
        this.saveToStorage('players', this.players);
        return true;
    }
    
    findPlayerByTelegramId(telegramId) {
        return this.players.find(p => p.telegramId === telegramId);
    }
    
    findPlayerById(playerId) {
        return this.players.find(p => p.id === playerId);
    }
    
    sortPlayersByPoints() {
        this.players.sort((a, b) => b.points - a.points);
    }
    
    getPlayerRank(playerId) {
        this.sortPlayersByPoints();
        const index = this.players.findIndex(p => p.id === playerId);
        return index !== -1 ? index + 1 : null;
    }
    
    // Управление турнирами
    addTournament(tournamentData) {
        const newTournament = {
            id: this.nextTournamentId++,
            registeredPlayers: [],
            finished: false,
            ...tournamentData
        };
        
        this.tournaments.push(newTournament);
        this.saveToStorage('tournaments', this.tournaments);
        
        return newTournament;
    }
    
    updateTournament(tournamentId, updates) {
        const index = this.tournaments.findIndex(t => t.id === tournamentId);
        if (index !== -1) {
            this.tournaments[index] = { ...this.tournaments[index], ...updates };
            this.saveToStorage('tournaments', this.tournaments);
            return true;
        }
        return false;
    }
    
    deleteTournament(tournamentId) {
        this.tournaments = this.tournaments.filter(t => t.id !== tournamentId);
        this.saveToStorage('tournaments', this.tournaments);
        return true;
    }
    
    getCurrentTournament() {
        return this.tournaments.find(t => t.status === 'active') || this.tournaments[0];
    }
    
    registerPlayerForTournament(playerId, tournamentId) {
        const tournament = this.tournaments.find(t => t.id === tournamentId);
        const player = this.players.find(p => p.id === playerId);
        
        if (!tournament || !player) return false;
        
        // Проверка дублирования записи
        if (tournament.registeredPlayers.includes(playerId)) {
            return { success: false, message: 'Вы уже записаны на этот турнир' };
        }
        
        // Обновление турнира
        tournament.registeredPlayers.push(playerId);
        tournament.registeredCount = tournament.registeredPlayers.length;
        
        // Обновление игрока
        player.registeredTournaments.push(tournamentId);
        
        this.saveToStorage('tournaments', this.tournaments);
        this.saveToStorage('players', this.players);
        
        return { 
            success: true, 
            position: tournament.registeredPlayers.length,
            message: `Вы записаны на турнир "${tournament.title}" под номером ${tournament.registeredPlayers.length}`
        };
    }
    
    // Результаты турнира
    finishTournament(tournamentId, results) {
        // results = [{ playerId, position, pointsEarned, prize }]
        const tournament = this.tournaments.find(t => t.id === tournamentId);
        if (!tournament) return false;
        
        tournament.finished = true;
        tournament.status = 'finished';
        tournament.results = results;
        
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
                player.registeredTournaments = player.registeredTournaments.filter(
                    tId => tId !== tournamentId
                );
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
            exportedAt: new Date().toISOString()
        };
    }
    
    importData(data) {
        if (data.players) {
            this.players = data.players;
            this.nextPlayerId = this.getNextId('player');
        }
        
        if (data.tournaments) {
            this.tournaments = data.tournaments;
            this.nextTournamentId = this.getNextId('tournament');
        }
        
        this.saveToStorage('players', this.players);
        this.saveToStorage('tournaments', this.tournaments);
        
        return true;
    }
    
    // Получение статистики для профиля
    getPlayerStats(playerId) {
        const player = this.findPlayerById(playerId);
        if (!player) return null;
        
        const rank = this.getPlayerRank(playerId);
        const upcomingTournaments = this.tournaments.filter(
            t => t.registeredPlayers.includes(playerId) && !t.finished
        );
        
        return {
            ...player,
            rank,
            upcomingTournaments,
            totalPrizeMoney: 0 // Можно добавить расчет призовых
        };
    }
}

// Глобальный инстанс
const dataManager = new DataManager();