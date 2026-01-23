import express, { Request, Response } from 'express';
import http from "http";
import connectDB from './db/connection';
import authRoute from "./routers/authRouter";
import gameAdminRouter from './routers/gameAdminRouter';
import gameRouter from './routers/gameRouter';
import healthRoute from "./routers/health";
import imageRoutes from './routers/imageRoutes';
import notificationRoutes from './routers/notificationRoutes';
import paymentRoutes from "./routers/paymentRouter";
import userRouter from "./routers/userRouter";
import walletRouter from "./routers/walletRouter";

import splashAdRouter from './routers/splashAdRouter';
import { initializeWs } from './services/webSocket';
var cors = require('cors')

const app = express();

connectDB();
app.use(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  (req, res, next) => {
    // Store raw body for signature verification
    if (req.body) {
      (req as any).rawBody = req.body.toString();
    }
    next();
  }
);

app.use(cors());
app.use(express.json());
// console.log("app request", app.request)

app.get('/api/status', (req, res) => {
    console.log('HTTP request received on /api/status');
    res.json({ status: 'API operational', realTime: 'WebSocket initialized on this server.' });
});

const server = http.createServer(app);

initializeWs(server); 

app.use('/api', splashAdRouter);
app.use('/upload', imageRoutes);
app.use('/health', healthRoute);
app.use('/auth', authRoute);
app.use('/games', gameRouter);
app.use('/admin', gameAdminRouter);
app.use('/wallet', walletRouter);
app.use('/api/wallet', walletRouter);
app.use('/users', userRouter);
app.use('/api/notifications', notificationRoutes);
app.use("/api/payments", paymentRoutes);


export { app, server };
