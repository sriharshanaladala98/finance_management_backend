const Asset = require("../models/assetsModel");
const mongoose = require("mongoose");
const dayjs = require("dayjs");

exports.addAsset = async (req, res) => {
    try {
        const {
            userId,
            assetName,
            description,
            purchaseValue,
            paymentMethod,
            acquiredDate,
            auditFrequency = "yearly"
        } = req.body;

        // Validate required fields
        if (!assetName || !description || !purchaseValue || !paymentMethod || !acquiredDate) {
            return res.status(400).json({ 
                message: "Missing required fields",
                details: { assetName, description, purchaseValue, paymentMethod, acquiredDate }
            });
        }

        // Type validation
        if (typeof purchaseValue !== 'number') {
            return res.status(400).json({ 
                message: "Invalid purchaseValue type - must be number",
                received: typeof purchaseValue
            });
        }

        // Calculate next audit date
        const nextAuditDate = calculateNextAuditDate(acquiredDate, auditFrequency);

        const newAsset = new Asset({
            userId,
            assetName,
            description,
            purchaseValue,
            paymentMethod,
            acquiredDate,
            auditFrequency,
            nextAuditDate,
            lastAuditedDate: null
        });

        await newAsset.save();
        res.status(201).json({ message: "Asset added successfully", asset: newAsset });
    } catch (error) {
        console.error("Asset creation error:", error);
        res.status(500).json({ message: "Server error", error });
    }
};

exports.getAssets = async (req, res) => {
    try {
        const assets = await Asset.find({ userId: req.user.id })
            .sort({ acquiredDate: -1 });
        res.json(assets);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// Helper function to calculate next audit date
function calculateNextAuditDate(acquiredDate, frequency) {
    const date = dayjs(acquiredDate);
    switch (frequency) {
        case "monthly":
            return date.add(1, 'month').toDate();
        case "quarterly":
            return date.add(3, 'months').toDate();
        case "yearly":
            return date.add(1, 'year').toDate();
        default:
            return date.add(1, 'year').toDate();
    }
}

exports.updateAsset = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        if (updates.auditFrequency) {
            updates.nextAuditDate = calculateNextAuditDate(
                updates.acquiredDate || new Date(), 
                updates.auditFrequency
            );
        }

        const updatedAsset = await Asset.findByIdAndUpdate(id, updates, { new: true });
        if (!updatedAsset) {
            return res.status(404).json({ message: "Asset not found" });
        }
        res.json({ message: "Asset updated successfully", asset: updatedAsset });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

exports.deleteAsset = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedAsset = await Asset.findByIdAndDelete(id);
        if (!deletedAsset) {
            return res.status(404).json({ message: "Asset not found" });
        }
        res.json({ message: "Asset deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

exports.getAsset = async (req, res) => {
    try {
        const asset = await Asset.findOne({ 
            _id: req.params.id, 
            userId: req.user.id 
        });
        if (!asset) {
            return res.status(404).json({ message: "Asset not found" });
        }
        res.json(asset);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

exports.recordAudit = async (req, res) => {
    try {
        const asset = await Asset.findById(req.params.id);
        if (!asset) {
            return res.status(404).json({ message: "Asset not found" });
        }

        asset.lastAuditedDate = new Date();
        asset.nextAuditDate = calculateNextAuditDate(
            asset.lastAuditedDate, 
            asset.auditFrequency
        );
        
        await asset.save();
        res.json({ message: "Audit recorded successfully", asset });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
