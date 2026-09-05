const mongoose = require('mongoose');

const checkSchema = new mongoose.Schema({ key: String, label: String, status: String, evidence: String, rule: String, finding: String }, { _id: false });

module.exports = mongoose.model('Audit', new mongoose.Schema({ productName: String, pageTitle: String, sourceUrl: String, inspector: String, location: String, imageName: String, ocrText: String, createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, createdByEmail: String, checks: [checkSchema], score: Number, status: String, summary: { total: Number, passed: Number, failed: Number, warnings: Number }, inspectedAt: Date }, { timestamps: true }));