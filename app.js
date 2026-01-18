// LEBROOM Poker Club - Telegram Mini App
// Обновленная версия с анимациями и темным дизайном

class LEBROOMApp {
    constructor() {
        this.tg = window.Telegram?.WebApp;
        this.userData = null;
        this.currentTournament = null;
        this.isRegistered = false;
        this.statsAnimated = false;
        
        this.apiBase = window.location.hostname === 'localhost' 
            ? 'http://localhost:5500/api' 
            : './api';
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
        
        // Настройка событий
        this.setupEventListeners();
        
        // Инициализация анимаций
        this.initAnimations();
        this.initIntersectionObserver();
        
        // Анимация счетчиков статистики
        this.initStatsCounter();
        
        console.log('✅ Приложение готово!');
    }

    // Инициализация Telegram Web App
    initTelegram() {
        try {
            // Развернуть приложение на весь экран
            this.tg.expand();
            
            // Включить haptic feedback
            this.tg.HapticFeedback.isSupported = true;
            
            // Получить данные пользователя
            this.userData = this.tg.initDataUnsafe?.user;
            
            if (this.userData) {
                this.updateUserBadge();
                this.showNotification('Добро пожаловать в LEBROOM!', 'success');
            }
            
            // Настроить тему
            this.setTelegramTheme();
            
            // Обработка кнопки назад
            this.tg.BackButton.onClick(() => {
                this.closeAllModals();
            });
            
        } catch (error) {
            console.error('Ошибка инициализации Telegram:', error);
        }
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
            // Для светлой темы Telegram тоже используем темный дизайн
            document.body.style.backgroundColor = '#0A0A0F';
        }
    }

    // Загрузка данных турнира
    async loadTournamentData() {
        try {
            const response = await fetch(`${this.apiBase}/tournament.json`);
            
            if (!response.ok) {
                throw new Error('Файл не найден, используем демо-данные');
            }
            
            const data = await response.json();
            this.currentTournament = data;
            this.updateTournamentUI(data);
            
        } catch (error) {
            console.log('Используем демо-данные турнира:', error.message);
            
            this.currentTournament = {
                title: 'LEBROOM HIGH ROLLER',
                date: '22.01',
                time: '19:00',
                totalSeats: 100,
                registeredCount: 72,
                buyIn: '5 000 ₽',
                prizePool: '500 000 ₽',
                description: 'Еженедельный турнир с гарантированным призовым фондом'
            };
            
            this.updateTournamentUI(this.currentTournament);
        }
    }

    // Обновить UI турнира
    updateTournamentUI(data) {
        // Основные данные
        document.getElementById('tournamentTitle').textContent = data.title;
        document.getElementById('tournamentDate').textContent = `${data.date} / ${data.time}`;
        document.getElementById('tournamentSeats').textContent = data.totalSeats;
        document.getElementById('registeredCount').textContent = data.registeredCount;
        document.getElementById('totalSeats').textContent = data.totalSeats;
        
        // Прогресс с анимацией
        const progress = (data.registeredCount / data.totalSeats) * 100;
        const progressFill = document.getElementById('progressFill');
        progressFill.style.width = `${progress}%`;
        
        // Анимация прогресс-бара
        this.animateProgress(progressFill, progress);
        
        // Модальное окно
        document.getElementById('modalTournamentName').textContent = data.title;
        document.getElementById('modalTournamentDate').textContent = `${data.date} в ${data.time}`;
        document.getElementById('modalFreeSeats').textContent = data.totalSeats - data.registeredCount;
        
        // Успешная запись
        document.getElementById('successDate').textContent = data.date;
        document.getElementById('successTime').textContent = data.time;
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
            const response = await fetch(`${this.apiBase}/rating.json`);
            
            if (!response.ok) {
                throw new Error('Файл рейтинга не найден');
            }
            
            const data = await response.json();
            this.updateRatingUI(data.players || []);
            
        } catch (error) {
            console.log('Используем демо-рейтинг:', error.message);
            
            const demoPlayers = [
                { id: 1, name: 'Иван Петров', points: 2540, tournaments: 15, wins: 3 },
                { id: 2, name: 'Алексей Смирнов', points: 2120, tournaments: 12, wins: 2 },
                { id: 3, name: 'Мария Иванова', points: 1980, tournaments: 10, wins: 1 },
                { id: 4, name: 'Дмитрий Козлов', points: 1850, tournaments: 8, wins: 1 },
                { id: 5, name: 'Анна Сидорова', points: 1720, tournaments: 7, wins: 0 }
            ];
            
            this.updateRatingUI(demoPlayers);
        }
    }

    // Обновить UI рейтинга
    updateRatingUI(players) {
        const ratingList = document.getElementById('ratingList');
        if (!ratingList) return;
        
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
            html += `
                <div class="rating-item" style="animation-delay: ${index * 0.1}s">
                    <div class="rank">${index + 1}</div>
                    <div class="player-info">
                        <div class="player-name">${player.name}</div>
                        <div class="player-stats">
                            <span class="points">${player.points.toLocaleString()} очков</span>
                            <span class="tournaments">${player.tournaments} турниров</span>
                        </div>
                    </div>
                    <div class="medal">${medal}</div>
                </div>
            `;
        });
        
        ratingList.innerHTML = html;
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
            const duration = 2000; // 2 секунды
            const step = target / (duration / 16); // 60fps
            
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

    // Запись на турнир
    async registerForTournament() {
        if (!this.userData?.id) {
            this.showNotification('Войдите через Telegram для записи', 'warning');
            return;
        }
        
        try {
            // Показать индикатор загрузки
            const confirmBtn = document.getElementById('confirmRegisterBtn');
            const originalText = confirmBtn.innerHTML;
            confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ЗАПИСЬ...';
            confirmBtn.disabled = true;
            
            // Имитация задержки
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Успешная запись
            this.isRegistered = true;
            this.updateRegisterButton();
            
            // Обновить счетчик с анимацией
            const currentRegistered = parseInt(document.getElementById('registeredCount').textContent);
            const newCount = currentRegistered + 1;
            const totalSeats = parseInt(document.getElementById('totalSeats').textContent);
            
            // Анимация счетчика
            this.animateCounter('registeredCount', currentRegistered, newCount);
            
            // Обновить прогресс
            const newProgress = (newCount / totalSeats) * 100;
            const progressFill = document.getElementById('progressFill');
            this.animateProgress(progressFill, newProgress);
            
            // Обновить свободные места
            document.getElementById('modalFreeSeats').textContent = totalSeats - newCount;
            
            // Показать номер в списке
            document.getElementById('successPosition').textContent = `#${newCount}`;
            document.getElementById('successMessage').textContent = 
                `Вы записаны на турнир "${this.currentTournament.title}"`;
            
            // Анимация закрытия и открытия модалок
            this.closeModalWithAnimation('registerModal');
            setTimeout(() => this.openModalWithAnimation('successModal'), 300);
            
            // Отправить данные в Telegram бота
            if (this.tg?.sendData) {
                try {
                    this.tg.sendData(JSON.stringify({
                        action: 'tournament_registered',
                        userId: this.userData.id,
                        tournament: this.currentTournament.title,
                        position: newCount,
                        timestamp: new Date().toISOString()
                    }));
                } catch (e) {
                    console.warn('Не удалось отправить данные в бота:', e);
                }
            }
            
            // Показать haptic feedback
            if (this.tg?.HapticFeedback) {
                this.tg.HapticFeedback.notificationOccurred('success');
            }
            
            this.showNotification('🎉 Вы успешно записались на турнир!', 'success');
            
        } catch (error) {
            console.error('Ошибка записи:', error);
            this.showNotification('Ошибка при записи. Попробуйте позже.', 'error');
            
            if (this.tg?.HapticFeedback) {
                this.tg.HapticFeedback.notificationOccurred('error');
            }
            
        } finally {
            // Восстановить кнопку
            const confirmBtn = document.getElementById('confirmRegisterBtn');
            confirmBtn.innerHTML = '<i class="fas fa-check"></i> ПОДТВЕРДИТЬ ЗАПИСЬ';
            confirmBtn.disabled = false;
        }
    }

    // Анимация счетчика
    animateCounter(elementId, start, end) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const duration = 1000;
        const steps = 60;
        const increment = (end - start) / steps;
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= end) {
                current = end;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current);
        }, duration / steps);
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
        document.getElementById('registerBtn').addEventListener('click', () => {
            this.openModalWithAnimation('registerModal');
        });
        
        // Подтверждение записи
        document.getElementById('confirmRegisterBtn').addEventListener('click', () => {
            this.registerForTournament();
        });
        
        // Кнопка поддержки
        document.getElementById('supportBtn').addEventListener('click', () => {
            if (this.tg) {
                this.tg.openTelegramLink('https://t.me/lebroomsupport');
            } else {
                window.open('https://t.me/lebroomsupport', '_blank');
            }
        });
        
        // Кнопка информации о клубе
        document.getElementById('clubInfoBtn').addEventListener('click', () => {
            this.openModalWithAnimation('clubInfoModal');
        });
        
        // Кнопка Q&A
        document.getElementById('qaBtn').addEventListener('click', () => {
            this.openModalWithAnimation('qaModal');
        });
        
        // Кнопка профиля
        document.getElementById('myProfileBtn').addEventListener('click', () => {
            if (this.userData) {
                this.showProfileModal();
            } else {
                this.showNotification('Войдите через Telegram для доступа к профилю', 'warning');
            }
        });
        
        // Кнопка подробнее
        document.getElementById('detailsBtn').addEventListener('click', () => {
            if (this.tg) {
                this.tg.showAlert(`🎯 ${this.currentTournament.title}\n📅 ${this.currentTournament.date}\n⏰ ${this.currentTournament.time}\n💰 ${this.currentTournament.buyIn}\n🏆 ${this.currentTournament.prizePool}`);
            } else {
                alert(`🎯 ${this.currentTournament.title}\n📅 ${this.currentTournament.date}\n⏰ ${this.currentTournament.time}\n💰 ${this.currentTournament.buyIn}\n🏆 ${this.currentTournament.prizePool}`);
            }
        });
        
        // Кнопка просмотра всего рейтинга
        document.getElementById('viewAllRating').addEventListener('click', (e) => {
            e.preventDefault();
            this.showNotification('Полный рейтинг загружается...', 'info');
        });
        
        // Нижняя навигация
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Анимация переключения
                document.querySelectorAll('.nav-item').forEach(i => {
                    i.classList.remove('active');
                });
                
                item.classList.add('active');
                
                // Анимация перехода
                item.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    item.style.transform = 'scale(1)';
                }, 150);
                
                // Загрузка страницы
                const page = item.getAttribute('data-page');
                this.loadPage(page);
            });
        });
        
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

    // Обработка изменения размера окна
    handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        console.log(`Размер экрана: ${width}x${height}`);
        
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

    // Показать модальное окно профиля с анимацией
    showProfileModal() {
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
                        <h3 style="margin-bottom: 8px; font-size: 24px;">${this.userData.first_name || ''} ${this.userData.last_name || ''}</h3>
                        ${this.userData.username ? `<p style="color: var(--accent-cyan); margin-bottom: 4px;">@${this.userData.username}</p>` : ''}
                        <p style="color: var(--text-secondary); font-size: 14px;">ID: ${this.userData.id}</p>
                    </div>
                    
                    <div style="background: var(--bg-card); padding: 28px; border-radius: 20px; margin-bottom: 28px; border: 1px solid rgba(255, 215, 0, 0.1);">
                        <h4 style="color: var(--accent-gold); margin-bottom: 24px; display: flex; align-items: center; gap: 12px; font-size: 18px;">
                            <i class="fas fa-chart-line"></i> ВАША СТАТИСТИКА
                        </h4>
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;">
                            <div style="text-align: center;">
                                <div style="font-size: 36px; font-weight: 900; color: var(--accent-gold); font-family: 'Montserrat', sans-serif;">0</div>
                                <div style="font-size: 13px; color: var(--text-secondary); margin-top: 8px; text-transform: uppercase; letter-spacing: 1px;">Турниров</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 36px; font-weight: 900; color: var(--accent-gold); font-family: 'Montserrat', sans-serif;">0</div>
                                <div style="font-size: 13px; color: var(--text-secondary); margin-top: 8px; text-transform: uppercase; letter-spacing: 1px;">Очков</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 36px; font-weight: 900; color: var(--accent-gold); font-family: 'Montserrat', sans-serif;">0</div>
                                <div style="font-size: 13px; color: var(--text-secondary); margin-top: 8px; text-transform: uppercase; letter-spacing: 1px;">Побед</div>
                            </div>
                        </div>
                    </div>
                    
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

    // Загрузка страниц
    loadPage(page) {
        switch(page) {
            case 'main':
                this.showNotification('Добро пожаловать в LEBROOM!', 'success');
                break;
            case 'rating':
                this.showNotification('Полный рейтинг в разработке', 'info');
                break;
            case 'tournaments':
                this.showNotification('Список всех турниров в разработке', 'info');
                break;
            case 'profile':
                if (this.userData) {
                    this.showProfileModal();
                } else {
                    this.showNotification('Войдите через Telegram для доступа к профилю', 'warning');
                }
                break;
        }
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
    }, 60000);
});

// Обработка видимости страницы
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        app.loadTournamentData();
        app.loadRatingData();
    }
});

// Предотвращение масштабирования на мобильных
document.addEventListener('touchmove', (e) => {
    if (e.scale !== 1) {
        e.preventDefault();
    }
}, { passive: false });