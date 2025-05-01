import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { Levels } from "../../components/game/Levels";

export type BlockType = {
  id: number;
  type: number;
  x: number;
  y: number;
  selected: boolean;
  matched: boolean;
  falling: boolean;
  isFixed?: boolean; // New property to identify blocks that shouldn't move
};

export type GamePhase = "ready" | "playing" | "level_complete" | "game_over" | "game_won";

interface PuzznicState {
  // Game state
  gamePhase: GamePhase;
  level: number;
  maxLevel: number;
  score: number;
  moveCount: number;
  timeLeft: number;
  board: (BlockType | null)[][];
  selectedBlockPos: { x: number, y: number } | null;
  timerId?: NodeJS.Timeout;
  
  // Level data
  currentLevelData: number[][];
  blockTypes: number;
  
  // Actions
  initGame: () => void;
  startGame: () => void;
  selectBlock: (x: number, y: number) => void;
  moveSelectedBlock: (direction: 'left' | 'right') => void;
  checkMatches: () => void;
  applyGravity: () => void;
  updateGameState: () => void;
  restartLevel: () => void;
  nextLevel: () => void;
  decrementTime: () => void;
}

export const usePuzznic = create<PuzznicState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    gamePhase: "ready",
    level: 1,
    maxLevel: Levels.length,
    score: 0,
    moveCount: 0,
    timeLeft: 180, // 3 minutes per level
    board: [], 
    selectedBlockPos: null,
    currentLevelData: [],
    blockTypes: 6, // Default number of block types
    
    // Game initialization
    initGame: () => {
      const { level } = get();
      const levelData = Levels[level - 1] || Levels[0];
      
      // Create empty board
      const rows = levelData.length;
      const cols = levelData[0].length;
      const board: (BlockType | null)[][] = Array(rows).fill(0).map(() => 
        Array(cols).fill(null)
      );
      
      // Populate board from level data
      // Important: Level data is stored with the top row first, but we need to
      // convert to game coordinates where the bottom row is at y=0
      for (let gameY = 0; gameY < rows; gameY++) {
        // Convert game Y-coordinate to level data Y-coordinate
        // In level data, the first row is the top; in our game state, the first row is the bottom
        const levelY = rows - gameY - 1;
        
        for (let x = 0; x < cols; x++) {
          const value = levelData[levelY][x];
          if (value > 0) {
            // Floor blocks are at the bottom (gameY=0) and are typically type 1
            const isFloor = gameY === 0 && value === 1;
            
            board[gameY][x] = {
              id: gameY * cols + x,
              type: value,
              x,
              y: gameY,
              selected: false,
              matched: false,
              falling: false,
              isFixed: isFloor // Mark floor blocks as fixed
            };
          }
        }
      }
      
      set({ 
        gamePhase: "ready",
        board,
        currentLevelData: levelData,
        selectedBlockPos: null,
        timeLeft: 180,
        score: get().score, // Maintain score between levels
        moveCount: 0
      });
    },
    
    // Start game
    startGame: () => {
      set({ gamePhase: "playing" });
      
      // Start the timer
      const timer = setInterval(() => {
        const { decrementTime } = get();
        decrementTime();
      }, 1000);
      
      // Store the timer ID so we can clear it later
      set({ timerId: timer });
      
      // Apply gravity immediately when the game starts
      setTimeout(() => {
        const { applyGravity } = get();
        applyGravity();
      }, 500);
    },
    
    // Select a block
    selectBlock: (x, y) => {
      const { board, gamePhase } = get();
      
      if (gamePhase !== "playing") return;
      
      // Create a deep copy of the board
      const newBoard = board.map(row => row.map(block => 
        block === null ? null : { ...block }
      ));
      
      // Clear existing selection
      newBoard.forEach(row => {
        row.forEach(block => {
          if (block !== null) {
            block.selected = false;
          }
        });
      });
      
      // Check if the position is valid and has a block
      if (y >= 0 && y < newBoard.length && 
          x >= 0 && x < newBoard[y].length && 
          newBoard[y][x] !== null) {
        
        // Select the new block if it's not already matched, not falling, and not fixed
        const block = newBoard[y][x];
        if (block && !block.matched && !block.falling && !block.isFixed) {
          block.selected = true;
          
          set({ 
            board: newBoard,
            selectedBlockPos: { x, y }
          });
        } else {
          // No valid block to select
          set({ 
            board: newBoard,
            selectedBlockPos: null
          });
        }
      } else {
        // No valid block to select
        set({ 
          board: newBoard,
          selectedBlockPos: null
        });
      }
    },
    
    // Move selected block
    moveSelectedBlock: (direction) => {
      const { board, selectedBlockPos, gamePhase } = get();
      
      if (gamePhase !== "playing" || !selectedBlockPos) return;
      
      const { x, y } = selectedBlockPos;
      const newBoard = board.map(row => row.map(block => 
        block === null ? null : { ...block }
      ));
      
      // Calculate new position
      const newX = direction === 'left' ? x - 1 : x + 1;
      
      // Check if move is valid (in bounds and destination is empty)
      if (newX >= 0 && newX < board[0].length && newBoard[y][newX] === null) {
        // Move the block
        newBoard[y][newX] = { ...newBoard[y][x]!, x: newX, y };
        newBoard[y][x] = null;
        
        // Update selection
        newBoard[y][newX]!.selected = true;
        
        set({ 
          board: newBoard,
          selectedBlockPos: { x: newX, y },
          moveCount: get().moveCount + 1
        });
        
        // After moving, check for matches and apply gravity
        setTimeout(() => {
          const { checkMatches } = get();
          checkMatches();
        }, 100);
      }
    },
    
    // Check for matching blocks
    checkMatches: () => {
      const { board } = get();
      
      // Create a deep copy of the board
      const newBoard = board.map(row => row.map(block => 
        block === null ? null : { ...block }
      ));
      
      let matchFound = false;
      let matchScore = 0;
      
      // Check horizontal matches (at least 2 same blocks)
      for (let y = 0; y < newBoard.length; y++) {
        for (let x = 0; x < newBoard[0].length - 1; x++) {
          if (newBoard[y][x] !== null && newBoard[y][x+1] !== null && 
              !newBoard[y][x]!.isFixed && !newBoard[y][x+1]!.isFixed &&
              newBoard[y][x]!.type === newBoard[y][x+1]!.type) {
            // Mark blocks as matched
            newBoard[y][x]!.matched = true;
            newBoard[y][x+1]!.matched = true;
            matchFound = true;
            matchScore += 10;
          }
        }
      }
      
      // Check vertical matches (at least 2 same blocks)
      for (let y = 0; y < newBoard.length - 1; y++) {
        for (let x = 0; x < newBoard[0].length; x++) {
          if (newBoard[y][x] !== null && newBoard[y+1][x] !== null && 
              !newBoard[y][x]!.isFixed && !newBoard[y+1][x]!.isFixed &&
              newBoard[y][x]!.type === newBoard[y+1][x]!.type) {
            // Mark blocks as matched
            newBoard[y][x]!.matched = true;
            newBoard[y+1][x]!.matched = true;
            matchFound = true;
            matchScore += 10;
          }
        }
      }
      
      if (matchFound) {
        // Update board and score
        set({ 
          board: newBoard,
          score: get().score + matchScore
        });
        
        // Remove matched blocks after delay
        setTimeout(() => {
          const { board } = get();
          const updatedBoard = board.map(row => row.map(block => 
            block === null || block.matched ? null : { ...block }
          ));
          
          set({ board: updatedBoard });
          
          // Apply gravity after removing blocks
          setTimeout(() => {
            const { applyGravity } = get();
            applyGravity();
          }, 300);
        }, 500);
      } else {
        // No matches found, just apply gravity
        const { applyGravity } = get();
        applyGravity();
      }
    },
    
    // Apply gravity to make blocks fall (note: in our coordinate system, y=0 is at the bottom)
    applyGravity: () => {
      const { board } = get();
      
      // Create a deep copy of the board
      const newBoard = board.map(row => row.map(block => 
        block === null ? null : { ...block }
      ));
      
      let blocksFalling = false;
      
      // Mark blocks that should fall - in our coordinate system y decreases as we go down
      // so we start from 1 (second row from bottom) and check if there's empty space below
      for (let y = 1; y < newBoard.length; y++) {
        for (let x = 0; x < newBoard[0].length; x++) {
          // Only make blocks fall if they're not fixed (e.g. not floor blocks)
          if (newBoard[y][x] !== null && newBoard[y-1][x] === null && !newBoard[y][x]!.isFixed) {
            newBoard[y][x]!.falling = true;
            blocksFalling = true;
          }
        }
      }
      
      // If blocks are falling, update the board
      if (blocksFalling) {
        set({ board: newBoard });
        
        // Move falling blocks down
        setTimeout(() => {
          const { board } = get();
          const updatedBoard = board.map(row => row.map(block => 
            block === null ? null : { ...block }
          ));
          
          // Move blocks down - in our system, moving down means y decreases
          for (let y = 1; y < updatedBoard.length; y++) {
            for (let x = 0; x < updatedBoard[0].length; x++) {
              if (updatedBoard[y][x] !== null && updatedBoard[y][x]!.falling && updatedBoard[y-1][x] === null) {
                // Move block down (decrease y)
                updatedBoard[y-1][x] = { 
                  ...updatedBoard[y][x]!, 
                  y: y-1,  // Update the y coordinate to match new position
                  falling: false
                };
                updatedBoard[y][x] = null;
              } else if (updatedBoard[y][x] !== null && updatedBoard[y][x]!.falling) {
                // Block can't fall anymore
                updatedBoard[y][x]!.falling = false;
              }
            }
          }
          
          set({ board: updatedBoard });
          
          // Continue applying gravity until no more blocks are falling
          setTimeout(() => {
            const { applyGravity, checkMatches, updateGameState } = get();
            
            // Check for new matches
            checkMatches();
            
            // Update game state after chain reactions
            updateGameState();
          }, 300);
        }, 200);
      } else {
        // No blocks are falling, update game state
        const { updateGameState } = get();
        updateGameState();
      }
    },
    
    // Update game state (check for level completion, game over, etc.)
    updateGameState: () => {
      const { board, level, maxLevel } = get();
      
      // Check if all non-fixed blocks are cleared
      let nonFixedBlocksRemaining = false;
      
      for (let y = 0; y < board.length; y++) {
        for (let x = 0; x < board[0].length; x++) {
          // Only consider blocks that are not fixed (e.g., not floor blocks)
          if (board[y][x] !== null && !board[y][x]!.isFixed) {
            nonFixedBlocksRemaining = true;
            break;
          }
        }
        if (nonFixedBlocksRemaining) break;
      }
      
      if (!nonFixedBlocksRemaining) {
        // Level complete!
        if (level === maxLevel) {
          // Game won!
          set({ gamePhase: "game_won" });
        } else {
          // Move to next level
          set({ gamePhase: "level_complete" });
        }
      }
    },
    
    // Restart current level
    restartLevel: () => {
      const { initGame } = get();
      initGame();
      
      // Auto-start with gravity after a brief delay to show the initial state
      setTimeout(() => {
        const { startGame } = get();
        startGame();
      }, 300);
    },
    
    // Go to next level
    nextLevel: () => {
      set((state) => ({ 
        level: Math.min(state.level + 1, state.maxLevel)
      }));
      
      const { initGame } = get();
      initGame();
      
      // Start game with the initial gravity
      setTimeout(() => {
        const { startGame } = get();
        startGame();
      }, 300);
    },
    
    // Decrement time left
    decrementTime: () => {
      const { timeLeft, gamePhase } = get();
      
      if (gamePhase !== "playing") return;
      
      if (timeLeft > 0) {
        set({ timeLeft: timeLeft - 1 });
      } else {
        // Time's up! Game over
        set({ gamePhase: "game_over" });
      }
    }
  }))
);
