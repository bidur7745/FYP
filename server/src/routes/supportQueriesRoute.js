import express from "express";
import { authenticate, optionalAuthenticate, authorize } from "../middleware/auth.js";
import {
  submitSupportController,
  listSupportQueriesController,
  getMyQueriesController,
  replySupportQueryController,
} from "../controllers/supportQueriesController.js";

const router = express.Router();

router.post("/", optionalAuthenticate, submitSupportController);
router.get("/my-queries", authenticate, getMyQueriesController);
router.get("/", authenticate, authorize("admin"), listSupportQueriesController);
router.put("/:id", authenticate, authorize("admin"), replySupportQueryController);

export default router;
