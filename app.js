// LEBROOM Poker Club - Telegram Mini App
// Обновленная версия без демо-данных

class LEBROOMApp {
    constructor() {
        this.tg = window.Telegram?.WebApp;
        this.userData = null;
        this.currentTournament = null;
        this.isRegistered = false;
        this.statsAnimated = false;
        this.userPlayerProfile = null;
        this.currentPage = 'main';
    }

    // Инициализация приложения
    init() {
        console.log('🎮 LEBROOM Poker App инициализируется...');
        
        // Инициализация Telegram Web App
        if (this.tg) {
            this.initTelegram();
        } else {
            console.log('⚠️ Работает вне Telegram, используется демо-режим');
            this.userData = {
                id: Math.floor(Math.random() * 1000000),
                first_name: 'Демо',
                last_name: 'Пользователь'
            };
            this.updateUserBadge();
        }
        
        // Загрузка данных
        this.loadTournamentData();
        this.loadRatingData();
        this.updateStatsCounter();
        
        // Настройка событий
        this.setupEventListeners();
        
        // Инициализация анимаций
        this.initAnimations();
        this.initIntersectionObserver();
        
        // Анимация счетчиков статистики
        this.initStatsCounter();
        
        // Показываем главную страницу
        this.showPage('main');
        
        console.log('✅ Приложение готово!');
    }

    // Инициализация Telegram Web App
    initTelegram() {
        try {
            this.tg.expand();
            this.tg.HapticFeedback.isSupported = true;
            this.userData = this.tg.initDataUnsafe?.user;
            
            if (this.userData) {
                this.updateUserBadge();
                this.checkAndCreatePlayerProfile();
                this.showNotification('Добро пожаловать в LEBROOM!', 'success');
            }
            
            this.setTelegramTheme();
            this.tg.BackButton.onClick(() => {
                if (this.currentPage !== 'main') {
                    this.loadPage('main');
                } else {
                    this.closeAllModals();
                }
            });
            
        } catch (error) {
            console.error('Ошибка инициализации Telegram:', error);
        }
    }

    // Проверка и создание профиля игрока
    checkAndCreatePlayerProfile() {
        if (!this.userData) return;
        
        let player = dataManager.findPlayerByTelegramId(this.userData.id);
        
        if (!player) {
            // Создаем нового игрока
            player = dataManager.addPlayer({
                name: `${this.userData.first_name || ''} ${this.userData.last_name || ''}`.trim(),
                telegramId: this.userData.id,
                telegramUsername: this.userData.username,
                points: 0,
                tournaments: 0,
                wins: 0,
                registeredTournaments: []
            });
        }
        
        this.userPlayerProfile = player;
        return player;
    }

    // Обновить бейдж пользователя
    updateUserBadge() {
        const userBadge = document.getElementById('userBadge');
        if (!userBadge || !this.userData) return;
        
        if (this.userData.first_name) {
            const initials = this.userData.first_name.charAt(0).toUpperCase();
            userBadge.innerHTML = `<span style="font-weight: 800; font-size: 18px;">${initials}</span>`;
            userBadge.title = `${this.userData.first_name} ${this.userData.last_name || ''}`;
        }
    }

    // Настроить тему Telegram
    setTelegramTheme() {
        if (!this.tg) return;
        
        const theme = this.tg.colorScheme;
        if (theme === 'dark') {
            document.body.style.backgroundColor = '#0A0A0F';
        } else {
            document.body.style.backgroundColor = '#0A0A0F';
        }
    }

    // Загрузка данных турнира
    async loadTournamentData() {
        try {
            // Используем DataManager
            this.currentTournament = dataManager.getCurrentTournament();
            
            if (this.currentTournament) {
                this.updateTournamentUI(this.currentTournament);
                
                // Проверяем запись пользователя
                if (this.userPlayerProfile) {
                    this.isRegistered = this.currentTournament.registeredPlayers &&
                                       this.currentTournament.registeredPlayers.includes(this.userPlayerProfile.id);
                    this.updateRegisterButton();
                }
            } else {
                // Нет активных турниров
                this.showEmptyTournamentState();
            }
            
        } catch (error) {
            console.log('Ошибка загрузки турнира:', error.message);
            this.showEmptyTournamentState();
        }
    }

    // Показать состояние без турниров
    showEmptyTournamentState() {
        document.getElementById('tournamentTitle').textContent = 'Турниров пока нет';
        document.getElementById('tournamentDate').textContent = 'Следите за анонсами';
        document.getElementById('tournamentSeats').textContent = '0';
        document.getElementById('tournamentBuyIn').textContent = '0 ₽';
        document.getElementById('tournamentPrize').textContent = '0 ₽';
        document.getElementById('registeredCount').textContent = '0';
        document.getElementById('totalSeats').textContent = '0';
        document.getElementById('progressFill').style.width = '0%';
        
        const registerBtn = document.getElementById('registerBtn');
        registerBtn.innerHTML = '<i class="fas fa-clock"></i> ОЖИДАНИЕ';
        registerBtn.disabled = true;
        registerBtn.style.background = 'rgba(255, 255, 255, 0.1)';
        registerBtn.classList.remove('glow-effect');
        registerBtn.onclick = null;
    }

