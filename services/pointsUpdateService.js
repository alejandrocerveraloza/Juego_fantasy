const Player = require('../models/Player');
const Match = require('../models/Match');
const scraperService = require('./scraperService');
const { leagues } = require('../config/leagues');

class PointsUpdateService {
  /**
   * Actualiza todos los puntos del sistema
   */
  async updateAllPoints() {
    console.log('🔄 Starting full points update...');
    
    try {
      // 1. Scrapear partidos de todas las ligas
      await this.scrapeAllLeagues();
      
      // 2. Scrapear actas de partidos pendientes
      await this.scrapeMatchReports();
      
      // 3. Actualizar puntos de jugadores
      await this.updatePlayerPoints();
      
      // 4. Actualizar precios de mercado
      await this.updateMarketPrices();
      
      console.log('✅ Points update completed successfully');
      
    } catch (error) {
      console.error('❌ Error in points update:', error);
      throw error;
    }
  }

  /**
   * Scrapea todas las ligas configuradas
   */
  async scrapeAllLeagues() {
    console.log('📡 Scraping all leagues...');
    
    for (const league of leagues) {
      if (!league.active) continue;
      
      try {
        console.log(`📡 Scraping league: ${league.name}`);
        
        const matches = await scraperService.scrapeLeagueMatches(league.url, league.id);
        
        // Guardar o actualizar partidos en la base de datos
        for (const matchData of matches) {
          await Match.findOneAndUpdate(
            {
              'league.id': league.id,
              homeTeam: matchData.homeTeam,
              awayTeam: matchData.awayTeam,
              date: matchData.date
            },
            {
              ...matchData,
              league: {
                id: league.id,
                name: league.name,
                division: league.division
              }
            },
            { upsert: true, new: true }
          );
        }
        
        console.log(`✅ Saved ${matches.length} matches for ${league.name}`);
        
      } catch (error) {
        console.error(`❌ Error scraping league ${league.name}:`, error.message);
      }
    }
  }

