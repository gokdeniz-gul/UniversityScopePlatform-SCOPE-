import { Router } from 'express';
import { verifyToken, requireRole } from '../middlewares/auth.middleware';
import {
  createCategory, updateCategory, deleteCategory, getCategories,
  createAnnouncement, getAnnouncements,
  getAllUsers, toggleUserStatus
} from '../controllers/admin.controller';

const router = Router();

// Public read routes (no auth required)
router.get('/announcements', getAnnouncements);
router.get('/categories', getCategories);

// All routes below require authentication
router.use(verifyToken);

// Announcements (Admin write)
router.post('/announcements', requireRole(['ADMIN']), createAnnouncement);

// Categories (Admin write)
router.post('/categories', requireRole(['ADMIN']), createCategory);
router.put('/categories/:categoryId', requireRole(['ADMIN']), updateCategory);
router.delete('/categories/:categoryId', requireRole(['ADMIN']), deleteCategory);

// Users (Admin only)
router.get('/users', requireRole(['ADMIN']), getAllUsers);
router.put('/users/:userId/toggle-status', requireRole(['ADMIN']), toggleUserStatus);

export default router;
