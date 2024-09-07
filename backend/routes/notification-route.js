import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { deleteNotifications, deleteOneNotification, getNotifications } from "../controllers/notification-controller.js";

const router = express.Router();

router.get("/", protectRoute, getNotifications);
router.delete("/", protectRoute, deleteNotifications);
router.delete("/:id", protectRoute, deleteOneNotification); // This is not implemented

export default router;deleteNotifications