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
  isFixed: boolean; // Property to identify blocks that shouldn't move (like floors)
  isFloor: boolean; // Property to specifically identify floor blocks (type 1 at bottom)
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
  validateLevelData: (levelData: number[][]) => boolean;
  initGame: () => void;
  startGame: () => void;
  selectBlock: (x: number, y: number) => void;
  moveSelectedBlock: (direction: 'left' | 'right') => void;
  checkMatches: () => void;
  boardHasBlocksThatCanFall: (board: (BlockType | null)[][]) => boolean;
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
    
    // Helper function to validate level data
    validateLevelData: (levelData: number[][]) => {
      const blockCounts: Record<number, number> = {};
      
      // Identify the floor blocks which are typically at the bottom rows
      const floorBlocks: Set<string> = new Set();
      
      // First find all rows that look like floor rows (rows with many type 1 blocks at the bottom)
      const potentialFloorRows: number[] = [];
      for (let y = levelData.length - 1; y >= Math.max(0, levelData.length - 3); y--) {
        // Check if this row has type 1 blocks (typical floor blocks)
        const type1Count = levelData[y].filter(value => value === 1).length;
        if (type1Count >= 3) { // If there are several type 1 blocks, this is likely a floor row
          potentialFloorRows.push(y);
          
          // Mark all type 1 blocks in this row as floor blocks
          for (let x = 0; x < levelData[y].length; x++) {
            if (levelData[y][x] === 1) {
              floorBlocks.add(`${y},${x}`);
            }
          }
        }
      }
      
      // Now count all non-floor blocks
      for (let y = 0; y < levelData.length; y++) {
        for (let x = 0; x < levelData[y].length; x++) {
          const blockType = levelData[y][x];
          const isFloorBlock = floorBlocks.has(`${y},${x}`);
          
          // Count only non-floor, non-zero blocks
          if (blockType > 0 && !isFloorBlock) {
            blockCounts[blockType] = (blockCounts[blockType] || 0) + 1;
          }
        }
      }
      
      // Check if all block types have an even count
      let isValid = true;
      const blockTypeErrors: number[] = [];
      
      for (const blockType in blockCounts) {
        if (blockCounts[blockType] % 2 !== 0) {
          isValid = false;
          blockTypeErrors.push(parseInt(blockType));
        }
      }
      
      // Log warning if level is not valid
      if (!isValid) {
        console.warn(`Level validation failed: Block types ${blockTypeErrors.join(', ')} have odd counts.`);
      }
      
      return isValid;
    },
    
    // Game initialization
    initGame: () => {
      const { level, validateLevelData } = get();
      const levelData = Levels[level - 1] || Levels[0];
      
      // Validate level data to ensure it's beatable
      validateLevelData(levelData);
      
      // Create empty board
      const rows = levelData.length;
      const cols = levelData[0].length;
      const board: (BlockType | null)[][] = Array(rows).fill(0).map(() => 
        Array(cols).fill(null)
      );
      
      // Populate board from level data
      // Important: Level data is stored with the top row first, but we need to
      // convert to game coordinates where the bottom row is at y=0
      // We'll also handle the special case of the top row of red blocks
      
      // First, determine if there's a top row of all red blocks (type 1)
      // This is a common pattern in Puzznic levels but causes issues in our implementation
      const hasTopRowOfRedBlocks = levelData[0].every(value => value === 1 || value === 0);
      const skipTopRow = hasTopRowOfRedBlocks;
      
      for (let gameY = 0; gameY < rows; gameY++) {
        // Convert game Y-coordinate to level data Y-coordinate
        // In level data, the first row is the top; in our game state, the first row is the bottom
        const levelY = rows - gameY - 1;
        
        // Skip the top row of red blocks if needed
        if (skipTopRow && levelY === 0) continue;
        
        for (let x = 0; x < cols; x++) {
          const value = levelData[levelY][x];
          if (value > 0) {
            // Floor blocks are at the bottom (gameY=0) and are typically type 1
            // Important: Only blocks at the very bottom should be fixed floor blocks
            // Red blocks (type 1) anywhere else should behave like normal blocks
            const isFloor = gameY === 0 && value === 1;
            
            board[gameY][x] = {
              id: gameY * cols + x,
              type: value,
              x,
              y: gameY,
              selected: false,
              matched: false,
              falling: false,
              isFixed: isFloor, // Mark floor blocks as fixed
              isFloor: isFloor // Also explicitly mark them as floor blocks
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
        newBoard[y][newX] = { 
          ...newBoard[y][x]!, 
          x: newX, 
          y,
          isFloor: newBoard[y][x]!.isFloor // Make sure to copy the isFloor property
        };
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
      const { board, boardHasBlocksThatCanFall } = get();
      
      // First check if any blocks can still fall - if so, don't do matching yet
      if (boardHasBlocksThatCanFall(board)) {
        // Continue applying gravity if blocks can still fall
        const { applyGravity } = get();
        applyGravity();
        return;
      }
      
      // Only proceed with matching once the board has settled completely
      
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
              !newBoard[y][x]!.falling && !newBoard[y][x+1]!.falling && // Don't match falling blocks
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
              !newBoard[y][x]!.falling && !newBoard[y+1][x]!.falling && // Don't match falling blocks
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
        // No matches found and board is settled, update game state
        const { updateGameState } = get();
        updateGameState();
      }
    },
    
    // Helper function to check if any blocks on the board can fall
    boardHasBlocksThatCanFall: (board: (BlockType | null)[][]) => {
      for (let y = 1; y < board.length; y++) {
        for (let x = 0; x < board[0].length; x++) {
          // Only consider non-fixed blocks that have empty space below
          if (board[y][x] !== null && board[y-1][x] === null && !board[y][x]!.isFixed) {
            return true; // Found at least one block that can fall
          }
        }
      }
      return false; // No more blocks can fall
    },
    
    // Apply gravity to make blocks fall (note: in our coordinate system, y=0 is at the bottom)
    applyGravity: () => {
      const { board, boardHasBlocksThatCanFall } = get();
      
      // Create a deep copy of the board
      const newBoard = board.map(row => row.map(block => 
        block === null ? null : { ...block }
      ));
      
      // Check if any blocks can fall
      const blocksFalling = boardHasBlocksThatCanFall(newBoard);
      
      if (blocksFalling) {
        // Mark blocks that should fall
        for (let y = 1; y < newBoard.length; y++) {
          for (let x = 0; x < newBoard[0].length; x++) {
            // Only make blocks fall if they're not fixed and have empty space below
            if (newBoard[y][x] !== null && newBoard[y-1][x] === null && !newBoard[y][x]!.isFixed) {
              newBoard[y][x]!.falling = true;
            }
          }
        }
        
        set({ board: newBoard });
        
        // Move falling blocks down
        // Start animation and give time for visual effect (250ms)
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
                  falling: false,
                  isFloor: false // A falling block can't be a floor block
                };
                updatedBoard[y][x] = null;
              } else if (updatedBoard[y][x] !== null && updatedBoard[y][x]!.falling) {
                // Block can't fall anymore
                updatedBoard[y][x]!.falling = false;
              }
            }
          }
          
          set({ board: updatedBoard });
          
          // Apply gravity again if needed, but only check for matches 
          // when the entire board has settled (no more blocks can fall)
          setTimeout(() => {
            const { applyGravity, boardHasBlocksThatCanFall, checkMatches } = get();
            const currentBoard = get().board;
            
            if (boardHasBlocksThatCanFall(currentBoard)) {
              // Some blocks can still fall, apply gravity again
              applyGravity();
            } else {
              // Board is settled, now check for matches
              // No need to manually call updateGameState here as checkMatches will handle it 
              // when there are no more matches and the board is fully settled
              checkMatches();
            }
          }, 250); // Shorter delay between gravity steps
        }, 250); // Time for animation to complete
      } else {
        // No blocks are falling, board is settled, check for matches
        // checkMatches will handle updateGameState when there are no more matches
        const { checkMatches } = get();
        checkMatches();
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
