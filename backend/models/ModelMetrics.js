import mongoose from 'mongoose';

const ModelMetricsSchema = new mongoose.Schema({
  model_name: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  accuracy: { type: Number, required: true },
  precision: { type: Number, required: true },
  recall: { type: Number, required: true },
  f1_score: { type: Number, required: true },
  roc_auc: { type: Number, required: true },
  training_time: { type: Number, required: true },
  confusion_matrix: {
    tn: { type: Number, required: true },
    fp: { type: Number, required: true },
    fn: { type: Number, required: true },
    tp: { type: Number, required: true }
  },
  feature_importance: [{
    feature: { type: String, required: true },
    importance: { type: Number, required: true }
  }],
  roc_curve: [{
    fpr: { type: Number, required: true },
    tpr: { type: Number, required: true }
  }],
  pr_curve: [{
    recall: { type: Number, required: true },
    precision: { type: Number, required: true }
  }],
  cross_val_scores: { type: [Number] }
}, {
  timestamps: true
});

export default mongoose.model('ModelMetrics', ModelMetricsSchema);
