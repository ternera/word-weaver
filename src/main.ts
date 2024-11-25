// Word Weaver - A Devvit App
import { Devvit } from '@devvit/public-api';

// Define the state of the game
interface GameState {
    currentWord: string;      // The current word in the chain
    wordChain: string[];      // The chain of words built so far
    usedLetters: Set<string>; // Letters used in the chain
    playerScores: Record<string, number>; // Player scores
    currentPlayer: string;    // The current player's ID
    timeLimit: number;        // Time limit for each turn (ms)
}

const INITIAL_STATE: GameState = {
    currentWord: '',
    wordChain: [],
    usedLetters: new Set<string>(),
    playerScores: {},
    currentPlayer: '',
    timeLimit: 30000, // 30 seconds
};

let gameState: GameState = { ...INITIAL_STATE };

// Helper function to check if the new word is valid
function isWordValid(word: string, state: GameState): boolean {
    if (state.wordChain.includes(word)) {
        return false; // Word has already been used
    }
    for (const letter of word) {
        if (state.currentWord.includes(letter)) {
            return true; // Shares at least one letter
        }
    }
    return false;
}

// Function to calculate score based on word length
function calculateScore(word: string): number {
    return word.length; // Simple scoring based on length
}

// Initialize the app
Devvit.addFunctionality({
    onStart: ({ context, input }) => {
        const startingWord = input?.startingWord || 'start';
        gameState.currentWord = startingWord;
        gameState.wordChain = [startingWord];
        gameState.usedLetters = new Set([...startingWord]);
        return {
            message: `Game started with the word: ${startingWord}`,
        };
    },

    onAction: async ({ context, input }) => {
        const playerId = context.user.id;
        const newWord = input?.word;

        if (!newWord) {
            return { message: 'No word provided!' };
        }

        if (!isWordValid(newWord, gameState)) {
            return { message: 'Invalid word! It must share at least one letter with the current word and not be reused.' };
        }

        // Update state
        gameState.currentWord = newWord;
        gameState.wordChain.push(newWord);
        gameState.usedLetters = new Set([...gameState.usedLetters, ...newWord]);

        if (!gameState.playerScores[playerId]) {
            gameState.playerScores[playerId] = 0;
        }
        gameState.playerScores[playerId] += calculateScore(newWord);

        // Switch to the next player (basic round-robin)
        gameState.currentPlayer = Object.keys(gameState.playerScores)[
            (Object.keys(gameState.playerScores).indexOf(playerId) + 1) %
                Object.keys(gameState.playerScores).length
        ];

        return {
            message: `Word accepted! The new word is '${newWord}'. Current score: ${gameState.playerScores[playerId]}.
                      Next player: ${gameState.currentPlayer}`,
        };
    },

    onTimeout: ({ context }) => {
        return {
            message: `Time's up for player ${gameState.currentPlayer}. Moving to the next player.`,
        };
    },

    onEnd: () => {
        const winner = Object.entries(gameState.playerScores).reduce((a, b) =>
            b[1] > a[1] ? b : a
        );

        const leaderboard = Object.entries(gameState.playerScores)
            .sort(([, a], [, b]) => b - a)
            .map(([player, score]) => `${player}: ${score}`)
            .join('\n');

        return {
            message: `Game over! Winner: ${winner[0]} with ${winner[1]} points.
                      Leaderboard:\n${leaderboard}`,
        };
    },
});

export default Devvit;