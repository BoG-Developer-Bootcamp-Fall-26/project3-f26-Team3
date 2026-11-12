import connectDB from "@server/mongodb";
import User from "@server/mongodb/models/User"
import * as argon2 from "argon2";
import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import Animal from "@server/mongodb/models/Animal";
import TrainingLog from "@server/mongodb/models/TrainingLog";

/*
Create a POST endpoint at /api/user to create a user in the database 
based on information passed into the body. Make sure to hash the password 
using argon2
*/

export default async function handler (req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST" && req.method !== "DELETE") {
        res.setHeader("Allow", ["POST", "DELETE"]);
        return res.status(500).json({ error: `Method ${req.method} not supported` });
    }

    try {
        await connectDB();

        /* Incorporate a way to delete users, animals,
         and training logs (which would cause animal hoursTrained to be decremented)
          and follow similar response formats as before for error handling.
        */
       // DELETE user, animal, training logs
       if (req.method === "DELETE") {
        const { id, password } = req.body ?? {};

        if (!mongoose.isObjectIdOrHexString(id) || 
        typeof password !== "string" || !password) {
            return res.status(400).json({ error: "Invalid ID or password" });
        } 
        try {
            const user = await User.findById(id);
            
            if (!user || !(await argon2.verify(user.password, password))) {
                 return res.status(401).json({ error: "Invalid credentials" });
                }
                 await TrainingLog.deleteMany({ user: id });
                 await Animal.deleteMany({ owner: id });
                 await User.findByIdAndDelete(id);
                 return res.status(200).json({ id });
                } catch {
                    return res.status(500).json({ error: "Failed to delete user" });
                }
            }

            // POST
    } catch {
        return res.status(500).json({ error: "DB connection failed" });
    }

    const {fullName, email, password, admin } = req.body ?? {};
    if (!fullName || !email || !password || typeof admin !== "boolean") {
        return res.status(400).json({ error: "Missing or invalid fields" });
    }

    try {
        if (await User.exists({ email })) {
            return res.status(400).json({error: "User with this email already exists" });
        }
        const hash = await argon2.hash(password);
        const user = await User.create({ fullName, email, password: hash, admin });
        return res.status(200).json({ id: user._id });
    } catch {
        return res.status(500).json({ error: "Failed to create new user" });
    }
}