import { Handler } from '@netlify/functions';
import express from 'express';
import serverless from 'serverless-http';
import apiRouter from '../../server/src/routes/api';

const app = express();
app.use(express.json());
app.use('/api', apiRouter);

export const handler: Handler = serverless(app); 