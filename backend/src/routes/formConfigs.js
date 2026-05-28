import express from 'express';
import FormConfig from '../models/FormConfig.js';

const router = express.Router();

// GET /api/form-configs - Get all configs
router.get('/', async (req, res, next) => {
  try {
    const configs = await FormConfig.find({}).sort({ createdAt: -1 });
    res.json(configs);
  } catch (error) {
    next(error);
  }
});

// GET /api/form-configs/:id - Get a config by ID
router.get('/:id', async (req, res, next) => {
  try {
    const config = await FormConfig.findById(req.params.id);
    if (!config) {
      return res.status(404).json({ error: 'Form configuration not found' });
    }
    res.json(config);
  } catch (error) {
    next(error);
  }
});

export default router;
