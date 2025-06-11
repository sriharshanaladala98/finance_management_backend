const Asset = require("../models/assetsModel");
const dayjs = require("dayjs");

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

        if (!assetName || !description || !purchaseValue || !paymentMethod || !acquiredDate) {
            return res.status(400).json({ 
                message: "Missing required fields",
                details: { assetName, description, purchaseValue, paymentMethod, acquiredDate }
            });
        }

        if (typeof purchaseValue !== 'number') {
            return res.status(400).json({ 
                message: "Invalid purchaseValue type - must be number",
                received: typeof purchaseValue
            });
        }

        const nextAuditDate = calculateNextAuditDate(acquiredDate, auditFrequency);

        const newAsset = {
            userId,
            assetName,
            description,
            purchaseValue,
            paymentMethod,
            acquiredDate,
            auditFrequency,
            nextAuditDate,
            lastAuditedDate: null
        };

        const createdAsset = await Asset.addAsset(newAsset);
        res.status(201).json({ message: "Asset added successfully", asset: createdAsset });
    } catch (error) {
        console.error("Asset creation error:", error);
        res.status(500).json({ message: "Server error", error });
    }
};

exports.getAssets = async (req, res) => {
    try {
        const assets = await Asset.getAssetsByUserId(req.user.id);
        assets.sort((a, b) => new Date(b.acquiredDate) - new Date(a.acquiredDate));
        res.json(assets);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

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

        const updatedAsset = await Asset.updateAsset(id, updates);
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
        const deletedAsset = await Asset.deleteAsset(id);
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
        const { id } = req.params;
        const assets = await Asset.getAssetsByUserId(req.user.id);
        const asset = assets.find(a => a.id === id);
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
        const { id } = req.params;
        const assets = await Asset.getAssetsByUserId(req.user.id);
        const asset = assets.find(a => a.id === id);
        if (!asset) {
            return res.status(404).json({ message: "Asset not found" });
        }

        const lastAuditedDate = new Date();
        const nextAuditDate = calculateNextAuditDate(lastAuditedDate, asset.auditFrequency);

        const updatedAsset = await Asset.updateAsset(id, {
            lastAuditedDate,
            nextAuditDate
        });

        res.json({ message: "Audit recorded successfully", asset: updatedAsset });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
