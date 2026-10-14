import express from 'express';
import { createProfile, deleteProfile, getProfiles, updateProfile } from '../controllers/profile.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.get("/", verifyToken, getProfiles);
router.post("/", verifyToken, createProfile);
router.put("/:id", verifyToken, updateProfile);
router.delete("/:id", verifyToken, deleteProfile);

export default router;
