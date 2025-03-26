import { Router } from "express";
const router = Router();

router.post("/bfl-ux", async (req, res) => {
  console.log("bfl webhook:", req.body, req.query);
})

router.post("/leonardo", async (req, res) => {
  console.log("leonardo webhhok:", req.body, req.query);
})


export default router;