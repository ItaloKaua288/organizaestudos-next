import express from 'express';
import { addStudyTime, changePassword, deleteUserAdmin, getAccount, getAllUsersAdmin, getStudyTime, updateUser, updateUserAdmin } from '../controllers/user.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.get("/me", verifyToken, getAccount);
router.put("/update-user", verifyToken, updateUser);
router.put("/change-password", verifyToken, changePassword);
router.post("/add-study-time", verifyToken, addStudyTime);
router.get("/get-study-time", verifyToken, getStudyTime);


router.get("/admin/users", verifyToken, getAllUsersAdmin);
router.put("/admin/users/:id", verifyToken, updateUserAdmin);
router.delete("/admin/delete-user/:id", verifyToken, deleteUserAdmin);


export default router;
