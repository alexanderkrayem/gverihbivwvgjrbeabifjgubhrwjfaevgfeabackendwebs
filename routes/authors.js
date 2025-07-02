import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get author by name
router.get('/:name', async (req, res) => {
  try {
    const { name } = req.params;
    
    const { data, error } = await supabase
      .from('authors')
      .select('*')
      .eq('name', decodeURIComponent(name))
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    // If author not found, return default author info
    if (!data) {
      return res.json({
        name: decodeURIComponent(name),
        bio: 'طبيب أسنان متخصص ومؤلف في مجال طب الأسنان',
        image: 'https://images.pexels.com/photos/5327585/pexels-photo-5327585.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
        specialization: 'طب الأسنان العام',
        experience_years: 5,
        education: 'بكالوريوس طب وجراحة الأسنان',
        location: 'المملكة العربية السعودية'
      });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching author:', error);
    res.status(500).json({ error: 'Failed to fetch author' });
  }
});

// Get all authors
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('authors')
      .select('*')
      .order('name');
    
    if (error) throw error;
    
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching authors:', error);
    res.status(500).json({ error: 'Failed to fetch authors' });
  }
});

export default router;