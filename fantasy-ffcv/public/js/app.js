// API Configuration
const API_URL = window.location.origin + '/api';
let authToken = localStorage.getItem('authToken');
let currentUser = null;
let allPlayers = [];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    checkHealth();
    loadPlayers();
});

// Auth Functions
function checkAuth() {
    if (authToken) {
        fetchCurrentUser();
        document.getElementById('loginBtn').style.display = 'none';
        document.getElementById('teamBtn').style.display = 'inline-block';
        document.getElementById('logoutBtn').style.display = 'inline-block';
    }
}

async function fetchCurrentUser() {
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.data;
        } else {
            logout();
        }
    } catch (error) {
        console.error('Error fetching user:', error);
    }
}

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            localStorage.setItem('authToken', authToken);
            currentUser = data.user;
            
            showNotification('¡Bienvenido ' + currentUser.username + '!', 'success');
            
            document.getElementById('loginBtn').style.display = 'none';
            document.getElementById('teamBtn').style.display = 'inline-block';
            document.getElementById('logoutBtn').style.display = 'inline-block';
            
            showSection('team');
            loadTeam();
        } else {
            showNotification(data.message || 'Error al iniciar sesión', 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const teamName = document.getElementById('registerTeamName').value;
    const password = document.getElementById('registerPassword').value;
    
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, teamName, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            localStorage.setItem('authToken', authToken);
            currentUser = data.user;
            
            showNotification('¡Cuenta creada! Bienvenido ' + currentUser.username, 'success');
            
            document.getElementById('loginBtn').style.display = 'none';
            document.getElementById('teamBtn').style.display = 'inline-block';
            document.getElementById('logoutBtn').style.display = 'inline-block';
            
            showSection('team');
            loadTeam();
        } else {
            showNotification(data.message || 'Error al registrarse', 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    
    document.getElementById('loginBtn').style.display = 'inline-block';
    document.getElementById('teamBtn').style.display = 'none';
    document.getElementById('logoutBtn').style.display = 'none';
    
    showNotification('Sesión cerrada', 'success');
    showSection('home');
}

// Navigation
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected section
    const section = document.getElementById(sectionName + 'Section');
    if (section) {
        section.classList.add('active');
    }
    
    // Load section data if needed
    if (sectionName === 'players') {
        loadPlayers();
    } else if (sectionName === 'team' && authToken) {
        loadTeam();
    }
}

function showAuthTab(tab) {
    document.getElementById('loginTab').classList.remove('active');
    document.getElementById('registerTab').classList.remove('active');
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'none';
    
    if (tab === 'login') {
        document.getElementById('loginTab').classList.add('active');
        document.getElementById('loginForm').style.display = 'block';
    } else {
        document.getElementById('registerTab').classList.add('active');
        document.getElementById('registerForm').style.display = 'block';
    }
}

// API Health Check
async function checkHealth() {
    try {
        const response = await fetch(`${API_URL}/health`);
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('healthStatus').innerHTML = 
                `<span style="color: var(--secondary-color);">✓ API Conectada</span>`;
        }
    } catch (error) {
        document.getElementById('healthStatus').innerHTML = 
            `<span style="color: var(--danger-color);">✗ API No Disponible</span>`;
    }
}

// Players Functions
async function loadPlayers() {
    try {
        const response = await fetch(`${API_URL}/players?limit=100`);
        const data = await response.json();
        
        if (response.ok) {
            allPlayers = data.data;
            displayPlayers(allPlayers);
        }
    } catch (error) {
        document.getElementById('playersList').innerHTML = 
            '<p>Error al cargar jugadores. Por favor, intenta más tarde.</p>';
    }
}

