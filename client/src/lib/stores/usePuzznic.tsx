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

export type GamePhase = "ready" | "playing" | "level_complete" | "game_over" | "game_won" | "editing";

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
  currentEditingBlockType: number;
  userLevels: number[][][];
  isTestingCustomLevel: boolean;
  testLevelIndex: number;
  
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
  
  // Editor-specific actions
  enterEditMode: () => void;
  exitEditMode: () => void;
  testLevel: () => boolean;
  createEmptyLevel: () => void;
  placeEditorBlock: (x: number, y: number, blockType: number) => void;
  removeEditorBlock: (x: number, y: number) => void;
  setEditorBlockType: (blockType: number) => void;
  saveUserLevel: () => void;
  loadUserLevel: (index: number) => void;
  generateLevelData: () => number[][];
}

export const usePuzznic = create<PuzznicState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    gamePhase: "ready" as GamePhase,
    level: 1,
    maxLevel: Levels.length,
    score: 0,
    moveCount: 0,
    timeLeft: 180, // 3 minutes per level
    board: [] as (BlockType | null)[][], 
    selectedBlockPos: null,
    currentLevelData: [] as number[][],
    blockTypes: 6, // Default number of block types
    currentEditingBlockType: 2, // Start with block type 2 (type 1 is usually reserved for floors)
    userLevels: [] as number[][][], // Array to store user-created levels
    isTestingCustomLevel: false, // Flag to track if we're testing a custom level
    testLevelIndex: -1, // Index of the test level in userLevels array
    
    // Helper function to validate level data
    validateLevelData: (levelData: number[][]) => {
      // Removed even-block validation requirement
      // Always return true to allow any number of blocks in custom levels
      return true;
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
      
      // Timer functionality removed - no time limit

      // Apply gravity immediately when the game starts
      setTimeout(() => {
        const { applyGravity } = get();
        applyGravity();
      }, 500);
    },
    
    // Select a block at given position
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
      
      // Safety check: ensure the coordinates are valid
      if (y < 0 || y >= board.length || x < 0 || x >= board[0].length) {
        console.warn("Invalid selected block position", selectedBlockPos);
        return;
      }
      
      // Safety check: ensure the selected block exists
      if (!board[y][x]) {
        console.warn("No block at selected position", selectedBlockPos);
        return;
      }
      
      // Create a deep copy of the board
      const newBoard = board.map(row => row.map(block => 
        block === null ? null : { ...block }
      ));
      
      // Calculate new position
      const newX = direction === 'left' ? x - 1 : x + 1;
      
      // Check if move is valid (in bounds and destination is empty)
      if (newX >= 0 && newX < board[0].length && newBoard[y][newX] === null) {
        // Get the current block safely
        const currentBlock = newBoard[y][x];
        
        // Only proceed if the current block exists
        if (currentBlock) {
          // Move the block with all properties intact
          newBoard[y][newX] = { 
            ...currentBlock, 
            x: newX, 
            y,
            // No need to access isFloor separately since we're copying the entire object
          };
          newBoard[y][x] = null;
          
          // Update selection
          newBoard[y][newX].selected = true;
          
          set({ 
            board: newBoard,
            selectedBlockPos: { x: newX, y },
            moveCount: get().moveCount + 1
          });
          
          // After moving, check for matches and apply gravity
          // Use the same delay as our falling animation for consistency
          const MOVE_DELAY = 300;
          setTimeout(() => {
            const { checkMatches } = get();
            checkMatches();
          }, MOVE_DELAY);
        }
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
        // Use consistent delay for all animations
        const ANIMATION_DELAY = 300;
        
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
          }, ANIMATION_DELAY);
        }, ANIMATION_DELAY);
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
        
        // Use a consistent falling speed for all blocks
        // We use a constant delay regardless of whether the block was previously moved horizontally
        const FALL_ANIMATION_DELAY = 300; // Slightly slower for more natural feel
        
        // Move falling blocks down
        // Start animation and give time for visual effect
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
          }, FALL_ANIMATION_DELAY); // Consistent delay between gravity steps
        }, FALL_ANIMATION_DELAY); // Consistent time for animation to complete
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
      const { isTestingCustomLevel, testLevelIndex } = get();
      
      if (isTestingCustomLevel && testLevelIndex >= 0) {
        // We're testing a custom level, so reload it instead of the standard level
        const { initGame } = get();
        initGame(); // This will initialize with the current level (which is 1, the default)
        
        // Auto-start and load the custom level
        setTimeout(() => {
          const { startGame, loadUserLevel } = get();
          startGame();
          loadUserLevel(testLevelIndex);
        }, 300);
      } else {
        // Normal level restart
        const { initGame } = get();
        initGame();
        
        // Auto-start with gravity after a brief delay to show the initial state
        setTimeout(() => {
          const { startGame } = get();
          startGame();
        }, 300);
      }
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
    
    // Timer function - disabled
    decrementTime: () => {
      // Timer functionality removed - no time limit
      // This function is kept as a stub to maintain existing function signatures
      return;
    },
    
    // Editor mode functions
    enterEditMode: () => {
      // Clear any existing game timer
      const { timerId } = get();
      if (timerId) {
        clearInterval(timerId);
      }
      
      // Check if we're returning from testing a custom level
      const { isTestingCustomLevel, testLevelIndex, userLevels } = get();
      
      if (isTestingCustomLevel && testLevelIndex >= 0 && testLevelIndex < userLevels.length) {
        // We're returning from a test session, so load the level we were testing
        // First set the game phase to editing
        set({ gamePhase: "editing" });
        
        // Then load the level we were testing
        // Use consistent delay for all animations
        const ANIMATION_DELAY = 300;
        setTimeout(() => {
          const { loadUserLevel } = get();
          loadUserLevel(testLevelIndex);
        }, ANIMATION_DELAY);
      } else {
        // Standard editor entry - create an empty level
        const { createEmptyLevel } = get();
        createEmptyLevel();
        
        // Set gamePhase to editing
        set({ gamePhase: "editing" });
      }
    },
    
    exitEditMode: () => {
      // Return to main menu state without starting the game
      set({ 
        gamePhase: "ready",
        level: 1,  // Reset to level 1, but don't actually start the game
        isTestingCustomLevel: false,
        testLevelIndex: -1
      });
      
      // Reinitialize game to ensure we're back at the main menu
      const ANIMATION_DELAY = 300;
      setTimeout(() => {
        const { initGame } = get();
        initGame();
      }, ANIMATION_DELAY);
    },
    
    testLevel: () => {
      // Save the current level data for testing
      const { generateLevelData } = get();
      const levelData = generateLevelData();
      
      // No validation required - any level can be tested now
      
      // Store the current level as a temporary test level
      const currentUserLevels = get().userLevels;
      const tempUserLevels = [...currentUserLevels, levelData];
      
      // Set up testing state - use the last index of the temporary levels array
      const testLevelIndex = tempUserLevels.length - 1;
      
      // Set the game state to ready, then start the game with the test level
      set({ 
        gamePhase: "ready",
        userLevels: tempUserLevels,
        level: 1,
        isTestingCustomLevel: true,
        testLevelIndex: testLevelIndex
      });
      
      // Start the game with the test level
      const ANIMATION_DELAY = 300;
      setTimeout(() => {
        const { startGame } = get();
        startGame();
        
        // Load the test level
        const { loadUserLevel } = get();
        loadUserLevel(testLevelIndex);
      }, ANIMATION_DELAY);
      
      return true;
    },
    
    createEmptyLevel: () => {
      // Create an 8x8 completely empty grid
      const emptyLevel: number[][] = Array(8).fill(0).map(() => Array(8).fill(0));
      
      // Create a board from this level data
      const rows = emptyLevel.length;
      const cols = emptyLevel[0].length;
      const board: (BlockType | null)[][] = Array(rows).fill(0).map(() => 
        Array(cols).fill(null)
      );
      
      // Populate board
      for (let gameY = 0; gameY < rows; gameY++) {
        // Convert game Y-coordinate to level data Y-coordinate
        const levelY = rows - gameY - 1;
        
        for (let x = 0; x < cols; x++) {
          const value = emptyLevel[levelY][x];
          if (value > 0) {
            // Floor blocks are at the bottom (gameY=0) and are type 1
            const isFloor = gameY === 0 && value === 1;
            
            board[gameY][x] = {
              id: gameY * cols + x,
              type: value,
              x,
              y: gameY,
              selected: false,
              matched: false,
              falling: false,
              isFixed: isFloor,
              isFloor: isFloor
            };
          }
        }
      }
      
      set({ 
        board,
        currentLevelData: emptyLevel,
        selectedBlockPos: null
      });
    },
    
    placeEditorBlock: (x, y, blockType) => {
      const { board, gamePhase } = get();
      
      if (gamePhase !== "editing") return;
      
      // Create a deep copy of the board
      const newBoard = board.map(row => row.map(block => 
        block === null ? null : { ...block }
      ));
      
      // Check if position is valid
      if (y >= 0 && y < newBoard.length && x >= 0 && x < newBoard[0].length) {
        // Allow placing any blocks anywhere in the editor
        
        // Place new block or replace existing one
        newBoard[y][x] = {
          id: y * newBoard[0].length + x,
          type: blockType,
          x,
          y,
          selected: false,
          matched: false,
          falling: false,
          isFixed: blockType === 1, // Floor blocks (type 1) are fixed
          isFloor: blockType === 1  // Floor blocks (type 1) have isFloor=true
        };
        
        set({ board: newBoard });
        
        // Update the current level data based on the board
        const { generateLevelData } = get();
        const updatedLevelData = generateLevelData();
        set({ currentLevelData: updatedLevelData });
      }
    },
    
    removeEditorBlock: (x, y) => {
      const { board, gamePhase } = get();
      
      if (gamePhase !== "editing") return;
      
      // Create a deep copy of the board
      const newBoard = board.map(row => row.map(block => 
        block === null ? null : { ...block }
      ));
      
      // Check if position is valid
      if (y >= 0 && y < newBoard.length && x >= 0 && x < newBoard[0].length) {
        // All block types can be removed in editor
        
        // Remove block
        newBoard[y][x] = null;
        
        set({ board: newBoard });
        
        // Update the current level data
        const { generateLevelData } = get();
        const updatedLevelData = generateLevelData();
        set({ currentLevelData: updatedLevelData });
      }
    },
    
    setEditorBlockType: (blockType) => {
      set({ currentEditingBlockType: blockType });
    },
    
    saveUserLevel: () => {
      const { currentLevelData, userLevels } = get();
      
      // No validation needed - any level design is allowed now
      
      // Add the level to user levels
      const updatedUserLevels = [...userLevels, JSON.parse(JSON.stringify(currentLevelData))];
      set({ userLevels: updatedUserLevels });
      
      // Update max level count to include user levels
      set({ maxLevel: Levels.length + updatedUserLevels.length });
    },
    
    loadUserLevel: (index) => {
      const { userLevels } = get();
      
      if (index >= 0 && index < userLevels.length) {
        const levelData = userLevels[index];
        
        // Create a board from this level data
        const rows = levelData.length;
        const cols = levelData[0].length;
        const board: (BlockType | null)[][] = Array(rows).fill(0).map(() => 
          Array(cols).fill(null)
        );
        
        // Populate board
        for (let gameY = 0; gameY < rows; gameY++) {
          // Convert game Y-coordinate to level data Y-coordinate
          const levelY = rows - gameY - 1;
          
          for (let x = 0; x < cols; x++) {
            const value = levelData[levelY][x];
            if (value > 0) {
              // Any block of type 1 is a floor block
              const isFloor = value === 1;
              
              board[gameY][x] = {
                id: gameY * cols + x,
                type: value,
                x,
                y: gameY,
                selected: false,
                matched: false,
                falling: false,
                isFixed: isFloor,
                isFloor: isFloor
              };
            }
          }
        }
        
        set({ 
          board,
          currentLevelData: levelData,
          selectedBlockPos: null
        });
      }
    },
    
    generateLevelData: () => {
      const { board } = get();
      
      // Create a grid representation of the current board
      const rows = board.length;
      const cols = board[0].length;
      const levelData: number[][] = Array(rows).fill(0).map(() => Array(cols).fill(0));
      
      // Fill the grid based on the board
      for (let gameY = 0; gameY < rows; gameY++) {
        // Convert game Y-coordinate to level data Y-coordinate
        const levelY = rows - gameY - 1;
        
        for (let x = 0; x < cols; x++) {
          if (board[gameY][x] !== null) {
            levelData[levelY][x] = board[gameY][x]!.type;
          }
        }
      }
      
      return levelData;
    }
  }))
);
