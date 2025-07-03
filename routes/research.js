import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get all research papers with advanced search
router.get('/', async (req, res) => {
  try {
    const { journal, search, limit = 12, page = 1 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = supabase.from('researches').select('*', { count: 'exact' });
    
    // Journal filtering
    if (journal) {
      query = query.eq('journal', journal);
    }
    
    // Simple search using ilike for better compatibility
    if (search) {
      query = query.or(`title.ilike.%${search}%,abstract.ilike.%${search}%,journal.ilike.%${search}%`);
    }
    
    const { data, error, count } = await query
      .order('publication_date', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);
    
    if (error) throw error;
    
    res.json({
      data,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching research papers:', error);
    res.status(500).json({ error: 'Failed to fetch research papers' });
  }
});

// Get single research paper by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('researches')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Research paper not found' });
      }
      throw error;
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching research paper:', error);
    res.status(500).json({ error: 'Failed to fetch research paper' });
  }
});

// Get available journals
router.get('/journals/list', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('researches')
      .select('journal');
    
    if (error) throw error;
    
    // Extract unique journal names
    const journals = [...new Set(data.map(item => item.journal))];
    
    res.json(journals);
  } catch (error) {
    console.error('Error fetching journals:', error);
    res.status(500).json({ error: 'Failed to fetch journals' });
  }
});

export default router;