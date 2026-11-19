/** Vercel Node function. Vite publishes dist/ independently of this API. */
import { createVercelHandler } from '../server/admin/vercel.js';

export default createVercelHandler(process.env);
