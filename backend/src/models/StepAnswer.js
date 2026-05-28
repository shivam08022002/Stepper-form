import mongoose from 'mongoose';

const { Schema } = mongoose;

const stepAnswerSchema = new Schema({
  submissionId: { type: Schema.Types.ObjectId, ref: 'Submission', required: true },
  stepId: { type: String, required: true },
  answers: { type: Schema.Types.Mixed, default: {} },
  savedAt: { type: Date, default: Date.now }
});

stepAnswerSchema.index({ submissionId: 1, stepId: 1 }, { unique: true });

const StepAnswer = mongoose.model('StepAnswer', stepAnswerSchema);
export default StepAnswer;
