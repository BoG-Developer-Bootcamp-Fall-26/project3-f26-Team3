import connectDB from "@server/mongodb";
import User from "@server/mongodb/models/User";
import Animal from "@server/mongodb/models/Animal";
import TrainingLog from "@server/mongodb/models/TrainingLog";
import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import * as argon2 from "argon2";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST" && req.method !== "DELETE") {
        res.setHeader("Allow", ["POST", "DELETE"]);
        return res.status(500).json({ error: `Method ${req.method} not supported` });
    }

    try {
        await connectDB();
    } catch {
        return res.status(500).json({ error: "DB connection failed" });
    }

    /* Incorporate a way to delete users, animals,
       and training logs (which would cause animal hoursTrained to be decremented)
       and follow similar response formats as before for error handling.
    */
    // Handle DELETE request for training logs
    if (req.method === "DELETE") {
        const { id, password } = req.body ?? {};

        if (!mongoose.isObjectIdOrHexString(id) ||
            typeof password !== "string" || !password) {
            return res.status(400).json({ error: "Invalid ID or password" });
        }

        try {
            const log = await TrainingLog.findById(id);
            if (!log) {
                return res.status(400).json({ error: "Training log not found" });
            }

            const owner = await User.findById(log.user);
            if (!owner || !(await argon2.verify(owner.password, password))) {
                return res.status(401).json({ error: "Invalid credentials" });
            }

            const deleted = await TrainingLog.findByIdAndDelete(id);
            if (!deleted) {
                return res.status(400).json({ error: "Training log not found" });
            }

            await Animal.findByIdAndUpdate(
                deleted.animal,
                { $inc: { hoursTrained: -deleted.hours } }
            );

            return res.status(200).json({ id: deleted._id });
        } catch {
            return res.status(500).json({ error: "Failed to delete training log" });
        }
    }

    const { user, animal, title, date, description } = req.body ?? {};
    const hours = parseFloat(req.body?.hours);
    const parsedDate = new Date(date);
    if (
        !mongoose.isObjectIdOrHexString(user) || 
        !mongoose.isObjectIdOrHexString(animal) ||
        !title ||
        !(typeof date === "string") ||
        isNaN(parsedDate.getTime()) ||
        !description ||
        !Number.isFinite(hours) || 
        hours < 0
    ) {
        return res.status(400).json({ error: "Missing or invalid fields" });
    }

    try {
        const owned = await Animal.exists({ _id: animal, owner: user });
        if (!owned) {
            return res.status(400).json({ error: "Animal does not exist or belong to user" });
        }

        const trainingLog = await TrainingLog.create({ user, animal, title, date: parsedDate, description, hours });
        
        // bug fix: update anial trained hours
        await Animal.findByIdAndUpdate(animal, { $inc: { hoursTrained: hours } });

        return res.status(200).json({ id: trainingLog._id });
    } catch {
        return res.status(500).json({ error: "Failed to create training log" });
    }
}