  /**
   * Scrapea las actas de partidos pendientes
   */
  async scrapeMatchReports() {
    console.log('📄 Scraping match reports...');
    
    const pendingMatches = await Match.getPendingScraping();
    console.log(`Found ${pendingMatches.length} matches pending scraping`);
    
    for (const match of pendingMatches) {
      if (!match.matchReportUrl) {
        console.log(`⚠️  No report URL for match ${match.homeTeam} vs ${match.awayTeam}`);
        continue;
      }
      
      try {
        // Actualizar estado a "in progress"
        match.scrapingStatus.status = 'in_progress';
        match.scrapingStatus.lastAttempt = new Date();
        match.scrapingStatus.attempts += 1;
        await match.save();
        
        // Scrapear acta
        const playerStats = await scraperService.scrapeMatchReport(match.matchReportUrl);
        
        // Guardar estadísticas
        match.playerStats = playerStats;
        match.scrapingStatus.status = 'completed';
        match.scrapingStatus.error = null;
        await match.save();
        
        console.log(`✅ Scraped stats for ${match.homeTeam} vs ${match.awayTeam}`);
        
        // Pequeña pausa entre scraping de actas
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`❌ Error scraping match report for ${match.homeTeam} vs ${match.awayTeam}:`, error.message);
        
        match.scrapingStatus.status = 'failed';
        match.scrapingStatus.error = error.message;
        await match.save();
      }
    }
  }

  /**
   * Actualiza los puntos de todos los jugadores basándose en los partidos
   */
  async updatePlayerPoints() {
    console.log('🎯 Updating player points...');
    
    const completedMatches = await Match.find({
      'scrapingStatus.status': 'completed',
      status: 'finished'
    }).sort({ date: 1 });
    
    console.log(`Processing ${completedMatches.length} completed matches`);
    
    // Agrupar partidos por jornada
    const gameweeks = this.groupByGameweek(completedMatches);
    
    for (const [gameweek, matches] of Object.entries(gameweeks)) {
      console.log(`Processing gameweek ${gameweek}...`);
      
      for (const match of matches) {
        await this.processMatchStats(match, parseInt(gameweek));
      }
    }
    
    console.log('✅ Player points updated');
  }

  /**
   * Procesa las estadísticas de un partido y actualiza los jugadores
   */
  async processMatchStats(match, gameweek) {
    const cleanSheetTeams = match.getCleanSheetTeams();
    
    for (const statLine of match.playerStats) {
      try {
        // Buscar o crear jugador
        let player = await Player.findOne({
          name: statLine.playerName,
          team: statLine.team
        });
        
        if (!player) {
          // Crear nuevo jugador
          player = new Player({
            name: statLine.playerName,
            team: statLine.team,
            league: match.league,
            position: this.guessPosition(statLine), // Función auxiliar para adivinar posición
            currentPrice: 1000000,
            initialPrice: 1000000
          });
        }
        
        // Verificar si ya existe esta jornada para evitar duplicados
        const existingGameweek = player.gameweekStats.find(
          gw => gw.gameweek === gameweek && gw.matchId?.toString() === match._id.toString()
        );
        
        if (existingGameweek) {
          console.log(`⚠️  Gameweek ${gameweek} already exists for ${player.name}, skipping`);
          continue;
        }
        
        // Determinar si tuvo portería a cero
        const hadCleanSheet = cleanSheetTeams.includes(statLine.team) && statLine.minutes >= 60;
        
        // Crear estadísticas de la jornada
        const gameweekStat = {
          gameweek,
          matchId: match._id,
          minutes: statLine.minutes,
          goals: statLine.goals,
          assists: statLine.assists,
          yellowCards: statLine.yellowCards,
          redCards: statLine.redCards,
          cleanSheet: hadCleanSheet,
          date: match.date
        };
        
        // Calcular puntos
        gameweekStat.points = player.calculateGameweekPoints(gameweekStat);
        
        // Agregar a estadísticas del jugador
        player.gameweekStats.push(gameweekStat);
        
        // Actualizar puntos totales
        player.totalPoints += gameweekStat.points;
        
        // Actualizar estadísticas de temporada
        player.updateSeasonStats();
        
        await player.save();
        
        console.log(`✅ Updated ${player.name}: ${gameweekStat.points} points`);
        
      } catch (error) {
        console.error(`❌ Error updating player ${statLine.playerName}:`, error.message);
      }
    }
  }

  /**
   * Actualiza los precios de mercado de todos los jugadores
   */
  async updateMarketPrices() {
    console.log('💰 Updating market prices...');
    
    const players = await Player.find({ isAvailable: true });
    
    for (const player of players) {
      try {
        player.updatePrice();
        await player.save();
      } catch (error) {
        console.error(`❌ Error updating price for ${player.name}:`, error.message);
      }
    }
    
    console.log(`✅ Updated prices for ${players.length} players`);
  }

  /**
   * Agrupa partidos por jornada
   */
  groupByGameweek(matches) {
    const gameweeks = {};
    
    matches.forEach((match, index) => {
      // Si el partido tiene gameweek asignado, usarlo
      // Si no, calcular basándose en el orden cronológico
      const gameweek = match.gameweek || Math.floor(index / 10) + 1;
      
      if (!gameweeks[gameweek]) {
        gameweeks[gameweek] = [];
      }
      
      gameweeks[gameweek].push(match);
    });
    
    return gameweeks;
  }

  /**
   * Adivina la posición de un jugador basándose en estadísticas
   * (Función auxiliar - mejorar con datos reales si están disponibles)
   */
  guessPosition(stats) {
    // Heurística simple: muchos goles = delantero, muchas asistencias = centrocampista
    if (stats.goals >= 2) return 'forward';
    if (stats.assists >= 2) return 'midfielder';
    if (stats.minutes > 0) return 'defender'; // Por defecto
    return 'midfielder';
  }
}

module.exports = new PointsUpdateService();
