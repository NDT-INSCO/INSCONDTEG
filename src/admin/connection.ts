import { createContext, useContext } from 'react';
import { adminClient, type AdminClient } from './client';

/** One transport/session for the authenticated workspace, login, and passkey dialogs. */
export const AdminConnection = createContext<AdminClient>(adminClient);
export function useAdminClient(): AdminClient { return useContext(AdminConnection); }