    // Обновить UI турнира
    updateTournamentUI(data) {
        // Основные данные
        document.getElementById('tournamentTitle').textContent = data.title;
        document.getElementById('tournamentDate').textContent = `${data.date} / ${data.time}`;
        document.getElementById('tournamentSeats').textContent = data.totalSeats;
        document.getElementById('tournamentBuyIn').textContent = data.buyIn;
        document.getElementById('tournamentPrize').textContent = data.prizePool;
        document.getElementById('registeredCount').textContent = data.registeredCount || 0;
        document.getElementById('totalSeats').textContent = data.totalSeats;
        
        // Прогресс с анимацией
        const progress = ((data.registeredCount || 0) / data.totalSeats) * 100;
        const progressFill = document.getElementById('progressFill');
        progressFill.style.width = `${progress}%`;
        
        // Анимация прогресс-бара
        this.animateProgress(progressFill, progress);
        
        // Модальное окно
        document.getElementById('modalTournamentName').textContent = data.title;
        document.getElementById('modalTournamentDate').textContent = `${data.date} в ${data.time}`;
        document.getElementById('modalTournamentBuyIn').textContent = data.buyIn;
        document.getElementById('modalFreeSeats').textContent = data.totalSeats - (data.registeredCount || 0);
        
        // Успешная запись
        document.getElementById('successDate').textContent = data.date;
        document.getElementById('successTime').textContent = data.time;
    }

    // Обновить статистику в счетчиках
    updateStatsCounter() {
        const stats = dataManager.getClubStats();
        
        // Обновляем счетчики
        const playerCounter = document.querySelector('[data-count]');
        if (playerCounter) {
            playerCounter.setAttribute('data-count', stats.totalPlayers);
        }
        
        // Обновляем значения счетчиков сразу
        document.querySelectorAll('.stat-number').forEach((counter, index) => {
            const values = [stats.totalPlayers, stats.totalTournaments, 0]; // 0 для столов
            counter.textContent = values[index] || 0;
        });
    }

    // Анимация прогресс-бара
    animateProgress(element, targetProgress) {
        element.style.transition = 'width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
        
        // Небольшая задержка для эффекта
        setTimeout(() => {
            element.style.width = `${targetProgress}%`;
        }, 300);
    }

    // Загрузка рейтинга
    async loadRatingData() {
        try {
            // Используем DataManager
            dataManager.sortPlayersByPoints();
            const players = dataManager.players.slice(0, 5); // Только топ-5 для главной
            
            this.updateRatingUIPreview(players);
            this.updateRatingUIFull(); // Загружаем полный рейтинг тоже
            
        } catch (error) {
            console.log('Ошибка загрузки рейтинга:', error.message);
            this.updateRatingUIPreview([]);
        }
    }

