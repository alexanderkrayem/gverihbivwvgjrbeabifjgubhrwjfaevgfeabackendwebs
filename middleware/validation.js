export const validateArticle = (req, res, next) => {
  const { title, excerpt, content, author } = req.body;
  const errors = [];

  if (!title || title.trim() === '') {
    errors.push('Title is required');
  }

  if (!excerpt || excerpt.trim() === '') {
    errors.push('Excerpt is required');
  }

  if (!content || content.trim() === '') {
    errors.push('Content is required');
  }

  if (!author || author.trim() === '') {
    errors.push('Author is required');
  }

  if (!req.file && !req.body.cover_image_url) {
    errors.push('Cover image is required (file or URL)');
  }

  if (!req.body.tags) {
    errors.push('Tags are required');
  } else {
    try {
      const tags = JSON.parse(req.body.tags);
      if (!Array.isArray(tags) || tags.length === 0) {
        errors.push('Tags must be a non-empty array');
      }
    } catch (error) {
      errors.push('Tags must be a valid JSON array');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

export const validateResearch = (req, res, next) => {
  const { title, abstract, authors, journal } = req.body;
  const errors = [];

  if (!title || title.trim() === '') {
    errors.push('Title is required');
  }

  if (!abstract || abstract.trim() === '') {
    errors.push('Abstract is required');
  }

  if (!authors) {
    errors.push('Authors are required');
  } else {
    try {
      const authorsList = JSON.parse(authors);
      if (!Array.isArray(authorsList) || authorsList.length === 0) {
        errors.push('Authors must be a non-empty array');
      }
    } catch (error) {
      errors.push('Authors must be a valid JSON array');
    }
  }

  if (!journal || journal.trim() === '') {
    errors.push('Journal is required');
  }

  if (!req.file) {
    errors.push('Research paper file is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};