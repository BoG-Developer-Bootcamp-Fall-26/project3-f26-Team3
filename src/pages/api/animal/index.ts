import connectDB from "@server/mongodb";
import Animal from "@server/mongodb/models/Animal"
import User from "@server/mongodb/models/User";
import mongoose from "mongoose";
import type { NextApiRequest, NextApiResponse } from "next";
import * as argon2 from "argon2";
import TrainingLog from "@server/mongodb/models/TrainingLog";

/*
Create a POST endpoint at /api/animal to create an animal in the database based on information passed into the body
Create a PATCH endpoint at /api/animal to update the hoursTrained of an animal whenever a new training log is made or updated

*/
export default async function handler(req: NextApiRequest, res: NextApiResponse ) {
    if (req.method !== "POST" && req.method !== "PATCH" && req.method !== "DELETE") {
        res.setHeader("Allow", ["POST", "PATCH", "DELETE"]);
        return res.status(500).json({ error: `Method ${req.method} not supported` });
    }

    try {
        await connectDB();
        /* Incorporate a way to delete users, animals,
         and training logs (which would cause animal hoursTrained to be decremented)
          and follow similar response formats as before for error handling.
        */
       // Handle DELETE request for animals
        if (req.method === "DELETE") {
            const { id, password } = req.body ?? {};
            
            if (!mongoose.isObjectIdOrHexString(id) ||
            typeof password !== "string" || !password) {
                return res.status(400).json({ error: "Invalid ID or password" });
            }
            
            try {
                const animal = await Animal.findById(id);
                if (!animal) {
                    return res.status(400).json({ error: "Animal not found" });
                }
                
                const owner = await User.findById(animal.owner);
                if (!owner || !(await argon2.verify(owner.password, password))) {
                    return res.status(401).json({ error: "Invalid credentials" });
                }
                
                await TrainingLog.deleteMany({ animal: id });
                await Animal.findByIdAndDelete(id);
                
                return res.status(200).json({ id });
            
            } catch {
                return res.status(500).json({ error: "Failed to delete animal" });
            }
        }
    } catch {
        return res.status(500).json({ error: "DB connection failed" });
    }

    if (req.method === "POST") {
        const { name, breed, owner, profilePicture } = req.body ?? {};
        const hoursTrained = parseFloat(req.body?.hoursTrained);
        if (
            !name ||
            !breed ||
            !mongoose.isObjectIdOrHexString(owner) ||
            !Number.isFinite(hoursTrained) ||
            hoursTrained < 0 ||
            !isValidURL(profilePicture) // check if profile pic is a valid url.
        ) {
            return res.status(400).json({ error: "Missing or invalid fields" });
        }

        if (!(await User.exists({ _id: owner }))) {
            return res.status(400).json({ error: "Animal owner does not exist" });
        }

        try {
            const animal = await Animal.create({ name, breed, owner, hoursTrained, profilePicture });
            return res.status(200).json({ id: animal._id });
        } catch {
            return res.status(500).json({ error: "Failed to create animal" });
        }
    } else {
        const { animal } = req.body ?? {};
        const hours = parseFloat(req.body?.hours);
        if (!mongoose.isObjectIdOrHexString(animal) || !Number.isFinite(hours)) {
            return res.status(400).json({ error: "Missing or invalid fields" });
        }

        try {
            const updated = await Animal.findByIdAndUpdate(
                animal,
                { $inc: { hoursTrained: hours } },
                { returnDocument: "after" }
            );
            if (!updated) {
                return res.status(400).json({ error: "Animal does not exist" });
            }
            return res.status(200).json({ hoursTrained: updated.hoursTrained });
        } catch {
            return res.status(500).json({ error: "Failed to update animal" });
        }
    }
}

// a funciton that checks if the URL is in a valid format
function isValidURL(url: unknown) {
    if (typeof url !== "string") return false;
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}