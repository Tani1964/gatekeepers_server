import express, { Request, Response } from 'express';
import connectDB from './db/connection';
import authRoute from "./routers/authRouter";
import gameAdminRouter from './routers/gameAdminRouter';
import gameRouter from './routers/gameRouter';
import healthRoute from "./routers/health";
import notificationRoutes from './routers/notificationRoutes';
import userRouter from "./routers/userRouter";
import walletRouter from "./routers/walletRouter";

var cors = require('cors')

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
// console.log("app request", app.request)

app.use('/health', healthRoute);
app.use('/auth', authRoute);
app.use('/games', gameRouter);
app.use('/admin', gameAdminRouter);
app.use('/wallet', walletRouter);
app.use('/users', userRouter);
app.use('/api/notifications', notificationRoutes);


export default app;