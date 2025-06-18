import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token is required' });
  }

  try {
    // Verify the token with Supabase
    const { data, error } = await supabase.auth.getUser(token);

    if (error) {
      console.error('Token verification error:', error);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    if (!data.user) {
      return res.status(403).json({ error: 'Invalid token - no user found' });
    }

    // Check if the user is an admin
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (adminError) {
      console.error('Admin verification error:', adminError);
      return res.status(403).json({ error: 'User is not an admin' });
    }

    if (!adminData) {
      return res.status(403).json({ error: 'Unauthorized access - admin not found' });
    }

    req.user = data.user;
    req.admin = adminData;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(403).json({ error: 'Authentication failed' });
  }
};