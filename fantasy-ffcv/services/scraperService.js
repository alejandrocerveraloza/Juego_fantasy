const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

class ScraperService {
  constructor() {
    this.browser = null;
    this.timeout = parseInt(process.env.SCRAPING_TIMEOUT) || 30000;
    this.headless = process.env.SCRAPING_HEADLESS !== 'false';
  }

  async initialize() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: this.headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu'
        ]
      });
      console.log('🔧 Puppeteer browser initialized');
    }
    return this.browser;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log('🔧 Puppeteer browser closed');
    }
  }

  /**
   * Scrapea la página principal de una liga para obtener todos los partidos
   */
  async scrapeLeagueMatches(leagueUrl, leagueId) {
    const browser = await this.initialize();
    const page = await browser.newPage();
    
    try {
      console.log(`📡 Scraping league: ${leagueUrl}`);
      
      await page.goto(leagueUrl, {
        waitUntil: 'networkidle2',
        timeout: this.timeout
      });

      // Esperar a que cargue la tabla de partidos
      await page.waitForSelector('table', { timeout: 10000 });

      const content = await page.content();
      const $ = cheerio.load(content);
      
      const matches = [];
      
      // Iterar sobre las filas de la tabla de partidos
      $('table tr').each((index, element) => {
        const $row = $(element);
        const cells = $row.find('td');
        
        if (cells.length >= 4) {
          // Extraer datos del partido
          const dateText = $(cells[0]).text().trim();
          const homeTeam = $(cells[1]).text().trim();
          const result = $(cells[2]).text().trim();
          const awayTeam = $(cells[3]).text().trim();
          
          // Buscar el enlace al acta del partido
          const matchLink = $row.find('a[href*="acta_partido"]').attr('href');
          
          // Parsear resultado (formato "X - Y")
          const scoreMatch = result.match(/(\d+)\s*-\s*(\d+)/);
          
          if (homeTeam && awayTeam && scoreMatch) {
            matches.push({
              homeTeam,
              awayTeam,
              homeScore: parseInt(scoreMatch[1]),
              awayScore: parseInt(scoreMatch[2]),
              date: this.parseDate(dateText),
              matchReportUrl: matchLink ? this.normalizeUrl(matchLink, leagueUrl) : null,
              status: 'finished',
              league: leagueId
            });
          }
        }
      });
      
      console.log(`✅ Found ${matches.length} matches for league ${leagueId}`);
      return matches;
      
    } catch (error) {
      console.error(`❌ Error scraping league ${leagueId}:`, error.message);
      throw error;
    } finally {
      await page.close();
    }
  }

  /**
   * Scrapea el acta de un partido individual para obtener estadísticas de jugadores
   */
  async scrapeMatchReport(matchReportUrl) {
    const browser = await this.initialize();
    const page = await browser.newPage();
    
    try {
      console.log(`📄 Scraping match report: ${matchReportUrl}`);
      
      await page.goto(matchReportUrl, {
        waitUntil: 'networkidle2',
        timeout: this.timeout
      });

      await page.waitForSelector('table', { timeout: 10000 });

      const content = await page.content();
      const $ = cheerio.load(content);
      
      const playerStats = [];
      let currentTeam = null;
      
      // Buscar tablas de alineaciones y estadísticas
      $('table').each((tableIndex, table) => {
        const $table = $(table);
        
        // Detectar nombre del equipo (suele estar en un encabezado antes de la tabla)
        const teamHeader = $table.prev('h3, h4, strong, b').text().trim();
        if (teamHeader) {
          currentTeam = teamHeader;
        }
        
        // Iterar sobre las filas de jugadores
        $table.find('tr').each((rowIndex, row) => {
          const $row = $(row);
          const cells = $row.find('td');
          
          if (cells.length >= 2) {
            const playerName = $(cells[0]).text().trim();
            
            // Saltar encabezados o filas vacías
            if (!playerName || playerName.toLowerCase().includes('jugador')) {
              return;
            }
            
            // Extraer estadísticas (pueden variar según el formato de isquad)
            const stats = {
              playerName,
              team: currentTeam || 'Unknown',
              minutes: this.extractMinutes($row),
              goals: this.extractStat($row, ['gol', 'goles']),
              assists: this.extractStat($row, ['asist', 'pase']),
              yellowCards: this.extractStat($row, ['amarilla', 'yellow']),
              redCards: this.extractStat($row, ['roja', 'red', 'expuls'])
            };
            
            playerStats.push(stats);
          }
        });
      });
      
      console.log(`✅ Extracted stats for ${playerStats.length} players`);
      return playerStats;
      
    } catch (error) {
      console.error(`❌ Error scraping match report:`, error.message);
      throw error;
    } finally {
      await page.close();
    }
  }

  /**
   * Extrae los minutos jugados de una fila
   */
  extractMinutes($row) {
    const text = $row.text();
    
    // Buscar patrones como "90'" o "(90 min)"
    const minutesMatch = text.match(/(\d{1,2})['']?\s*min/i) || 
                        text.match(/\((\d{1,2})\)/);
    
    if (minutesMatch) {
      const minutes = parseInt(minutesMatch[1]);
      return Math.min(90, Math.max(0, minutes));
    }
    
    // Si jugó (está en la lista), asumir 90 minutos por defecto
    return 90;
  }

  /**
   * Extrae una estadística específica de una fila
   */
  extractStat($row, keywords) {
    const text = $row.text().toLowerCase();
    
    for (const keyword of keywords) {
      // Buscar patrones como "2 goles" o "gol (2)"
      const regex = new RegExp(`(\\d+)\\s*${keyword}|${keyword}\\s*\\(?(\\d+)\\)?`, 'i');
      const match = text.match(regex);
      
      if (match) {
        return parseInt(match[1] || match[2]);
      }
      
      // Si solo aparece la palabra clave, contar 1
      if (text.includes(keyword)) {
        return 1;
      }
    }
    
    return 0;
  }

  /**
   * Normaliza URLs relativas a absolutas
   */
  normalizeUrl(url, baseUrl) {
    if (!url) return null;
    
    if (url.startsWith('http')) {
      return url;
    }
    
    const base = new URL(baseUrl);
    return new URL(url, base.origin).href;
  }

  /**
   * Parsea una fecha en formato español
   */
  parseDate(dateText) {
    try {
      // Formatos comunes: "DD/MM/YYYY", "DD-MM-YYYY"
      const parts = dateText.split(/[\/\-\s]+/);
      
      if (parts.length >= 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // Meses en JS van de 0-11
        const year = parseInt(parts[2]);
        
        return new Date(year, month, day);
      }
      
      return new Date();
    } catch (error) {
      console.error('Error parsing date:', dateText);
      return new Date();
    }
  }

  /**
   * Scrapea múltiples partidos en paralelo (con límite de concurrencia)
   */
  async scrapeMatchesBatch(matchUrls, maxConcurrent = 3) {
    const results = [];
    const chunks = [];
    
    // Dividir en lotes
    for (let i = 0; i < matchUrls.length; i += maxConcurrent) {
      chunks.push(matchUrls.slice(i, i + maxConcurrent));
    }
    
    // Procesar cada lote
    for (const chunk of chunks) {
      const promises = chunk.map(url => 
        this.scrapeMatchReport(url).catch(error => {
          console.error(`Failed to scrape ${url}:`, error.message);
          return null;
        })
      );
      
      const chunkResults = await Promise.all(promises);
      results.push(...chunkResults.filter(r => r !== null));
      
      // Pequeña pausa entre lotes para no sobrecargar el servidor
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return results;
  }
}

module.exports = new ScraperService();
