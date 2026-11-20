import { createNetlifyHandler } from '../../server/admin/netlify.js';

// Custom paths preserve the original URL, query and method without an SPA rewrite.
export const config = {
  path: ['/api/admin', '/api/admin/*', '/api/rfq', '/api/site/announcement'],
};

export default createNetlifyHandler(process.env);
