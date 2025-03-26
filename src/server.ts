import express, { Request, Response } from "express";
import "dotenv/config";
import routes from "./routes";
import cors from "cors";
import helmet from "helmet";

const app = express();
const port = process.env.PORT || 3000;



app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                // Adjust based on your frontend
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "blob:"],
                connectSrc: ["'self'", ...(process.env.SUPABASE_URL ? [process.env.SUPABASE_URL] : [])],
                frameAncestors: ["'none'"], // Prevent embedding in iframes
            },
        },
        frameguard: { action: "deny" }, // X-Frame-Options: DENY
        referrerPolicy: { policy: "no-referrer" }, // Referrer-Policy: no-referrer
        hsts: { maxAge: 63072000, includeSubDomains: true, preload: true }, // Strict-Transport-Security
        noSniff: true, // X-Content-Type-Options: nosniff
    })
);
app.use(cors({ origin: "*" })); // accept all origin
app.use(express.json());


app.get("/", (req: Request, res: Response) => {
res.send("Hello, Express with TypeScript!");
});



app.use("/api", routes);



app.listen(port, () => {
console.log(`Server listening on port ${port}`);
});
