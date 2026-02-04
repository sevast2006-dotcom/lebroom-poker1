// admin/admin.js
// Админ-панель для LEBROOM Poker Club с API

const API_BASE = 'https://ваш-хостинг-с-php.ru/api';
const ADMIN_API_KEY = 'admin_secret_key_2024';

class AdminManager {
    constructor() {
        this.players = [];
        this.tournaments = [];
        this.registrations = [];
        this.isLoaded = false;
    }
    
    async loadData() {
        try {
            const response = await fetch(`${API_BASE}/get-data.php?api_key=${ADMIN_API_KEY}`, {
                headers: {
                    'X-API-Key': ADMIN_API_KEY
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.players = data.players;
                this.tournaments = data.tournaments;
                this.registrations = data.registrations;
                this.isLoaded = true;
                return true;
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            return false;
        }
    }
    
    async saveAllData() {
        try {
            const data = {
                players: this.players,
                tournaments: this.tournaments
            };
            
            const response = await fetch(`${API_BASE}/save-data.php?api_key=${ADMIN_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': ADMIN_API_KEY
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            return { success: false, error: error.message };
        }
    }
    
    async addPlayer(playerData) {
        playerData.id = this.getNextId('player');
        this.players.push(playerData);
        return await this.saveAllData();
    }
    
    async updatePlayer(playerId, updates) {
        const index = this.players.findIndex(p => p.id === playerId);
        if (index !== -1) {
            this.players[index] = { ...this.players[index], ...updates };
            return await this.saveAllData();
        }
        return { success: false, error: 'Player not found' };
    }
    
    async deletePlayer(playerId) {
        this.players = this.players.filter(p => p.id !== playerId);
        // Также удаляем регистрации игрока
        this.registrations = this.registrations.filter(r => r.player_id !== playerId);
        return await this.saveAllData();
    }
    
    async addTournament(tournamentData) {
        tournamentData.id = this.getNextId('tournament');
        tournamentData.registered_players = '';
        tournamentData.registered_count = 0;
        tournamentData.finished = 0;
        this.tournaments.push(tournamentData);
        return await this.saveAllData();
    }
    
    async updateTournament(tournamentId, updates) {
        const index = this.tournaments.findIndex(t => t.id === tournamentId);
        if (index !== -1) {
            this.tournaments[index] = { ...this.tournaments[index], ...updates };
            return await this.saveAllData();
        }
        return { success: false, error: 'Tournament not found' };
    }
    
    async deleteTournament(tournamentId) {
        this.tournaments = this.tournaments.filter(t => t.id !== tournamentId);
        this.registrations = this.registrations.filter(r => r.tournament_id !== tournamentId);
        return await this.saveAllData();
    }
    
    async finishTournament(tournamentId, results) {
        try {
            const response = await fetch(`${API_BASE}/finish-tournament.php?api_key=${ADMIN_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': ADMIN_API_KEY
                },
                body: JSON.stringify({
                    tournament_id: tournamentId,
                    results: results
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Обновляем локальные данные
                await this.loadData();
            }
            
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    getNextId(type) {
        if (type === 'player') {
            return this.players.length > 0 ? Math.max(...this.players.map(p => p.id)) + 1 : 1;
        } else {
            return this.tournaments.length > 0 ? Math.max(...this.tournaments.map(t => t.id)) + 1 : 1;
        }
    }
}

// Инициализация
const adminManager = new AdminManager();

// Функции для админ-панели
async function loadAdminData() {
    const success = await adminManager.loadData();
    if (success) {
        loadPlayersTable();
        loadTournamentsTable();
        updateStats();
    }
}