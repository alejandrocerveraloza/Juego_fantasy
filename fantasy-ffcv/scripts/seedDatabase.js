require('dotenv').config();
const connectDB = require('../config/database');
const Player = require('../models/Player');
const Match = require('../models/Match');
const User = require('../models/User');
const { leagues } = require('../config/leagues');

const seedDatabase = async () => {
  try {
    console.log('🌱 Seeding database...\n');
    
    await connectDB();

    // Limpiar base de datos
    console.log('🗑️  Clearing existing data...');
    await Player.deleteMany({});
    await Match.deleteMany({});
    // await User.deleteMany({}); // Descomentar si quieres limpiar usuarios también

    console.log('✅ Database cleared\n');

    // Crear jugadores de ejemplo para cada liga
    const samplePlayers = [];
    const positions = ['goalkeeper', 'defender', 'midfielder', 'forward'];
    const teams = {
      'lliga-comunitat-norte': ['Levante UD', 'Villarreal CF', 'Valencia CF', 'Elche CF'],
      'primera-ffcv-g2': ['CD Castellón', 'Hércules CF', 'UE Gandia', 'Torrent CF'],
      'segunda-ffcv-g4': ['CD Roda', 'CF Benidorm', 'UD Alzira', 'CD Alcoyano'],
      'tercera-ffcv-g7': ['CD Acero', 'CF La Nucía', 'UD Tavernes', 'CD Rayo Ibense']
    };

    console.log('👥 Creating sample players...');
    
    for (const league of leagues) {
      const leagueTeams = teams[league.id] || ['Equipo A', 'Equipo B', 'Equipo C', 'Equipo D'];
      
      for (const team of leagueTeams) {
        for (let i = 0; i < 25; i++) {
          const position = positions[Math.floor(Math.random() * positions.length)];
          const basePrice = 1000000 + Math.floor(Math.random() * 5000000);
          
          const player = {
            name: `Jugador ${i + 1} ${team.split(' ')[0]}`,
            team,
            league: {
              id: league.id,
              name: league.name,
              division: league.division
            },
            position,
            currentPrice: basePrice,
            initialPrice: basePrice,
            totalPoints: Math.floor(Math.random() * 50),
            isAvailable: true
          };
          
          samplePlayers.push(player);
        }
      }
    }

    await Player.insertMany(samplePlayers);
    console.log(`✅ Created ${samplePlayers.length} sample players\n`);

    // Crear partidos de ejemplo
    console.log('⚽ Creating sample matches...');
    const sampleMatches = [];
    
    for (const league of leagues) {
      const leagueTeams = teams[league.id] || ['Equipo A', 'Equipo B', 'Equipo C', 'Equipo D'];
      
      for (let gameweek = 1; gameweek <= 5; gameweek++) {
        for (let i = 0; i < leagueTeams.length; i += 2) {
          if (i + 1 < leagueTeams.length) {
            const match = {
              league: {
                id: league.id,
                name: league.name,
                division: league.division
              },
              gameweek,
              homeTeam: leagueTeams[i],
              awayTeam: leagueTeams[i + 1],
              homeScore: Math.floor(Math.random() * 4),
              awayScore: Math.floor(Math.random() * 4),
              date: new Date(2024, 8, (gameweek - 1) * 7 + 1), // Septiembre 2024
              status: 'finished',
              matchReportUrl: `https://resultadosffcv.isquad.es/acta_partido.php?id=${Math.random().toString(36).substr(2, 9)}`
            };
            
            sampleMatches.push(match);
          }
        }
      }
    }

    await Match.insertMany(sampleMatches);
    console.log(`✅ Created ${sampleMatches.length} sample matches\n`);

    console.log('🎉 Database seeded successfully!\n');
    console.log('Summary:');
    console.log(`  • ${samplePlayers.length} players created`);
    console.log(`  • ${sampleMatches.length} matches created`);
    console.log(`  • ${leagues.length} leagues configured\n`);
    console.log('💡 Next steps:');
    console.log('  1. Start the server: npm start');
    console.log('  2. Run scraper: npm run update-points');
    console.log('  3. Register a user via API or frontend\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
