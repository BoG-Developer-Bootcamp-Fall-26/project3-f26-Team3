import connectDB from "@server/mongodb";
import User from "@server/mongodb/models/User";
import Animal from "@server/mongodb/models/Animal";
import TrainingLog from "@server/mongodb/models/TrainingLog";
import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import * as argon2 from "argon2";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET" && req.method !== "POST" && req.method !== "PATCH" && req.method !== "DELETE") {
        res.setHeader("Allow", ["GET", "POST", "PATCH", "DELETE"]);
        return res.status(500).json({ error: `Method ${req.method} not supported` });
    }

    try {
        await connectDB();
    } catch {
        return res.status(500).json({ error: "DB connection failed" });
    }

    if (req.method === "GET") {
        const { user, id } = req.query;
        if(id) {
            if (!mongoose.isObjectIdOrHexString(id)) {
                return res.status(400).json({ error: "Invalid id" });
            }
            try {
                const log = await TrainingLog.findById(id).populate("user", "fullName").populate("animal", "name breed");
                if (!log) {
                    return res.status(400).json({ error: "Training log does not exist" });
                }
                return res.status(200).json(log);
            } catch {
                return res.status(500).json({ error: "Failed to fetch training log" });
            }
        }
        if (!mongoose.isObjectIdOrHexString(user)) {
            return res.status(400).json({ error: "Missing or invalid user" });
        }
        try {
            const logs = await TrainingLog.find({ user })
                .populate("user", "fullName")
                .populate("animal", "name breed")
                .sort({ date: -1 });
            return res.status(200).json(logs);
        } catch {
            return res.status(500).json({ error: "Failed to fetch training logs"});
        }
    }

    if (req.method === "PATCH") {
        const { id, user, animal, title, description } = req.body ?? {};
        const hours = parseFloat(req.body?.hours);
        if (
            !mongoose.isObjectIdOrHexString(id) ||
            !mongoose.isObjectIdOrHexString(user) ||
            !mongoose.isObjectIdOrHexString(animal) ||
            !title ||
            !description ||
            !Number.isFinite(hours) ||
            hours < 0
        ) {
            return res.status(400).json({ error: "Missing or invalid fields" });
        }
        try {
            const log = await TrainingLog.findById(id);
            if (!log) {
                return res.status(400).json({ error: "Training log does not exist" });
            }
            if (String(log.user) !== user) {
                return res.status(400).json({ error: "Training log does not belong to user" });
            }
            const owned = await Animal.exists({ _id: animal, owner: user });
            if (!owned) {
                return res.status(400).json({ error: "Animal does not exist or belong to user" });
            }

            log.animal = animal;
            log.title = title;
            log.description = description;
            log.hours = hours;
            await log.save();
            return res.status(200).json({ id: log._id });
        } catch {
            return res.status(500).json({ error: "Failed to update training log" });
        }
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
        

        return res.status(200).json({ id: trainingLog._id });
    } catch {
        return res.status(500).json({ error: "Failed to create training log" });
    }
}