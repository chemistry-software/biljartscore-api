import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import sqlite3 from 'sqlite3';
import cors from 'cors';

interface Player {
    lastName: string;
    firstName: string;
    pointsNeeded: number;
}

interface Game {
    id: number;
    player1: Player;
    player2: Player;
    turnsTaken: number;
    pointsPlayer1: number;
    pointsPlayer2: number;
    state: 'ongoing' | 'draw' | 'maxedTurns' | 'playerOneWon' | 'playerTwoWon';
}

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// Create SQLite database connection
// const db = new sqlite3.Database(':memory:'); // Or provide a path to a file for persistent storage
const db = new sqlite3.Database('bulthoes.db'); // Or provide a path to a file for persistent storage

// Initialize database schema
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS games (
            id INTEGER PRIMARY KEY,
            player1_lastName TEXT,
            player1_firstName TEXT,
            player1_pointsNeeded INTEGER,
            player2_lastName TEXT,
            player2_firstName TEXT,
            player2_pointsNeeded INTEGER,
            turnsTaken INTEGER,
            pointsPlayer1 INTEGER,
            pointsPlayer2 INTEGER,
            state TEXT,
            createdAt TEXT
        )
    `);
});

// Create a new game
app.post('/api/games', (req: Request, res: Response) => {
    const { player1, player2 }: { player1: Player; player2: Player } = req.body;
    const createdAt = new Date().toISOString();

    db.run(`
        INSERT INTO games (
            player1_lastName, player1_firstName, player1_pointsNeeded,
            player2_lastName, player2_firstName, player2_pointsNeeded,
            turnsTaken, pointsPlayer1, pointsPlayer2, state, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        player1.lastName, player1.firstName, player1.pointsNeeded,
        player2.lastName, player2.firstName, player2.pointsNeeded,
        0, 0, 0, 'ongoing', createdAt
    ], function(err) {
        if (err) {
            console.error('Error creating game:', err);
            res.status(500).send('Error creating game');
        } else {
            res.status(201).json({ id: this.lastID });
        }
    });
});

// Update a game
app.put('/api/games/:id', (req: Request, res: Response) => {
    const gameId: number = parseInt(req.params.id);
    const { pointsPlayer1, pointsPlayer2, state, turnsTaken }: { pointsPlayer1: number; pointsPlayer2: number; state: Game['state']; turnsTaken: number } = req.body;

    db.run(`
        UPDATE games
        SET pointsPlayer1 = ?, pointsPlayer2 = ?, state = ?, turnsTaken = ?
        WHERE id = ?
    `, [pointsPlayer1, pointsPlayer2, state, turnsTaken, gameId], function(err) {
        if (err) {
            console.error('Error updating game:', err);
            res.status(500).send('Error updating game');
        } else {
            res.status(200).json({ id: gameId });
        }
    });
});

// Get all games
app.get('/api/games', (req: Request, res: Response) => {
    db.all('SELECT * FROM games', (err, rows) => {
        if (err) {
            console.error('Error fetching games:', err);
            res.status(500).send('Error fetching games');
        } else {
            res.status(200).json(rows);
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