    // Обновить UI рейтинга для главной (превью)
    updateRatingUIPreview(players) {
        const ratingList = document.getElementById('ratingListPreview');
        if (!ratingList) return;
        
        if (players.length === 0) {
            ratingList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #94a3b8;">
                    <i class="fas fa-chart-line" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                    <p style="font-size: 14px; margin-bottom: 8px;">Рейтинг пока пуст</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        players.forEach((player, index) => {
            const medal = this.getMedalEmoji(index + 1);
            html += `
                <div class="rating-item" style="animation-delay: ${index * 0.1}s">
                    <div class="rank">${index + 1}</div>
                    <div class="player-info">
                        <div class="player-name">${player.name}</div>
                        <div class="player-stats">
                            <span class="points">${player.points.toLocaleString()} очков</span>
                        </div>
                    </div>
                    <div class="medal">${medal}</div>
                </div>
            `;
        });
        
        ratingList.innerHTML = html;
    }

    // Обновить полный рейтинг
    updateRatingUIFull() {
        const ratingList = document.getElementById('ratingListFull');
        if (!ratingList) return;
        
        const players = dataManager.players;
        
        if (players.length === 0) {
            ratingList.innerHTML = `
                <div style="text-align: center; padding: 60px; color: #94a3b8;">
                    <i class="fas fa-chart-line" style="font-size: 64px; margin-bottom: 20px; opacity: 0.5;"></i>
                    <p style="font-size: 16px; margin-bottom: 10px;">Рейтинг пока пуст</p>
                    <p style="font-size: 14px; opacity: 0.7;">Станьте первым участником турнира!</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        players.forEach((player, index) => {
            const medal = this.getMedalEmoji(index + 1);
            const isCurrentUser = this.userPlayerProfile && player.id === this.userPlayerProfile.id;
            
            html += `
                <div class="rating-item ${isCurrentUser ? 'current-user' : ''}" style="animation-delay: ${index * 0.05}s">
                    <div class="rank">${index + 1}</div>
                    <div class="player-info">
                        <div class="player-name">
                            ${player.name}
                            ${isCurrentUser ? '<span class="you-badge">Вы</span>' : ''}
                        </div>
                        <div class="player-stats">
                            <span class="points">${player.points.toLocaleString()} очков</span>
                            <span class="tournaments">${player.tournaments} турниров</span>
                            <span class="wins">${player.wins} побед</span>
                        </div>
                    </div>
                    <div class="medal">${medal}</div>
                </div>
            `;
        });
        
        ratingList.innerHTML = html;
    }

    // Фильтрация рейтинга
    filterRating(filterType) {
        const buttons = document.querySelectorAll('.filter-btn');
        buttons.forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        
        const players = dataManager.players;
        let filteredPlayers = [...players];
        
        switch(filterType) {
            case 'top':
                filteredPlayers = players.slice(0, 10);
                break;
            case 'month':
                // Здесь можно добавить логику фильтрации по месяцу
                filteredPlayers = players.slice(0, 20);
                break;
        }
        
        this.updateRatingList(filteredPlayers);
    }

    // Поиск игрока в рейтинге
    searchPlayer() {
        const searchTerm = document.getElementById('ratingSearch').value.toLowerCase();
        const players = dataManager.players;
        
        if (!searchTerm) {
            this.updateRatingUIFull();
            return;
        }
        
        const filteredPlayers = players.filter(player => 
            player.name.toLowerCase().includes(searchTerm)
        );
        
        this.updateRatingList(filteredPlayers);
    }

    // Обновить список рейтинга
    updateRatingList(players) {
        const ratingList = document.getElementById('ratingListFull');
        if (!ratingList) return;
        
        if (players.length === 0) {
            ratingList.innerHTML = `
                <div style="text-align: center; padding: 60px; color: #94a3b8;">
                    <i class="fas fa-search" style="font-size: 48px; margin-bottom: 20px; opacity: 0.5;"></i>
                    <p style="font-size: 16px; margin-bottom: 10px;">Игроки не найдены</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        players.forEach((player, index) => {
            const medal = this.getMedalEmoji(index + 1);
            const isCurrentUser = this.userPlayerProfile && player.id === this.userPlayerProfile.id;
            
            html += `
                <div class="rating-item ${isCurrentUser ? 'current-user' : ''}">
                    <div class="rank">${index + 1}</div>
                    <div class="player-info">
                        <div class="player-name">
                            ${player.name}
                            ${isCurrentUser ? '<span class="you-badge">Вы</span>' : ''}
                        </div>
                        <div class="player-stats">
                            <span class="points">${player.points.toLocaleString()} очков</span>
                            <span class="tournaments">${player.tournaments} турниров</span>
                            <span class="wins">${player.wins} побед</span>
                        </div>
                    </div>
                    <div class="medal">${medal}</div>
                </div>
            `;
        });
        
        ratingList.innerHTML = html;
    }

    // Загрузка списка турниров
    async loadTournamentsList() {
        const tournamentsList = document.getElementById('tournamentsList');
        const emptyState = document.getElementById('emptyTournaments');
        
        if (!tournamentsList) return;
        
        const tournaments = dataManager.tournaments;
        
        if (tournaments.length === 0) {
            tournamentsList.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        tournamentsList.style.display = 'block';
        
        // Сортируем турниры: активные -> будущие -> завершенные
        const sortedTournaments = [...tournaments].sort((a, b) => {
            const statusOrder = { 'active': 1, 'upcoming': 2, 'finished': 3 };
            return statusOrder[a.status] - statusOrder[b.status];
        });
        
        let html = '';
        
        sortedTournaments.forEach(tournament => {
            const isRegistered = this.userPlayerProfile && 
                                tournament.registeredPlayers &&
                                tournament.registeredPlayers.includes(this.userPlayerProfile.id);
            const isActive = tournament.status === 'active';
            const isFinished = tournament.status === 'finished';
            
            html += `
                <div class="tournament-list-item ${isActive ? 'active' : ''} ${isFinished ? 'finished' : ''}">
                    <div class="tournament-list-header">
                        <div class="tournament-list-badge ${isActive ? 'active-badge' : isFinished ? 'inactive-badge' : 'upcoming-badge'}">
                            ${isActive ? 'АКТИВЕН' : isFinished ? 'ЗАВЕРШЕН' : 'СКОРО'}
                        </div>
                        <div class="tournament-list-date">
                            <i class="far fa-calendar"></i> ${tournament.date} ${tournament.time}
                        </div>
                    </div>
                    
                    <h4 class="tournament-list-title">${tournament.title}</h4>
                    
                    <div class="tournament-list-info">
                        <div class="tournament-list-stat">
                            <i class="fas fa-users"></i>
                            <span>${tournament.registeredCount || 0}/${tournament.totalSeats || 0}</span>
                        </div>
                        <div class="tournament-list-stat">
                            <i class="fas fa-coins"></i>
                            <span>${tournament.buyIn}</span>
                        </div>
                        <div class="tournament-list-stat">
                            <i class="fas fa-award"></i>
                            <span>${tournament.prizePool}</span>
                        </div>
                    </div>
                    
                    <div class="tournament-list-actions">
                        ${isActive ? `
                            ${isRegistered ? 
                                `<button class="btn-secondary" disabled>
                                    <i class="fas fa-check"></i> Вы записаны
                                </button>` : 
                                `<button class="btn-primary" onclick="app.registerForSpecificTournament(${tournament.id})">
                                    <i class="fas fa-user-plus"></i> Записаться
                                </button>`
                            }
                            <button class="btn-secondary" onclick="app.showTournamentDetails(${tournament.id})">
                                <i class="fas fa-info-circle"></i> Подробнее
                            </button>
                        ` : isFinished ? `
                            <button class="btn-secondary" onclick="app.showTournamentResults(${tournament.id})">
                                <i class="fas fa-chart-bar"></i> Результаты
                            </button>
                        ` : `
                            <button class="btn-secondary" disabled>
                                <i class="fas fa-clock"></i> Скоро
                            </button>
                        `}
                    </div>
                </div>
            `;
        });
        
        tournamentsList.innerHTML = html;
    }

    // Фильтрация турниров
    filterTournaments(filterType) {
        const buttons = document.querySelectorAll('.filter-btn');
        buttons.forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        
        const tournamentsList = document.getElementById('tournamentsList');
        const tournaments = dataManager.tournaments;
        
        let filteredTournaments = [...tournaments];
        
        switch(filterType) {
            case 'upcoming':
                filteredTournaments = tournaments.filter(t => t.status === 'upcoming');
                break;
            case 'active':
                filteredTournaments = tournaments.filter(t => t.status === 'active');
                break;
            case 'finished':
                filteredTournaments = tournaments.filter(t => t.status === 'finished');
                break;
            case 'my':
                if (this.userPlayerProfile) {
                    filteredTournaments = tournaments.filter(t => 
                        t.registeredPlayers && 
                        t.registeredPlayers.includes(this.userPlayerProfile.id)
                    );
                } else {
                    filteredTournaments = [];
                }
                break;
        }
        
        this.displayFilteredTournaments(filteredTournaments);
    }

    // Отображение отфильтрованных турниров
    displayFilteredTournaments(tournaments) {
        const tournamentsList = document.getElementById('tournamentsList');
        const emptyState = document.getElementById('emptyTournaments');
        
        if (tournaments.length === 0) {
            tournamentsList.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        tournamentsList.style.display = 'block';
        
        let html = '';
        
        tournaments.forEach(tournament => {
            const isRegistered = this.userPlayerProfile && 
                                tournament.registeredPlayers &&
                                tournament.registeredPlayers.includes(this.userPlayerProfile.id);
            const isActive = tournament.status === 'active';
            const isFinished = tournament.status === 'finished';
            
            html += `
                <div class="tournament-list-item ${isActive ? 'active' : ''} ${isFinished ? 'finished' : ''}">
                    <div class="tournament-list-header">
                        <div class="tournament-list-badge ${isActive ? 'active-badge' : isFinished ? 'inactive-badge' : 'upcoming-badge'}">
                            ${isActive ? 'АКТИВЕН' : isFinished ? 'ЗАВЕРШЕН' : 'СКОРО'}
                        </div>
                        <div class="tournament-list-date">
                            <i class="far fa-calendar"></i> ${tournament.date} ${tournament.time}
                        </div>
                    </div>
                    
                    <h4 class="tournament-list-title">${tournament.title}</h4>
                    
                    <div class="tournament-list-info">
                        <div class="tournament-list-stat">
                            <i class="fas fa-users"></i>
                            <span>${tournament.registeredCount || 0}/${tournament.totalSeats || 0}</span>
                        </div>
                        <div class="tournament-list-stat">
                            <i class="fas fa-coins"></i>
                            <span>${tournament.buyIn}</span>
                        </div>
                        <div class="tournament-list-stat">
                            <i class="fas fa-award"></i>
                            <span>${tournament.prizePool}</span>
                        </div>
                    </div>
                    
                    <div class="tournament-list-actions">
                        ${isActive ? `
                            ${isRegistered ? 
                                `<button class="btn-secondary" disabled>
                                    <i class="fas fa-check"></i> Вы записаны
                                </button>` : 
                                `<button class="btn-primary" onclick="app.registerForSpecificTournament(${tournament.id})">
                                    <i class="fas fa-user-plus"></i> Записаться
                                </button>`
                            }
                            <button class="btn-secondary" onclick="app.showTournamentDetails(${tournament.id})">
                                <i class="fas fa-info-circle"></i> Подробнее
                            </button>
                        ` : isFinished ? `
                            <button class="btn-secondary" onclick="app.showTournamentResults(${tournament.id})">
                                <i class="fas fa-chart-bar"></i> Результаты
                            </button>
                        ` : `
                            <button class="btn-secondary" disabled>
                                <i class="fas fa-clock"></i> Скоро
                            </button>
                        `}
                    </div>
                </div>
            `;
        });
        
        tournamentsList.innerHTML = html;
    }

    // Показать детали турнира
    showTournamentDetails(tournamentId) {
        const tournament = dataManager.tournaments.find(t => t.id === tournamentId);
        if (!tournament) return;
        
        let details = `🎯 <strong>${tournament.title}</strong>\n`;
        details += `📅 <strong>Дата:</strong> ${tournament.date} ${tournament.time}\n`;
        details += `👥 <strong>Мест:</strong> ${tournament.registeredCount || 0}/${tournament.totalSeats}\n`;
        details += `💰 <strong>Бай-ин:</strong> ${tournament.buyIn}\n`;
        details += `🏆 <strong>Призовой фонд:</strong> ${tournament.prizePool}\n`;
        details += `📊 <strong>Статус:</strong> ${tournament.status === 'active' ? 'Активен' : tournament.status === 'finished' ? 'Завершен' : 'Будущий'}\n`;
        
        if (tournament.description) {
            details += `📝 <strong>Описание:</strong> ${tournament.description}\n`;
        }
        
        if (this.tg) {
            this.tg.showAlert(details);
        } else {
            alert(details);
        }
    }

    // Запись на конкретный турнир
    registerForSpecificTournament(tournamentId) {
        if (!this.userData?.id) {
            this.showNotification('Войдите через Telegram для записи', 'warning');
            return;
        }
        
        if (!this.userPlayerProfile) {
            this.userPlayerProfile = this.checkAndCreatePlayerProfile();
        }
        
        const result = dataManager.registerPlayerForTournament(
            this.userPlayerProfile.id,
            tournamentId
        );
        
        if (result.success) {
            this.showNotification(`Вы записаны на турнир! Ваш номер: #${result.position}`, 'success');
            this.loadTournamentsList();
            this.loadTournamentData(); // Обновляем главный турнир
        } else {
            this.showNotification(result.message, 'error');
        }
    }

    // Запись на текущий турнир
    async registerForTournament() {
        if (!this.userData?.id) {
            this.showNotification('Войдите через Telegram для записи', 'warning');
            return;
        }
        
        if (!this.currentTournament) {
            this.showNotification('Нет активных турниров', 'error');
            return;
        }
        
        if (!this.userPlayerProfile) {
            this.userPlayerProfile = this.checkAndCreatePlayerProfile();
        }
        
        try {
            const confirmBtn = document.getElementById('confirmRegisterBtn');
            const originalText = confirmBtn.innerHTML;
            confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ЗАПИСЬ...';
            confirmBtn.disabled = true;
            
            const result = dataManager.registerPlayerForTournament(
                this.userPlayerProfile.id,
                this.currentTournament.id
            );
            
            if (!result.success) {
                throw new Error(result.message);
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.isRegistered = true;
            this.updateRegisterButton();
            
            this.currentTournament = dataManager.getCurrentTournament();
            this.updateTournamentUI(this.currentTournament);
            
            document.getElementById('successPosition').textContent = `#${result.position}`;
            document.getElementById('successMessage').textContent = result.message;
            
            this.closeModalWithAnimation('registerModal');
            setTimeout(() => this.openModalWithAnimation('successModal'), 300);
            
            if (this.tg?.sendData) {
                this.tg.sendData(JSON.stringify({
                    action: 'tournament_registered',
                    userId: this.userData.id,
                    tournamentId: this.currentTournament.id,
                    position: result.position
                }));
            }
            
            if (this.tg?.HapticFeedback) {
                this.tg.HapticFeedback.notificationOccurred('success');
            }
            
            this.showNotification('🎉 Вы успешно записались на турнир!', 'success');
            
        } catch (error) {
            console.error('Ошибка записи:', error);
            this.showNotification(error.message || 'Ошибка при записи. Попробуйте позже.', 'error');
            
            if (this.tg?.HapticFeedback) {
                this.tg.HapticFeedback.notificationOccurred('error');
            }
            
        } finally {
            const confirmBtn = document.getElementById('confirmRegisterBtn');
            confirmBtn.innerHTML = '<i class="fas fa-check"></i> ПОДТВЕРДИТЬ ЗАПИСЬ';
            confirmBtn.disabled = false;
        }
    }

    // Обновить кнопку записи
    updateRegisterButton() {
        const registerBtn = document.getElementById('registerBtn');
        if (!registerBtn) return;
        
        if (this.isRegistered) {
            registerBtn.innerHTML = '<i class="fas fa-check"></i> ВЫ ЗАПИСАНЫ';
            registerBtn.style.background = 'linear-gradient(135deg, #10b981, #34d399)';
            registerBtn.disabled = true;
            registerBtn.classList.remove('glow-effect');
            registerBtn.onclick = null;
        } else {
            registerBtn.innerHTML = '<i class="fas fa-user-plus"></i> ЗАПИСАТЬСЯ';
            registerBtn.style.background = 'linear-gradient(135deg, #FF4757, #FF3838)';
            registerBtn.disabled = false;
            registerBtn.classList.add('glow-effect');
            registerBtn.onclick = () => this.openModalWithAnimation('registerModal');
        }
    }

    // Настройка обработчиков событий
    setupEventListeners() {
        // Кнопка записи
        const registerBtn = document.getElementById('registerBtn');
        if (registerBtn) {
            registerBtn.addEventListener('click', () => {
                if (this.currentTournament) {
                    this.openModalWithAnimation('registerModal');
                } else {
                    this.showNotification('Нет активных турниров для записи', 'warning');
                }
            });
        }
        
        // Подтверждение записи
        const confirmBtn = document.getElementById('confirmRegisterBtn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                this.registerForTournament();
            });
        }
        
        // Кнопка поддержки
        const supportBtn = document.getElementById('supportBtn');
        if (supportBtn) {
            supportBtn.addEventListener('click', () => {
                if (this.tg) {
                    this.tg.openTelegramLink('https://t.me/lebroomsupport');
                } else {
                    window.open('https://t.me/lebroomsupport', '_blank');
                }
            });
        }
        
        // Кнопка информации о клубе
        const clubInfoBtn = document.getElementById('clubInfoBtn');
        if (clubInfoBtn) {
            clubInfoBtn.addEventListener('click', () => {
                this.openModalWithAnimation('clubInfoModal');
            });
        }
        
        // Кнопка Q&A
        const qaBtn = document.getElementById('qaBtn');
        if (qaBtn) {
            qaBtn.addEventListener('click', () => {
                this.openModalWithAnimation('qaModal');
            });
        }
        
        // Кнопка профиля на главной
        const myProfileBtn = document.getElementById('myProfileBtn');
        if (myProfileBtn) {
            myProfileBtn.addEventListener('click', () => {
                if (this.userData) {
                    this.showProfileModal();
                } else {
                    this.showNotification('Войдите через Telegram для доступа к профилю', 'warning');
                }
            });
        }
        
        // Кнопка подробнее о турнире
        const detailsBtn = document.getElementById('detailsBtn');
        if (detailsBtn) {
            detailsBtn.addEventListener('click', () => {
                if (this.currentTournament) {
                    if (this.tg) {
                        this.tg.showAlert(`🎯 ${this.currentTournament.title}\n📅 ${this.currentTournament.date}\n⏰ ${this.currentTournament.time}\n💰 ${this.currentTournament.buyIn}\n🏆 ${this.currentTournament.prizePool}`);
                    } else {
                        alert(`🎯 ${this.currentTournament.title}\n📅 ${this.currentTournament.date}\n⏰ ${this.currentTournament.time}\n💰 ${this.currentTournament.buyIn}\n🏆 ${this.currentTournament.prizePool}`);
                    }
                } else {
                    this.showNotification('Нет информации о турнире', 'warning');
                }
            });
        }
        
        // Обработка клавиши ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
        
        // Ресайз окна
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    // Показать страницу
    showPage(pageId) {
        // Скрываем все страницы
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        // Показываем выбранную страницу
        const page = document.getElementById(`page-${pageId}`);
        if (page) {
            page.classList.add('active');
        }
        
        // Обновляем навигацию
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-page') === pageId) {
                item.classList.add('active');
            }
        });
        
        // Обновляем текущую страницу
        this.currentPage = pageId;
        
        // Обновляем кнопку "Назад" в Telegram
        if (this.tg?.BackButton) {
            if (pageId === 'main') {
                this.tg.BackButton.hide();
            } else {
                this.tg.BackButton.show();
            }
        }
        
        // Загружаем данные для страницы
        this.loadPageData(pageId);
    }

    // Загрузка данных для страницы
    loadPageData(pageId) {
        switch(pageId) {
            case 'main':
                // Обновляем данные
                this.loadTournamentData();
                this.loadRatingData();
                this.updateStatsCounter();
                break;
                
            case 'rating':
                this.updateRatingUIFull();
                break;
                
            case 'tournaments':
                this.loadTournamentsList();
                break;
                
            case 'profile':
                this.loadProfilePage();
                break;
        }
    }

    // Загрузка страницы профиля
    loadProfilePage() {
        const profileContent = document.getElementById('profileContent');
        if (!profileContent) return;
        
        if (!this.userPlayerProfile) {
            profileContent.innerHTML = `
                <div style="text-align: center; padding: 60px 20px;">
                    <div class="profile-icon" style="
                        font-size: 80px;
                        color: var(--text-secondary);
                        margin-bottom: 20px;
                        opacity: 0.5;
                    ">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <h3 style="color: var(--text-primary); margin-bottom: 16px;">
                        Профиль не найден
                    </h3>
                    <p style="color: var(--text-secondary); margin-bottom: 24px;">
                        Войдите через Telegram для доступа к профилю
                    </p>
                </div>
            `;
            return;
        }
        
        const stats = dataManager.getPlayerStats(this.userPlayerProfile.id);
        const rank = stats?.rank || 'Н/Д';
        const totalPlayers = stats?.totalPlayers || 0;
        
        profileContent.innerHTML = `
            <div class="profile-page-content">
                <!-- Аватар и основная информация -->
                <div class="profile-header">
                    <div class="profile-avatar-large">
                        ${this.userData.first_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div class="profile-info">
                        <h3>${this.userPlayerProfile.name}</h3>
                        ${this.userPlayerProfile.telegramUsername ? 
                            `<p class="profile-username">@${this.userPlayerProfile.telegramUsername}</p>` : ''}
                        <div class="profile-rank">
                            <i class="fas fa-medal"></i>
                            <span>Место в рейтинге: <strong>${rank}</strong> из ${totalPlayers}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Основная статистика -->
                <div class="profile-stats-grid">
                    <div class="profile-stat-card">
                        <div class="stat-number">${this.userPlayerProfile.tournaments || 0}</div>
                        <div class="stat-label">Турниров</div>
                    </div>
                    <div class="profile-stat-card">
                        <div class="stat-number">${this.userPlayerProfile.points || 0}</div>
                        <div class="stat-label">Очков</div>
                    </div>
                    <div class="profile-stat-card">
                        <div class="stat-number">${this.userPlayerProfile.wins || 0}</div>
                        <div class="stat-label">Побед</div>
                    </div>
                    <div class="profile-stat-card">
                        <div class="stat-number">${this.userPlayerProfile.tournaments ? Math.round((this.userPlayerProfile.wins || 0) / this.userPlayerProfile.tournaments * 100) : 0}%</div>
                        <div class="stat-label">Win Rate</div>
                    </div>
                </div>
                
                <!-- Активные записи на турниры -->
                ${stats.upcomingTournaments && stats.upcomingTournaments.length > 0 ? `
                    <div class="profile-section">
                        <h4><i class="fas fa-calendar-check"></i> Мои турниры</h4>
                        <div class="registered-tournaments">
                            ${stats.upcomingTournaments.map(tournament => {
                                return `
                                    <div class="registered-tournament">
                                        <div class="tournament-name">${tournament.title}</div>
                                        <div class="tournament-date">${tournament.date} ${tournament.time}</div>
                                        <div class="tournament-status ${tournament.status === 'active' ? 'active' : ''}">
                                            ${tournament.status === 'active' ? 'Активен' : 'Скоро'}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <!-- История турниров -->
                <div class="profile-section">
                    <h4><i class="fas fa-history"></i> История выступлений</h4>
                    <div class="tournament-history">
                        ${this.userPlayerProfile.tournaments > 0 ? `
                            <p>Вы участвовали в ${this.userPlayerProfile.tournaments} турнирах</p>
                            <p>Лучшее место в рейтинге: ${rank}</p>
                            <p>Всего очков: ${this.userPlayerProfile.points}</p>
                            <p>Побед: ${this.userPlayerProfile.wins}</p>
                        ` : `
                            <p class="empty-history">Вы еще не участвовали в турнирах</p>
                        `}
                    </div>
                </div>
            </div>
            
            <style>
                .profile-page-content {
                    padding: 20px;
                }
                
                .profile-header {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    margin-bottom: 30px;
                    padding: 24px;
                    background: var(--bg-card);
                    border-radius: 20px;
                    border: 1px solid rgba(255, 215, 0, 0.1);
                }
                
                .profile-avatar-large {
                    width: 80px;
                    height: 80px;
                    background: linear-gradient(135deg, var(--accent-gold), var(--accent-red));
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 36px;
                    color: var(--bg-primary);
                    font-weight: 900;
                    border: 4px solid var(--accent-gold);
                    box-shadow: var(--shadow-glow);
                }
                
                .profile-info h3 {
                    font-size: 24px;
                    margin-bottom: 8px;
                    color: var(--text-primary);
                }
                
                .profile-username {
                    color: var(--accent-cyan);
                    margin-bottom: 12px;
                    font-size: 16px;
                }
                
                .profile-rank {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: var(--text-secondary);
                }
                
                .profile-rank i {
                    color: var(--accent-gold);
                }
                
                .profile-rank strong {
                    color: var(--accent-gold);
                    font-size: 20px;
                }
                
                .profile-stats-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 16px;
                    margin-bottom: 30px;
                }
                
                .profile-stat-card {
                    background: var(--bg-card);
                    border-radius: 16px;
                    padding: 24px;
                    text-align: center;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .profile-stat-card .stat-number {
                    font-size: 32px;
                    font-weight: 900;
                    color: var(--accent-gold);
                    margin-bottom: 8px;
                    font-family: 'Montserrat', sans-serif;
                }
                
                .profile-stat-card .stat-label {
                    font-size: 14px;
                    color: var(--text-secondary);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                
                .profile-section {
                    background: var(--bg-card);
                    border-radius: 16px;
                    padding: 24px;
                    margin-bottom: 20px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .profile-section h4 {
                    color: var(--accent-gold);
                    margin-bottom: 20px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 18px;
                }
                
                .registered-tournaments {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                
                .registered-tournament {
                    background: rgba(255, 255, 255, 0.05);
                    padding: 16px;
                    border-radius: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .tournament-name {
                    font-weight: 600;
                    margin-bottom: 4px;
                    color: var(--text-primary);
                }
                
                .tournament-date {
                    font-size: 14px;
                    color: var(--text-secondary);
                    margin-bottom: 8px;
                }
                
                .tournament-status {
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                    background: rgba(16, 185, 129, 0.1);
                    color: #10b981;
                    border: 1px solid rgba(16, 185, 129, 0.3);
                }
                
                .tournament-status.active {
                    background: rgba(59, 130, 246, 0.1);
                    color: #3b82f6;
                    border: 1px solid rgba(59, 130, 246, 0.3);
                }
                
                .empty-history {
                    color: var(--text-secondary);
                    font-style: italic;
                    text-align: center;
                    padding: 20px;
                }
                
                @media (max-width: 480px) {
                    .profile-stats-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .profile-header {
                        flex-direction: column;
                        text-align: center;
                        padding: 20px;
                    }
                    
                    .profile-avatar-large {
                        width: 60px;
                        height: 60px;
                        font-size: 28px;
                    }
                }
            </style>
        `;
    }

    // Загрузка страницы (для навигации)
    loadPage(pageId) {
        this.showPage(pageId);
        
        // Показываем уведомление если нужно
        switch(pageId) {
            case 'main':
                // Ничего не показываем
                break;
            case 'rating':
                this.showNotification('Загружен полный рейтинг', 'info');
                break;
            case 'tournaments':
                this.showNotification('Список всех турниров', 'info');
                break;
            case 'profile':
                if (this.userData) {
                    // Профиль уже загружается
                } else {
                    this.showNotification('Войдите через Telegram для доступа к профилю', 'warning');
                    this.showPage('main');
                }
                break;
        }
    }

    // Обработка изменения размера окна
    handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Адаптация для мобильных
        if (width < 480) {
            document.body.classList.add('mobile-view');
            document.body.classList.remove('tablet-view', 'desktop-view');
        } else if (width < 768) {
            document.body.classList.add('tablet-view');
            document.body.classList.remove('mobile-view', 'desktop-view');
        } else {
            document.body.classList.add('desktop-view');
            document.body.classList.remove('mobile-view', 'tablet-view');
        }
        
        // Адаптация для ландшафтной ориентации
        if (width > height && height < 500) {
            document.body.classList.add('landscape');
        } else {
            document.body.classList.remove('landscape');
        }
    }

    // Инициализация анимаций
    initAnimations() {
        // Запуск анимации плавающих карт
        this.startFloatingCards();
        
        // Анимация появления элементов при загрузке
        setTimeout(() => {
            document.querySelectorAll('.animate__animated').forEach((el, index) => {
                setTimeout(() => {
                    el.style.opacity = '1';
                }, index * 100);
            });
        }, 300);
    }

    // Анимация счетчиков статистики
    initStatsCounter() {
        const statNumbers = document.querySelectorAll('.counter-animation');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.statsAnimated) {
                    this.animateCounters();
                    this.statsAnimated = true;
                }
            });
        }, { threshold: 0.5 });
        
        statNumbers.forEach(stat => observer.observe(stat));
    }

    animateCounters() {
        const counters = document.querySelectorAll('.counter-animation');
        
        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-count'));
            const duration = 2000;
            const step = target / (duration / 16);
            
            let current = 0;
            const timer = setInterval(() => {
                current += step;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                counter.textContent = Math.floor(current).toLocaleString();
            }, 16);
        });
    }

    // Запуск плавающих карт
    startFloatingCards() {
        const cards = document.querySelectorAll('.floating-card');
        cards.forEach(card => {
            card.style.animationPlayState = 'running';
        });
    }

    // Инициализация Intersection Observer
    initIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    
                    // Анимация для рейтинга
                    if (entry.target.classList.contains('rating-item')) {
                        setTimeout(() => {
                            entry.target.style.transform = 'translateX(0)';
                        }, 100);
                    }
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });
        
        // Наблюдать за элементами
        document.querySelectorAll('.rating-item, .action-item, .info-item').forEach(el => {
            observer.observe(el);
        });
    }

    // Получить эмодзи медали
    getMedalEmoji(rank) {
        switch(rank) {
            case 1: return '🥇';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return '';
        }
    }

    // Показать модальное окно профиля
    showProfileModal() {
        if (!this.userPlayerProfile) {
            this.showNotification('Профиль не найден', 'error');
            return;
        }
        
        const stats = dataManager.getPlayerStats(this.userPlayerProfile.id);
        const rank = stats?.rank || 'Н/Д';
        const totalPlayers = stats?.totalPlayers || 0;
        
        const profileHtml = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Ваш профиль</h3>
                    <button class="close-modal" onclick="app.closeModalWithAnimation('profileModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div style="text-align: center; margin-bottom: 32px;">
                        <div class="profile-avatar" style="
                            width: 100px;
                            height: 100px;
                            background: linear-gradient(135deg, var(--accent-gold), var(--accent-red));
                            border-radius: 50%;
                            display: inline-flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 42px;
                            color: var(--bg-primary);
                            font-weight: 900;
                            margin-bottom: 20px;
                            border: 4px solid var(--accent-gold);
                            box-shadow: var(--shadow-glow);
                            animation: pulse 2s infinite;
                        ">
                            ${this.userData.first_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <h3 style="margin-bottom: 8px; font-size: 24px;">${this.userPlayerProfile.name}</h3>
                        ${this.userPlayerProfile.telegramUsername ? 
                            `<p style="color: var(--accent-cyan); margin-bottom: 4px;">@${this.userPlayerProfile.telegramUsername}</p>` : ''}
                        <p style="color: var(--text-secondary); font-size: 14px;">Место в рейтинге: <strong style="color: var(--accent-gold);">${rank}</strong> из ${totalPlayers}</p>
                    </div>
                    
                    <div style="background: var(--bg-card); padding: 28px; border-radius: 20px; margin-bottom: 28px; border: 1px solid rgba(255, 215, 0, 0.1);">
                        <h4 style="color: var(--accent-gold); margin-bottom: 24px; display: flex; align-items: center; gap: 12px; font-size: 18px;">
                            <i class="fas fa-chart-line"></i> ВАША СТАТИСТИКА
                        </h4>
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;">
                            <div style="text-align: center;">
                                <div style="font-size: 36px; font-weight: 900; color: var(--accent-gold); font-family: 'Montserrat', sans-serif;">
                                    ${this.userPlayerProfile.tournaments || 0}
                                </div>
                                <div style="font-size: 13px; color: var(--text-secondary); margin-top: 8px; text-transform: uppercase; letter-spacing: 1px;">Турниров</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 36px; font-weight: 900; color: var(--accent-gold); font-family: 'Montserrat', sans-serif;">
                                    ${this.userPlayerProfile.points || 0}
                                </div>
                                <div style="font-size: 13px; color: var(--text-secondary); margin-top: 8px; text-transform: uppercase; letter-spacing: 1px;">Очков</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 36px; font-weight: 900; color: var(--accent-gold); font-family: 'Montserrat', sans-serif;">
                                    ${this.userPlayerProfile.wins || 0}
                                </div>
                                <div style="font-size: 13px; color: var(--text-secondary); margin-top: 8px; text-transform: uppercase; letter-spacing: 1px;">Побед</div>
                            </div>
                        </div>
                    </div>
                    
                    ${stats.upcomingTournaments && stats.upcomingTournaments.length > 0 ? `
                        <div style="background: var(--bg-card); padding: 24px; border-radius: 16px; margin-bottom: 24px; border: 1px solid rgba(255, 215, 0, 0.1);">
                            <h4 style="color: var(--accent-gold); margin-bottom: 16px; display: flex; align-items: center; gap: 12px; font-size: 16px;">
                                <i class="fas fa-calendar-check"></i> Ваши турниры
                            </h4>
                            <div style="font-size: 14px; color: var(--text-secondary);">
                                ${stats.upcomingTournaments.length} активных записей
                            </div>
                        </div>
                    ` : ''}
                    
                    <button class="btn-confirm glow-effect" onclick="app.closeModalWithAnimation('profileModal')" style="width: 100%;">
                        <i class="fas fa-check"></i> ПОНЯТНО
                    </button>
                </div>
            </div>
        `;
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'profileModal';
        modal.innerHTML = profileHtml;
        document.querySelector('.app-container').appendChild(modal);
        
        this.openModalWithAnimation('profileModal');
    }

    // Открыть модальное окно с анимацией
    openModalWithAnimation(modalId) {
        const modal = document.getElementById(modalId);
        const overlay = document.getElementById('modalOverlay');
        
        if (modal && overlay) {
            modal.style.display = 'block';
            overlay.style.display = 'block';
            
            // Анимация появления
            setTimeout(() => {
                modal.style.opacity = '1';
                modal.style.transform = 'scale(1)';
            }, 10);
            
            // Показать кнопку назад в Telegram
            if (this.tg?.BackButton) {
                this.tg.BackButton.show();
            }
            
            // Блокировка скролла
            document.body.style.overflow = 'hidden';
        }
    }

    // Закрыть модальное окно с анимацией
    closeModalWithAnimation(modalId) {
        const modal = document.getElementById(modalId);
        const overlay = document.getElementById('modalOverlay');
        
        if (modal) {
            // Анимация закрытия
            modal.style.opacity = '0';
            modal.style.transform = 'scale(0.95)';
            
            setTimeout(() => {
                modal.style.display = 'none';
                
                // Проверить, есть ли другие открытые модалки
                const openModals = document.querySelectorAll('.modal[style*="display: block"]');
                if (openModals.length === 0) {
                    if (overlay) overlay.style.display = 'none';
                    
                    if (this.tg?.BackButton) {
                        this.tg.BackButton.hide();
                    }
                    
                    document.body.style.overflow = 'auto';
                }
            }, 300);
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
        
        const overlay = document.getElementById('modalOverlay');
        if (overlay) overlay.style.display = 'none';
        
        if (this.tg?.BackButton) {
            this.tg.BackButton.hide();
        }
        
        document.body.style.overflow = 'auto';
    }

    // Показать уведомление
    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(notification);
        
        // Автоматическое удаление через 3 секунды
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'fadeOut 0.5s ease forwards';
                setTimeout(() => notification.remove(), 500);
            }
        }, 3000);
        
        // Удаление по клику
        notification.addEventListener('click', () => {
            notification.style.animation = 'fadeOut 0.5s ease forwards';
            setTimeout(() => notification.remove(), 500);
        });
    }
}

// Инициализация приложения
const app = new LEBROOMApp();

// Глобальные функции для вызова из HTML
window.openModal = (modalId) => app.openModalWithAnimation(modalId);
window.closeModal = (modalId) => app.closeModalWithAnimation(modalId);
window.toggleFAQ = (element) => {
    const faqItem = element.parentElement;
    const isActive = faqItem.classList.contains('active');
    
    // Закрыть все
    document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
        const icon = item.querySelector('.faq-question i');
        if (icon) {
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        }
    });
    
    // Открыть текущий, если был закрыт
    if (!isActive) {
        faqItem.classList.add('active');
        const icon = element.querySelector('i');
        if (icon) {
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
        }
    }
};

// Запуск при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    app.init();
    
    // Адаптация при загрузке
    app.handleResize();
    
    // Периодическое обновление данных
    setInterval(() => {
        app.loadTournamentData();
        app.loadRatingData();
        app.updateStatsCounter();
    }, 30000); // Каждые 30 секунд
});

// Обработка видимости страницы
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        app.loadTournamentData();
        app.loadRatingData();
        app.updateStatsCounter();
    }
});

// Предотвращение масштабирования на мобильных
document.addEventListener('touchmove', (e) => {
    if (e.scale !== 1) {
        e.preventDefault();
    }
}, { passive: false });