import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get all articles with advanced search
router.get('/', async (req, res) => {
  try {
    const { tag, search, limit = 12, page = 1 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = supabase.from('articles').select('*', { count: 'exact' });
    
    // Tag filtering
    if (tag) {
      query = query.contains('tags', [tag]);
    }
    
    // Advanced search using Full Text Search
    if (search) {
      // Use PostgreSQL Full Text Search with trigram similarity
      query = query.or(`
        title.ilike.%${search}%,
        excerpt.ilike.%${search}%,
        content.ilike.%${search}%,
        author.ilike.%${search}%
      `);
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
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

// Get featured articles
router.get('/featured', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('is_featured', true)
      .order('publication_date', { ascending: false })
      .limit(5);
    
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching featured articles:', error);
    res.status(500).json({ error: 'Failed to fetch featured articles' });
  }
});

// Get single article by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Article not found' });
      }
      throw error;
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

// Get related articles
router.get('/:id/related', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 3 } = req.query;
    
    // First get the article to get its tags
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('tags')
      .eq('id', id)
      .single();
    
    if (articleError) throw articleError;
    
    // Then get related articles based on tags
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .neq('id', id)
      .overlaps('tags', article.tags)
      .order('publication_date', { ascending: false })
      .limit(parseInt(limit));
    
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching related articles:', error);
    res.status(500).json({ error: 'Failed to fetch related articles' });
  }
});

// Search articles with advanced FTS
router.get('/search/advanced', async (req, res) => {
  try {
    const { q, limit = 10, page = 1 } = req.query;
    const offset = (page - 1) * limit;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    // Use PostgreSQL Full Text Search with ranking
    const { data, error, count } = await supabase
      .rpc('search_articles_fts', {
        search_query: q,
        result_limit: parseInt(limit),
        result_offset: offset
      });
    
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
    console.error('Error in advanced search:', error);
    res.status(500).json({ error: 'Failed to perform advanced search' });
  }
});

export default router;