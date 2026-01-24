// WebSocket Controller Module
// This module encapsulates all WebSocket-specific logic.
const WS = require("ws");
import * as http from "http";
import { Game } from "../models/Game";

/**
 * Initializes the WebSocket server and binds it to the existing HTTP server.
 * @param {http.Server} server - The HTTP server instance from Express.
 */

const initializeWs = (server: http.Server) => {
  // Create the WebSocket server instance bound to the HTTP server
  const wss = new WS.Server({ server });

  // Log the WebSocket status
  server.on("listening", () => {
    const address = server.address();
    const port = address && typeof address === "object" ? address.port : 0;
    console.log(`WebSocket running on ws://localhost:${port}`);
    console.log(`--------------------\n`);
  });

  // Function to broadcast a message to ALL connected clients
  const broadcast = (message: any) => {
    wss.clients.forEach((client: typeof WS) => {
      if (client.readyState === WS.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  };

  // Function to broadcast to specific game participants
  const broadcastToGame = (gameId: string, message: any) => {
    wss.clients.forEach((client: any) => {
      if (client.readyState === WS.OPEN && client.gameId === gameId) {
        client.send(JSON.stringify(message));
      }
    });
  };

  // Event handler for a new client connection
  wss.on("connection", (ws: any, req: Request) => {
    console.log(`\nNew Client Connected. Total Clients: ${wss.clients.size}`);

    // Initialize client properties
    ws.gameId = null;
    ws.userId = null;
    ws.isAlive = true;

    // Send initial status message to the new client
    ws.send(
      JSON.stringify({
        type: "STATUS",
        payload: "Successfully connected to the Node.js server.",
      }),
    );

    // Event handler for incoming messages from the client
    ws.on("message", async (message: any) => {
      const data = message.toString();
      console.log(`Received from client: ${data}`);

      try {
        const parsedData = JSON.parse(data);

        // Handle different message types
        switch (parsedData.type) {
          case "PLAYER_READY":
            await handleWaiting(ws, parsedData, broadcast);
          case "START_GAME":
            await handleStartGame(ws, parsedData, broadcastToGame);
            break;

          case "END_GAME":
          case "PLAYER_LOST":
            await handleEndGame(ws, parsedData, broadcastToGame);
            break;

          case "CHAT_MESSAGE":
            handleChatMessage(parsedData, broadcast);
            break;

          default:
            console.log("Unknown message type:", parsedData.type);
            ws.send(
              JSON.stringify({
                type: "ERROR",
                payload: "Unknown message type",
              }),
            );
        }
      } catch (error) {
        console.error("Error parsing client message:", error);
        ws.send(
          JSON.stringify({
            type: "ERROR",
            payload: "Invalid JSON message received.",
          }),
        );
      }
    });

    // Event handler for client disconnection
    ws.on("close", async () => {
      console.log(`Client Disconnected. Total Clients: ${wss.clients.size}`);

      // Handle game disconnect if user was in a game
      if (ws.gameId && ws.userId) {
        await handleDisconnect(ws, broadcastToGame);
      }
    });

    ws.on("error", (error: any) => {
      console.error("WebSocket Error:", error.message);
    });

    // Heartbeat to detect broken connections
    ws.on("pong", () => {
      ws.isAlive = true;
    });
  });

  // Heartbeat interval to check for broken connections
  const interval = setInterval(() => {
    wss.clients.forEach((ws: any) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on("close", () => {
    clearInterval(interval);
  });
};

async function handleWaiting(ws: any, data: any, broadcast: Function) {
  try {
    const { gameId, userId } = data;

    if (!gameId || !userId) {
      ws.send(
        JSON.stringify({
          type: "ERROR",
          payload: "Game ID and User ID are required",
        }),
      );
      return;
    }

    // Find the game
    const game = await Game.findById(gameId);

    if (!game) {
      ws.send(
        JSON.stringify({
          type: "ERROR",
          payload: "Game not found",
        }),
      );
      return;
    }

    // Store game and user info in WebSocket connection
    ws.gameId = gameId;
    ws.userId = userId;

    console.log(`User ${userId} is ready in game ${gameId}.`);
    // Check if the user is already in the readyUsersArray
    console.log("game.readyUsersArray", game.readyUsersArray);
    console.log("userId", userId);
    console.log("game.readyUsersArray", game.readyUsersArray?.includes(userId));
    if (!game.readyUsersArray || !game.readyUsersArray.includes(userId)) {
      // If readyUsersArray doesn't exist, create it
      if (!game.readyUsersArray) {
        game.readyUsersArray = [];
      }
      // Add the user to the array
      game.readyUsersArray.push(userId);
      // Increment the ready users count
      game.readyUsers = (game.readyUsers || 0) + 1;
    } else {
      console.log(`User ${userId} is already ready in game ${gameId}.`);
    }
    await game.save();

    console.log(`Game ${gameId} ready users: ${game.readyUsers}`);
    // Notify the user
    ws.send(
      JSON.stringify({
        type: "PLAYER_READY_CONFIRMED",
        payload: {
          gameId,
          message: "Player is ready",
        },
      }),
    );

    // Broadcast to all players in this game
    broadcast({
      type: "PLAYER_READY",
      payload: {
        gameId,
        userId,
      },
    });
  } catch (error) {
    console.error("Error handling player ready:", error);
    ws.send(
      JSON.stringify({
        type: "ERROR",
        payload: "Failed to set player as ready",
      }),
    );
  }
}

// Handler for starting a game
async function handleStartGame(ws: any, data: any, broadcastToGame: Function) {
  try {
    const { gameId, userId } = data;

    if (!gameId || !userId) {
      ws.send(
        JSON.stringify({
          type: "ERROR",
          payload: "Game ID and User ID are required",
        }),
      );
      return;
    }

    // Find the game
    const game = await Game.findById(gameId);

    if (!game) {
      ws.send(
        JSON.stringify({
          type: "ERROR",
          payload: "Game not found",
        }),
      );
      return;
    }

    // Store game and user info in WebSocket connection
    ws.gameId = gameId;
    ws.userId = userId;

    // Increment connected users
    // Check if the user is already in the connectedUsersArray
    if (
      !game.connectedUsersArray ||
      !game.connectedUsersArray.includes(userId)
    ) {
      // If connectedUsersArray doesn't exist, create it
      if (!game.connectedUsersArray) {
        game.connectedUsersArray = [];
      }
      // Add the user to the array
      game.connectedUsersArray.push(userId);
      // Increment the connected users count
      game.connectedUsers = (game.connectedUsers || 0) + 1;
    } else {
      console.log(`User ${userId} is already connected to game ${gameId}.`);
    }
    await game.save();

    console.log(
      `User ${userId} started game ${gameId}. Connected users: ${game.connectedUsers}`,
    );

    // Notify the user
    ws.send(
      JSON.stringify({
        type: "GAME_STARTED",
        payload: {
          gameId,
          connectedUsers: game.connectedUsers,
          message: "Game connected successfully",
        },
      }),
    );

    // Broadcast to all players in this game
    broadcastToGame(gameId, {
      type: "PLAYER_JOINED",
      payload: {
        gameId,
        userId,
        connectedUsers: game.connectedUsers,
      },
    });
  } catch (error) {
    console.error("Error handling start game:", error);
    ws.send(
      JSON.stringify({
        type: "ERROR",
        payload: "Failed to start game",
      }),
    );
  }
}

// Handler for ending a game (loss or completion)
async function handleEndGame(ws: any, data: any, broadcastToGame: Function) {
  try {
    const { gameId, userId, reason } = data;

    if (!gameId) {
      ws.send(
        JSON.stringify({
          type: "ERROR",
          payload: "Game ID is required",
        }),
      );
      return;
    }

    // Find the game
    const game = await Game.findById(gameId);

    if (!game) {
      ws.send(
        JSON.stringify({
          type: "ERROR",
          payload: "Game not found",
        }),
      );
      return;
    }

    // Remove user from connectedUsersArray ONLY if they lost or disconnected
    // Do NOT remove if they completed successfully (they're a winner!)
    if (userId && game.connectedUsersArray && reason !== "completed") {
      const idx = game.connectedUsersArray.indexOf(userId);
      if (idx !== -1) {
        game.connectedUsersArray.splice(idx, 1);
        console.log(
          `Removed user ${userId} from connectedUsersArray (reason: ${reason})`,
        );
      }
    } else if (reason === "completed") {
      console.log(
        `User ${userId} completed game - keeping in connectedUsersArray as winner`,
      );
    }

    // Decrement connected users count
    game.connectedUsers = Math.max((game.connectedUsers || 1) - 1, 0);
    await game.save();

    console.log(
      `User ${userId} ended game ${gameId}. Reason: ${reason}. Connected users: ${game.connectedUsers}. Survivors: ${game.connectedUsersArray?.length || 0}`,
    );

    // Notify the user
    ws.send(
      JSON.stringify({
        type: "GAME_ENDED",
        payload: {
          gameId,
          connectedUsers: game.connectedUsers,
          survivors: game.connectedUsersArray?.length || 0,
          message: "Game ended successfully",
        },
      }),
    );

    // Broadcast to all players in this game
    broadcastToGame(gameId, {
      type: "PLAYER_LEFT",
      payload: {
        gameId,
        userId,
        reason: reason || "unknown",
        connectedUsers: game.connectedUsers,
        survivors: game.connectedUsersArray?.length || 0,
      },
    });

    // Clear game info from WebSocket connection
    ws.gameId = null;
    ws.userId = null;
  } catch (error) {
    console.error("Error handling end game:", error);
    ws.send(
      JSON.stringify({
        type: "ERROR",
        payload: "Failed to end game",
      }),
    );
  }
}

// Handler for disconnect
async function handleDisconnect(ws: any, broadcastToGame: Function) {
  try {
    const { gameId, userId } = ws;

    if (!gameId) return;

    // Find the game
    const game = await Game.findById(gameId);

    if (!game) return;

    // Remove user from connectedUsersArray
    if (userId && game.connectedUsersArray) {
      const idx = game.connectedUsersArray.indexOf(userId);
      if (idx !== -1) {
        game.connectedUsersArray.splice(idx, 1);
        console.log(
          `Removed disconnected user ${userId} from connectedUsersArray`,
        );
      }
    }

    // Also remove from readyUsersArray if present
    if (userId && game.readyUsersArray) {
      const readyIdx = game.readyUsersArray.indexOf(userId);
      if (readyIdx !== -1) {
        game.readyUsersArray.splice(readyIdx, 1);
        game.readyUsers = Math.max((game.readyUsers || 1) - 1, 0);
        console.log(`Removed disconnected user ${userId} from readyUsersArray`);
      }
    }

    // Decrement connected users count
    game.connectedUsers = Math.max((game.connectedUsers || 1) - 1, 0);
    await game.save();

    console.log(
      `User ${userId} disconnected from game ${gameId}. Connected users: ${game.connectedUsers}. Survivors: ${game.connectedUsersArray?.length || 0}`,
    );

    // Broadcast to all players in this game
    broadcastToGame(gameId, {
      type: "PLAYER_DISCONNECTED",
      payload: {
        gameId,
        userId,
        connectedUsers: game.connectedUsers,
        survivors: game.connectedUsersArray?.length || 0,
      },
    });
  } catch (error) {
    console.error("Error handling disconnect:", error);
  }
}

// Handler for chat messages
function handleChatMessage(data: any, broadcast: Function) {
  const response = {
    type: "BROADCAST",
    timestamp: new Date().toLocaleTimeString(),
    sender: data.sender || "Mobile App",
    content: data.message || "No message content",
  };

  broadcast(response);
}

export { initializeWs };
