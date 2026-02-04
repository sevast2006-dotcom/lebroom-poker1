// data-manager.js
// Менеджер данных для LEBROOM Poker Club с API

class DataManager {
    constructor() {
        this.players = [];
        this.tournaments = [];
        this.registrations = [];
        this.isLoaded = false;
        this.loadingPromise = null;
        
        // Настройки API
        this.apiBase = 'https://ваш-хостинг-с-php.ru/api';
        this.apiKey = 'lebroom_secret_key_2024';
        this.adminApiKey = 'admin_secret_key_2024';
        
        // Локальное кэширование
        this.cacheKey = 'lebroom_cache';
        this.cacheExpiry = 2 * 60 * 1000; // 2 минуты
        
        this.loadData();
    }
    
    async loadData() {
        if (this.isLoaded) return;
        
        if (!this.loadingPromise) {
            this.loadingPromise = this.fetchFromAPI();
        }
        
        return this.loadingPromise;
    }
    
    async fetchFromAPI() {
        try {
            // Пробуем загрузить из кэша
            const cached = this.loadFromCache();
            if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
                this.players = cached.players;
                this.tournaments = cached.tournaments;
                this.registrations = cached.registrations;
                this.isLoaded = true;
                console.log('Данные загружены из кэша');
                return;
            }
            
            console.log('Загрузка данных с сервера...');
            
            const response = await fetch(`${this.apiBase}/get-data.php?api_key=${this.apiKey}`, {
                headers: {
                    'X-API-Key': this.apiKey
                }
            });
            
            if (!response.ok) {
                throw new Error(`Ошибка сервера: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Ошибка загрузки данных');
            }
            
            this.players = data.players || [];
            this.tournaments = data.tournaments || [];
            this.registrations = data.registrations || [];
            this.isLoaded = true;
            
            // Сохраняем в кэш
            this.saveToCache();
            
            console.log('Данные успешно загружены с сервера');
            
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            // Загружаем из кэша даже если истек срок
            const cached = this.loadFromCache();
            if (cached) {
                this.players = cached.players;
                this.tournaments = cached.tournaments;
                this.registrations = cached.registrations;
                this.isLoaded = true;
                console.log('Используем устаревшие данные из кэша');
            }
        }
    }
    
    loadFromCache() {
        try {
            const cached = localStorage.getItem(this.cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
        } catch (error) {
            console.error('Ошибка загрузки из кэша:', error);
        }
        return null;
    }
    
    saveToCache() {
        try {
            const cache = {
                players: this.players,
                tournaments: this.tournaments,
                registrations: this.registrations,
                timestamp: Date.now()
            };
            localStorage.setItem(this.cacheKey, JSON.stringify(cache));
        } catch (error) {
            console.error('Ошибка сохранения в кэш:', error);
        }
    }
    
    async saveAllData() {
        try {
            const data = {
                players: this.players,
                tournaments: this.tournaments
            };
            
            const response = await fetch(`${this.apiBase}/save-data.php?api_key=${this.adminApiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.adminApiKey
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`Ошибка сервера: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Ошибка сохранения');
            }
            
            // Очищаем кэш
            localStorage.removeItem(this.cacheKey);
            this.isLoaded = false;
            
            return { success: true, message: result.message };
            
        } catch (error) {
            console.error('Ошибка сохранения данных:', error);
            return { success: false, error: error.message };
        }
    }
    
    async registerPlayerForTournament(playerId, tournamentId) {
        try {
            const response = await fetch(`${this.apiBase}/register-player.php?api_key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.apiKey
                },
                body: JSON.stringify({
                    player_id: playerId,
                    tournament_id: tournamentId
                })
            });
            
            const result = await response.json();
            
            if (!result.success) {
                return { success: false, message: result.error };
            }
            
            // Очищаем кэш для обновления данных
            localStorage.removeItem(this.cacheKey);
            this.isLoaded = false;
            
            return { 
                success: true, 
                message: result.message,
                position: result.position
            };
            
        } catch (error) {
            console.error('Ошибка записи на турнир:', error);
            return { success: false, message: error.message };
        }
    }
    
    async finishTournament(tournamentId, results) {
        try {
            const response = await fetch(`${this.apiBase}/finish-tournament.php?api_key=${this.adminApiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.adminApiKey
                },
                body: JSON.stringify({
                    tournament_id: tournamentId,
                    results: results
                })
            });
            
            const result = await response.json();
            
            if (!result.success) {
                return { success: false, message: result.error };
            }
            
            // Очищаем кэш
            localStorage.removeItem(this.cacheKey);
            this.isLoaded = false;
            
            return { success: true, message: result.message };
            
        } catch (error) {
            console.error('Ошибка завершения турнира:', error);
            return { success: false, message: error.message };
        }
    }
    
    // Остальные методы остаются такими же, как были...
    
    findPlayerByTelegramId(telegramId) {
        return this.players.find(p => p.telegram_id === telegramId);
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
    
    getCurrentTournament() {
        const now = new Date();
        const activeTournaments = this.tournaments.filter(t => 
            t.status === 'active' || t.status === 'upcoming'
        );
        
        if (activeTournaments.length === 0) {
            return null;
        }
        
        return activeTournaments.sort((a, b) => {
            const dateA = this.parseDate(a.date, a.time);
            const dateB = this.parseDate(b.date, b.time);
            return dateA - dateB;
        })[0];
    }
    
    parseDate(dateStr, timeStr) {
        const [day, month] = (dateStr || '').split('.');
        const [hours, minutes] = (timeStr || '').split(':');
        
        const year = new Date().getFullYear();
        return new Date(year, parseInt(month) - 1, parseInt(day), 
                       parseInt(hours), parseInt(minutes));
    }
    
    getTotalPlayersCount() {
        return this.players.length;
    }
    
    getTotalTournamentsCount() {
        return this.tournaments.length;
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
    
    getPlayerStats(playerId) {
        const player = this.findPlayerById(playerId);
        if (!player) return null;
        
        const rank = this.getPlayerRank(playerId);
        const totalPlayers = this.getTotalPlayersCount();
        
        // Получаем записи игрока
        const playerRegistrations = this.registrations.filter(r => r.player_id === playerId);
        const upcomingTournaments = playerRegistrations
            .filter(r => {
                const tournament = this.tournaments.find(t => t.id === r.tournament_id);
                return tournament && tournament.status !== 'finished';
            })
            .map(r => {
                const tournament = this.tournaments.find(t => t.id === r.tournament_id);
                return { ...tournament, position: r.position };
            });
        
        return {
            ...player,
            rank,
            totalPlayers,
            upcomingTournaments,
            registrations: playerRegistrations
        };
    }
    
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