function displayPlayers(players) {
    const container = document.getElementById('playersList');
    
    if (players.length === 0) {
        container.innerHTML = '<p>No se encontraron jugadores.</p>';
        return;
    }
    
    container.innerHTML = players.map(player => `
        <div class="player-card">
            <div class="player-header">
                <div class="player-name">${player.name}</div>
                <div class="player-position">${getPositionName(player.position)}</div>
            </div>
            <div class="player-info">
                <p><strong>Equipo:</strong> ${player.team}</p>
                <p><strong>Liga:</strong> ${player.league.name || 'N/A'}</p>
            </div>
            <div class="player-stats">
                <div class="stat">
                    <div class="stat-value">${player.totalPoints || 0}</div>
                    <div class="stat-label">Puntos</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${player.averagePoints?.toFixed(1) || 0}</div>
                    <div class="stat-label">Media</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${player.form?.toFixed(1) || 0}</div>
                    <div class="stat-label">Forma</div>
                </div>
            </div>
            <div class="player-price">
                ${formatPrice(player.currentPrice)}
            </div>
            ${authToken ? `<button onclick="buyPlayer('${player._id}')" class="btn btn-primary" style="width:100%">Fichar</button>` : ''}
        </div>
    `).join('');
}

function filterPlayers() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const position = document.getElementById('positionFilter').value;
    const league = document.getElementById('leagueFilter').value;
    
    let filtered = allPlayers;
    
    if (search) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(search) || 
            p.team.toLowerCase().includes(search)
        );
    }
    
    if (position) {
        filtered = filtered.filter(p => p.position === position);
    }
    
    if (league) {
        filtered = filtered.filter(p => p.league?.id === league);
    }
    
    displayPlayers(filtered);
}

// Team Functions
async function loadTeam() {
    if (!authToken) {
        showNotification('Debes iniciar sesión', 'error');
        showSection('login');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/team`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            displayTeam(data.data);
        }
    } catch (error) {
        showNotification('Error al cargar equipo', 'error');
    }
}

function displayTeam(teamData) {
    // Update budget and stats
    document.getElementById('teamBudget').textContent = formatPrice(teamData.budget);
    document.getElementById('teamPoints').textContent = teamData.totalPoints || 0;
    document.getElementById('squadValue').textContent = formatPrice(teamData.squadValue);
    
    // Display squad
    const squadList = document.getElementById('squadList');
    if (teamData.squad.length === 0) {
        squadList.innerHTML = '<p>Tu plantilla está vacía. ¡Empieza a fichar jugadores!</p>';
    } else {
        squadList.innerHTML = teamData.squad.map(item => `
            <div class="player-card">
                <div class="player-header">
                    <div class="player-name">${item.player.name}</div>
                    <div class="player-position">${getPositionName(item.player.position)}</div>
                </div>
                <div class="player-info">
                    <p><strong>Equipo:</strong> ${item.player.team}</p>
                    <p><strong>Precio compra:</strong> ${formatPrice(item.purchasePrice)}</p>
                    <p><strong>Valor actual:</strong> ${formatPrice(item.player.currentPrice)}</p>
                </div>
                <button onclick="sellPlayer('${item.player._id}')" class="btn btn-danger" style="width:100%">Vender</button>
            </div>
        `).join('');
    }
}

async function buyPlayer(playerId) {
    if (!authToken) {
        showNotification('Debes iniciar sesión', 'error');
        showSection('login');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/team/buy/${playerId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('¡Jugador fichado!', 'success');
            loadTeam();
        } else {
            showNotification(data.message || 'Error al fichar jugador', 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
    }
}

async function sellPlayer(playerId) {
    if (!confirm('¿Estás seguro de que quieres vender este jugador?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/team/sell/${playerId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Jugador vendido', 'success');
            loadTeam();
        } else {
            showNotification(data.message || 'Error al vender jugador', 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
    }
}

// Utility Functions
function formatPrice(price) {
    if (price >= 1000000) {
        return (price / 1000000).toFixed(1) + 'M €';
    }
    return (price / 1000).toFixed(0) + 'k €';
}

function getPositionName(position) {
    const positions = {
        'goalkeeper': 'POR',
        'defender': 'DEF',
        'midfielder': 'MED',
        'forward': 'DEL'
    };
    return positions[position] || position;
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}
